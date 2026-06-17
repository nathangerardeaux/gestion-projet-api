import { Request, Response, NextFunction } from 'express';

// erreur metier : porte un code HTTP + un message
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// gestion centralisee des erreurs (branchee en dernier dans app.ts)
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  // Erreur imprevue : on la journalise cote serveur, mais on ne renvoie qu'un message
  // generique au client (pas de stack trace ni de message SQL expose).
  console.error(err);
  res.status(500).json({ error: 'Erreur interne du serveur' });
}
