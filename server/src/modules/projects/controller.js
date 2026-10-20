import * as projectService from './service.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';

export const listProjects = async (req, res, next) => {
  try {
    const { page, limit, search, status, sortBy, sortOrder } = req.query;
    const result = await projectService.listProjects({
      orgId: req.tenant.organizationId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      search,
      status,
      sortBy,
      sortOrder
    });

    return paginatedResponse(
      res,
      result.items,
      { page: result.page, limit: result.limit, total: result.total },
      'Projects retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getProject = async (req, res, next) => {
  try {
    const project = await projectService.getProject(
      req.params.projectId, 
      req.tenant.organizationId
    );
    return successResponse(res, project, 'Project details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const project = await projectService.createProject({
      orgId: req.tenant.organizationId,
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      userId: req.user.id
    });
    return successResponse(res, project, 'Project created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const updated = await projectService.updateProject({
      projectId: req.params.projectId,
      orgId: req.tenant.organizationId,
      name: req.body.name,
      description: req.body.description,
      status: req.body.status,
      userId: req.user.id
    });
    return successResponse(res, updated, 'Project updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const deleted = await projectService.deleteProject(
      req.params.projectId,
      req.tenant.organizationId,
      req.user.id
    );
    return successResponse(res, deleted, 'Project deleted successfully');
  } catch (err) {
    next(err);
  }
};
