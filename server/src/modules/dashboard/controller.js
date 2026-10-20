import * as dashboardService from './service.js';
import { successResponse } from '../../utils/response.js';

export const getStats = async (req, res, next) => {
  try {
    const stats = await dashboardService.getStats(req.tenant.organizationId);
    return successResponse(res, stats, 'Dashboard statistics retrieved');
  } catch (err) {
    next(err);
  }
};

export const getActivity = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit || '15', 10);
    const activity = await dashboardService.getActivity(req.tenant.organizationId, limit);
    return successResponse(res, activity, 'Recent activity retrieved');
  } catch (err) {
    next(err);
  }
};
