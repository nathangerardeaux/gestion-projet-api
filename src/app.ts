import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import { authRouter } from './routes/auth.routes';
import { projectsRouter } from './routes/projects.routes';
import { tasksRouter } from './routes/tasks.routes';
import { errorHandler } from './middlewares/error';

export const app = express();

// middlewares globaux
app.use(cors({ origin: process.env.CLIENT_ORIGIN })); // seul le client declare est autorise
app.use(express.json()); // parse les corps JSON -> req.body

// routes
app.use('/api/auth', authRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tasks', tasksRouter);

// 404 pour toute route inconnue
app.use((_req, res) => {
  res.status(404).json({ error: 'Route inconnue' });
});

// gestion des erreurs (en dernier)
app.use(errorHandler);
