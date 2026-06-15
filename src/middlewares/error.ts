import { Request, Response, NextFunction } from 'express';

// Erreur metier : elle transporte le code HTTP et le message a renvoyer au client.
// Dans un controleur : throw new ApiError(404, 'Projet introuvable').
export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

// Middleware d'erreurs : le DERNIER de la chaine (4 parametres). Il transforme toute
// erreur levee dans l'application en reponse JSON propre.
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
