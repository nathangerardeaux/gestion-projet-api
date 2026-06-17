import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { ApiError } from '../middlewares/error';

export interface ProjectRow extends RowDataPacket {
  id: number;
  title: string;
  description: string;
  owner_id: number;
  created_at: string;
}

// recupere le projet, ou 404 s'il n'existe pas
export async function getProjectOr404(projectId: number): Promise<ProjectRow> {
  const [rows] = await pool.query<ProjectRow[]>(
    'SELECT id, title, description, owner_id, created_at FROM projects WHERE id = ?',
    [projectId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Projet introuvable');
  return rows[0];
}

export async function isMember(projectId: number, userId: number): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 FROM project_members WHERE project_id = ? AND user_id = ?',
    [projectId, userId]
  );
  return rows.length > 0;
}

// proprietaire ou participant, sinon 403
export async function requireMember(project: ProjectRow, userId: number): Promise<void> {
  if (project.owner_id === userId) return;
  if (await isMember(project.id, userId)) return;
  throw new ApiError(403, "Acces refuse : vous n'etes pas membre de ce projet");
}

// proprietaire uniquement, sinon 403
export function requireOwner(project: ProjectRow, userId: number): void {
  if (project.owner_id !== userId) {
    throw new ApiError(403, 'Acces refuse : seul le proprietaire peut faire cette action');
  }
}
