import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import * as projects from '../controllers/projects.controller';
import { listTasks, createTask } from '../controllers/tasks.controller';

export const projectsRouter = Router();

projectsRouter.use(requireAuth); // TOUTES les routes projets exigent un jeton valide

// CRUD des projets
projectsRouter.get('/', projects.listProjects);
projectsRouter.post('/', projects.createProject);
projectsRouter.get('/:id', projects.getProject);
projectsRouter.put('/:id', projects.updateProject);
projectsRouter.delete('/:id', projects.deleteProject);

// Participants d'un projet
projectsRouter.get('/:id/participants', projects.listParticipants);
projectsRouter.post('/:id/participants', projects.addParticipant);

// Taches imbriquees sous un projet (lister / creer)
projectsRouter.get('/:id/tasks', listTasks);
projectsRouter.post('/:id/tasks', createTask);
