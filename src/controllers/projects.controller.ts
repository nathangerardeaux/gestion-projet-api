import { Response } from 'express';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { pool } from '../config/db';
import { AuthRequest } from '../middlewares/auth';
import { getProjectOr404, isMember, requireMember, requireOwner } from '../services/access';
import { ApiError } from '../middlewares/error';

// verifie le titre et la description
function readProjectBody(body: any): { title: string; description: string } {
  const title = typeof body?.title === 'string' ? body.title.trim() : '';
  const description = typeof body?.description === 'string' ? body.description : '';
  if (!title) throw new ApiError(400, 'Le titre est obligatoire');
  if (title.length > 200) throw new ApiError(400, 'Le titre est trop long');
  return { title, description };
}

// mes projets : proprietaire ou participant
export async function listProjects(req: AuthRequest, res: Response) {
  const userId = req.userId!;
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT p.id, p.title, p.description, p.owner_id, p.created_at
       FROM projects p
       LEFT JOIN project_members m ON m.project_id = p.id
      WHERE p.owner_id = ? OR m.user_id = ?
      ORDER BY p.created_at DESC`,
    [userId, userId]
  );
  res.json(rows);
}

// le proprietaire, c'est l'utilisateur du jeton
export async function createProject(req: AuthRequest, res: Response) {
  const { title, description } = readProjectBody(req.body);
  const [result] = await pool.query<ResultSetHeader>(
    'INSERT INTO projects (title, description, owner_id) VALUES (?, ?, ?)',
    [title, description, req.userId!]
  );
  res.status(201).json(await getProjectOr404(result.insertId));
}

export async function getProject(req: AuthRequest, res: Response) {
  const project = await getProjectOr404(Number(req.params.id));
  await requireMember(project, req.userId!);
  res.json(project);
}

export async function updateProject(req: AuthRequest, res: Response) {
  const project = await getProjectOr404(Number(req.params.id));
  requireOwner(project, req.userId!);
  const { title, description } = readProjectBody(req.body);
  await pool.query('UPDATE projects SET title = ?, description = ? WHERE id = ?', [
    title,
    description,
    project.id,
  ]);
  res.json(await getProjectOr404(project.id));
}

export async function deleteProject(req: AuthRequest, res: Response) {
  const project = await getProjectOr404(Number(req.params.id));
  requireOwner(project, req.userId!);
  await pool.query('DELETE FROM projects WHERE id = ?', [project.id]);
  res.status(204).end();
}

// proprietaire (is_owner=1) + participants (is_owner=0)
export async function listParticipants(req: AuthRequest, res: Response) {
  const project = await getProjectOr404(Number(req.params.id));
  await requireMember(project, req.userId!);
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT u.id, u.email, u.name, 1 AS is_owner
       FROM users u
      WHERE u.id = ?
      UNION
     SELECT u.id, u.email, u.name, 0 AS is_owner
       FROM users u
       JOIN project_members m ON m.user_id = u.id
      WHERE m.project_id = ?
      ORDER BY is_owner DESC, name`,
    [project.owner_id, project.id]
  );
  res.json(rows);
}

export async function addParticipant(req: AuthRequest, res: Response) {
  const project = await getProjectOr404(Number(req.params.id));
  requireOwner(project, req.userId!); // seul le proprietaire invite

  const email = req.body?.email;
  if (typeof email !== 'string' || !email) throw new ApiError(400, 'Email requis');

  const [users] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ?', [email]);
  if (users.length === 0) throw new ApiError(404, 'Aucun utilisateur avec cet email');
  const newMemberId = users[0].id as number;

  if (newMemberId === project.owner_id) throw new ApiError(409, 'Le proprietaire est deja membre du projet');
  if (await isMember(project.id, newMemberId)) throw new ApiError(409, 'Cet utilisateur est deja participant');

  await pool.query('INSERT INTO project_members (project_id, user_id) VALUES (?, ?)', [
    project.id,
    newMemberId,
  ]);
  res.status(201).json({ message: 'Participant ajoute' });
}
