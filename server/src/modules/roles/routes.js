import { Router } from 'express';
import * as roleController from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { createRoleSchema, updateRoleSchema } from './schema.js';

export const roleRouter = Router({ mergeParams: true });

// Mounted under /api/organizations/:organizationId/roles
roleRouter.get(
  '/', 
  authenticate, 
  resolveTenant(), 
  requirePermission('organization:read'), 
  roleController.listRoles
);

roleRouter.post(
  '/', 
  authenticate, 
  resolveTenant(), 
  requirePermission('role:manage'), 
  validate(createRoleSchema), 
  roleController.createRole
);

roleRouter.patch(
  '/:roleId', 
  authenticate, 
  resolveTenant(), 
  requirePermission('role:manage'), 
  validate(updateRoleSchema), 
  roleController.updateRole
);
