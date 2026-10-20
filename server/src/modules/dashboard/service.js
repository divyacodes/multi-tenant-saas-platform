import * as dashboardRepo from './repository.js';

export const getStats = async (orgId) => {
  return await dashboardRepo.getDashboardStats(orgId);
};

export const getActivity = async (orgId, limit) => {
  return await dashboardRepo.getRecentActivity(orgId, limit);
};
