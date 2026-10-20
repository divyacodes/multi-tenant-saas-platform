import { Router } from 'express';
import * as orgController from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requirePermission } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { 
  createOrgSchema, 
  updateOrgSchema, 
  addMemberSchema, 
  updateMemberSchema 
} from './schema.js';

export const organizationRouter = Router();

// Organization management for authenticated users
organizationRouter.get(
  '/', 
  authenticate, 
  orgController.listOrganizations
);

organizationRouter.post(
  '/', 
  authenticate, 
  validate(createOrgSchema), 
  orgController.createOrganization
);

// Tenant-scoped routes requiring membership resolution and permission enforcement
organizationRouter.get(
  '/:organizationId', 
  authenticate, 
  resolveTenant(), 
  requirePermission('organization:read'), 
  orgController.getOrganization
);

organizationRouter.patch(
  '/:organizationId', 
  authenticate, 
  resolveTenant(), 
  requirePermission('organization:update'), 
  validate(updateOrgSchema), 
  orgController.updateOrganization
);

// Member management
organizationRouter.get(
  '/:organizationId/members', 
  authenticate, 
  resolveTenant(), 
  requirePermission('user:read'), 
  orgController.listMembers
);

organizationRouter.post(
  '/:organizationId/members', 
  authenticate, 
  resolveTenant(), 
  requirePermission('user:manage'), 
  validate(addMemberSchema), 
  orgController.addMember
);

organizationRouter.patch(
  '/:organizationId/members/:membershipId', 
  authenticate, 
  resolveTenant(), 
  requirePermission('user:manage'), 
  validate(updateMemberSchema), 
  orgController.updateMember
);
