import { Router } from 'express';
import { requireAuth } from '../middlewares/auth';
import * as tasks from '../controllers/tasks.controller';

export const tasksRouter = Router();

tasksRouter.use(requireAuth);

tasksRouter.put('/:id', tasks.updateTask);
tasksRouter.delete('/:id', tasks.deleteTask);
tasksRouter.patch('/:id/status', tasks.updateTaskStatus);
tasksRouter.patch('/:id/assignee', tasks.updateTaskAssignee);
