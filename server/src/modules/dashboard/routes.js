import { Router } from 'express';
import * as dashboardController from './controller.js';
import { authenticate } from '../../middleware/auth.js';
import { resolveTenant } from '../../middleware/tenant.js';
import { requirePermission } from '../../middleware/rbac.js';

export const dashboardRouter = Router();

dashboardRouter.use(authenticate, resolveTenant());

dashboardRouter.get(
  '/stats', 
  requirePermission('dashboard:read'), 
  dashboardController.getStats
);

dashboardRouter.get(
  '/activity', 
  requirePermission('dashboard:read'), 
  dashboardController.getActivity
);
