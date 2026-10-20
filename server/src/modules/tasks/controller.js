import * as taskService from './service.js';
import { successResponse, paginatedResponse } from '../../utils/response.js';

export const listTasks = async (req, res, next) => {
  try {
    const { page, limit, projectId, assignedTo, status, priority, search, sortBy, sortOrder } = req.query;
    const result = await taskService.listTasks({
      orgId: req.tenant.organizationId,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      projectId,
      assignedTo,
      status,
      priority,
      search,
      sortBy,
      sortOrder
    });

    return paginatedResponse(
      res,
      result.items,
      { page: result.page, limit: result.limit, total: result.total },
      'Tasks retrieved successfully'
    );
  } catch (err) {
    next(err);
  }
};

export const getTask = async (req, res, next) => {
  try {
    const task = await taskService.getTask(
      req.params.taskId,
      req.tenant.organizationId
    );
    return successResponse(res, task, 'Task details retrieved');
  } catch (err) {
    next(err);
  }
};

export const createTask = async (req, res, next) => {
  try {
    const task = await taskService.createTask({
      orgId: req.tenant.organizationId,
      projectId: req.body.projectId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      assignedTo: req.body.assignedTo,
      dueDate: req.body.dueDate,
      userId: req.user.id
    });
    return successResponse(res, task, 'Task created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateTask = async (req, res, next) => {
  try {
    const updated = await taskService.updateTask({
      taskId: req.params.taskId,
      orgId: req.tenant.organizationId,
      title: req.body.title,
      description: req.body.description,
      status: req.body.status,
      priority: req.body.priority,
      assignedTo: req.body.assignedTo,
      dueDate: req.body.dueDate,
      user: req.user,
      tenant: req.tenant
    });
    return successResponse(res, updated, 'Task updated successfully');
  } catch (err) {
    next(err);
  }
};

export const deleteTask = async (req, res, next) => {
  try {
    const deleted = await taskService.deleteTask(
      req.params.taskId,
      req.tenant.organizationId,
      req.user.id
    );
    return successResponse(res, deleted, 'Task deleted successfully');
  } catch (err) {
    next(err);
  }
};
