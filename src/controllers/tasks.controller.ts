import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';
import { getProjectOr404, isMember, requireMember } from '../services/access';

// Les 3 statuts autorises (memes valeurs que l'ENUM en base).
const STATUSES = ['todo', 'in_progress', 'done'];

interface TaskRow extends RowDataPacket {
  id: number;
  project_id: number;
  title: string;
  description: string;
  status: string;
  assignee_id: number | null;
  assignee_name: string | null;
}

// SELECT commun a toutes les lectures de taches : on joint users pour le nom de l'assigne.
const TASK_SELECT = `
  SELECT t.id, t.project_id, t.title, t.description, t.status, t.assignee_id,
         u.name AS assignee_name
    FROM tasks t
    LEFT JOIN users u ON u.id = t.assignee_id`;

async function getTaskOr404(taskId: number): Promise<TaskRow> {
  const [rows] = await pool.query<TaskRow[]>(`${TASK_SELECT} WHERE t.id = ?`, [taskId]);
  if (rows.length === 0) throw new ApiError(404, 'Tache introuvable');
  return rows[0];
}

// Verification manuelle du titre/description d'une tache.
function readTaskBody(body: any): { title: string; description: string } {
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const description = typeof body?.description === 'string' ? body.description : '';
  if (!title) throw new ApiError(400, 'Le titre est obligatoire');
  if (title.length > 200) throw new ApiError(400, 'Le titre est trop long');
  return { title, description };
}

// GET /api/projects/:id/tasks?status=... : liste, avec filtre optionnel (FT4).
export async function listTasks(req: AuthRequest, res: Response) {
  const project = await getProjectOr404(Number(req.params.id));
  await requireMember(project, req.userId!);

  const status = req.query.status;
  if (status !== undefined) {
    if (typeof status !== 'string' || !STATUSES.includes(status)) {
      throw new ApiError(400, 'Statut invalide');
    }
    const [rows] = await pool.query<TaskRow[]>(
      `${TASK_SELECT} WHERE t.project_id = ? AND t.status = ? ORDER BY t.created_at`,
      [project.id, status]
    );
    res.json(rows);
    return;
  }

  const [rows] = await pool.query<TaskRow[]>(
    `${TASK_SELECT} WHERE t.project_id = ? ORDER BY t.created_at`,
    [project.id]
  );
  res.json(rows);
}

// POST /api/projects/:id/tasks : creation (statut 'todo' par defaut, gere par la base).
export async function createTask(req: AuthRequest, res: Response) {
  const project = await getProjectOr404(Number(req.params.id));
  await requireMember(project, req.userId!);
  const { title, description } = readTaskBody(req.body);
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO tasks (project_id, title, description) VALUES (?, ?, ?)',
    [project.id, title, description]
  );
  res.status(201).json(await getTaskOr404(result.insertId));
}

// PUT /api/tasks/:id : modifier titre et description.
export async function updateTask(req: AuthRequest, res: Response) {
  const task = await getTaskOr404(Number(req.params.id));
  const project = await getProjectOr404(task.project_id);
  await requireMember(project, req.userId!);
  const { title, description } = readTaskBody(req.body);
  await pool.query('UPDATE tasks SET title = ?, description = ? WHERE id = ?', [
    title,
    description,
    task.id,
  ]);
  res.json(await getTaskOr404(task.id));
}

// PATCH /api/tasks/:id/status : changer le statut (FT4).
export async function updateTaskStatus(req: AuthRequest, res: Response) {
  const task = await getTaskOr404(Number(req.params.id));
  const project = await getProjectOr404(task.project_id);
  await requireMember(project, req.userId!);

  const status = req.body?.status;
  if (typeof status !== 'string' || !STATUSES.includes(status)) {
    throw new ApiError(400, 'Statut invalide');
  }
  await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [status, task.id]);
  res.json(await getTaskOr404(task.id));
}

// PATCH /api/tasks/:id/assignee : affecter ou desaffecter (FT6).
export async function updateTaskAssignee(req: AuthRequest, res: Response) {
  const task = await getTaskOr404(Number(req.params.id));
  const project = await getProjectOr404(task.project_id);
  await requireMember(project, req.userId!);

  const assigneeId = req.body?.userId ?? null; // l'id du membre, ou null pour desaffecter
  if (assigneeId !== null && (typeof assigneeId !== 'number' || !Number.isInteger(assigneeId))) {
    throw new ApiError(400, 'Assigne invalide');
  }

  if (assigneeId !== null) {
    // Regle metier FT6 : on ne peut affecter qu'a un membre du projet.
    const ok = assigneeId === project.owner_id || (await isMember(project.id, assigneeId));
    if (!ok) throw new ApiError(422, "Cet utilisateur n'est pas participant du projet");
  }

  await pool.query('UPDATE tasks SET assignee_id = ? WHERE id = ?', [assigneeId, task.id]);
  res.json(await getTaskOr404(task.id));
}

// DELETE /api/tasks/:id
export async function deleteTask(req: AuthRequest, res: Response) {
  const task = await getTaskOr404(Number(req.params.id));
  const project = await getProjectOr404(task.project_id);
  await requireMember(project, req.userId!);
  await pool.query('DELETE FROM tasks WHERE id = ?', [task.id]);
  res.status(204).end();
}
