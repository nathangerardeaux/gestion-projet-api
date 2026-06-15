import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Une requete a laquelle on a ajoute l'id de l'utilisateur connecte (rempli par requireAuth).
export interface AuthRequest extends Request {
  userId?: number;
}

// Middleware branche sur les routes protegees : verifie le jeton et range l'id dans req.userId.
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization; // attendu : "Bearer <jeton>"
  if (!header || !header.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentification requise' });
    return;
  }
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET as string) as { sub: string };
    req.userId = Number(payload.sub); // l'identite vient du jeton, jamais du corps de requete
    next();
  } catch {
    res.status(401).json({ error: 'Jeton invalide ou expire' });
  }
}
