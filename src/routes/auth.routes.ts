import { Router } from 'express';
import { login, me } from '../controllers/auth.controller';
import { requireAuth } from '../middlewares/auth';

export const authRouter = Router();

authRouter.post('/login', login); // publique : c'est la porte d'entree
authRouter.get('/me', requireAuth, me); // protegee : le middleware passe d'abord
