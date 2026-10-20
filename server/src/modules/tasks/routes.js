import { Router } from 'express';
import * as taskController from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { 
  createTaskSchema, 
  updateTaskSchema, 
  queryTaskSchema, 
  taskIdParamSchema 
} from './schema.js';

export const taskRouter = Router();

// All task endpoints require authentication and resolved tenant context
taskRouter.use(authenticate, resolveTenant());

taskRouter.get(
  '/', 
  requirePermission('task:read'), 
  validate(queryTaskSchema), 
  taskController.listTasks
);

taskRouter.post(
  '/', 
  requirePermission('task:create'), 
  validate(createTaskSchema), 
  taskController.createTask
);

taskRouter.get(
  '/:taskId', 
  requirePermission('task:read'), 
  validate(taskIdParamSchema), 
  taskController.getTask
);

taskRouter.patch(
  '/:taskId', 
  requirePermission('task:update'), 
  validate(updateTaskSchema), 
  taskController.updateTask
);

taskRouter.delete(
  '/:taskId', 
  requirePermission('task:delete'), 
  validate(taskIdParamSchema), 
  taskController.deleteTask
);
