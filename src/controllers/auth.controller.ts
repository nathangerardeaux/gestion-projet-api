import { Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2';
import { pool } from '../config/db';
import { ApiError } from '../middlewares/error';
import { AuthRequest } from '../middlewares/auth';

interface UserRow extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  name: string;
}

// POST /api/auth/login
export async function login(req: AuthRequest, res: Response) {
  const email = req.body?.email;
  const password = req.body?.password;
  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) {
    throw new ApiError(400, 'Email et mot de passe requis');
  }

  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, email, password_hash, name FROM users WHERE email = ?',
    [email]
  );
  const user = rows[0];

  // Meme message que l'email existe ou non : on n'aide pas a deviner quels comptes existent.
  if (!user || !(await bcrypt.compare(password, user.password_hash))) {
    throw new ApiError(401, 'Identifiants invalides');
  }

  const token = jwt.sign({ sub: String(user.id) }, process.env.JWT_SECRET as string, {
    expiresIn: '24h',
  });

  // On ne renvoie jamais le password_hash.
  res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
}

// GET /api/auth/me : permet au client de restaurer la session au rechargement.
export async function me(req: AuthRequest, res: Response) {
  const [rows] = await pool.query<UserRow[]>(
    'SELECT id, email, name FROM users WHERE id = ?',
    [req.userId]
  );
  if (rows.length === 0) throw new ApiError(404, 'Utilisateur introuvable');
  res.json({ user: rows[0] });
}
