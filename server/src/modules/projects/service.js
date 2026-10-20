import * as projectRepo from './repository.js';
import { NotFoundError } from '../../utils/errors.js';

export const listProjects = async (params) => {
  return await projectRepo.listProjects(params);
};

export const getProject = async (projectId, orgId) => {
  const project = await projectRepo.findProjectById(projectId, orgId);
  if (!project) {
    throw new NotFoundError('Project not found in this organization');
  }
  return project;
};

export const createProject = async (params) => {
  return await projectRepo.createProject(params);
};

export const updateProject = async (params) => {
  const updated = await projectRepo.updateProject(params);
  if (!updated) {
    throw new NotFoundError('Project not found in this organization');
  }
  return updated;
};

export const deleteProject = async (projectId, orgId, userId) => {
  const deleted = await projectRepo.deleteProject(projectId, orgId, userId);
  if (!deleted) {
    throw new NotFoundError('Project not found in this organization');
  }
  return deleted;
};
