import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Request + l'id de l'utilisateur (rempli par requireAuth)
export interface AuthRequest extends Request {
  userId?: number;
}

// verifie le jeton et range l'id dans req.userId
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
