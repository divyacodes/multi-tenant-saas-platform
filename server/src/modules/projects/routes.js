import { Router } from 'express';
import * as projectController from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { 
  createProjectSchema, 
  updateProjectSchema, 
  queryProjectSchema, 
  projectIdParamSchema 
} from './schema.js';

export const projectRouter = Router();

// All project endpoints require authentication and resolved tenant context
projectRouter.use(authenticate, resolveTenant());

projectRouter.get(
  '/', 
  requirePermission('project:read'), 
  validate(queryProjectSchema), 
  projectController.listProjects
);

projectRouter.post(
  '/', 
  requirePermission('project:create'), 
  validate(createProjectSchema), 
  projectController.createProject
);

projectRouter.get(
  '/:projectId', 
  requirePermission('project:read'), 
  validate(projectIdParamSchema), 
  projectController.getProject
);

projectRouter.patch(
  '/:projectId', 
  requirePermission('project:update'), 
  validate(updateProjectSchema), 
  projectController.updateProject
);

projectRouter.delete(
  '/:projectId', 
  requirePermission('project:delete'), 
  validate(projectIdParamSchema), 
  projectController.deleteProject
);
