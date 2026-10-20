import * as taskRepo from './repository.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors.js';

export const listTasks = async (params) => {
  return await taskRepo.listTasks(params);
};

export const getTask = async (taskId, orgId) => {
  const task = await taskRepo.findTaskById(taskId, orgId);
  if (!task) {
    throw new NotFoundError('Task not found in this organization');
  }
  return task;
};

export const createTask = async ({ 
  orgId, 
  projectId, 
  title, 
  description, 
  status, 
  priority, 
  assignedTo, 
  dueDate, 
  userId 
}) => {
  // 1. Verify project exists within the active organization
  const project = await taskRepo.validateProjectInOrg(projectId, orgId);
  if (!project) {
    throw new BadRequestError('Project does not exist in this organization');
  }

  // 2. If assigned, verify user is an active member in this active organization
  if (assignedTo) {
    const member = await taskRepo.validateUserInOrg(assignedTo, orgId);
    if (!member) {
      throw new BadRequestError('Assigned user must be an active member of this organization');
    }
  }

  return await taskRepo.createTask({
    orgId,
    projectId,
    title,
    description,
    status,
    priority,
    assignedTo,
    dueDate,
    userId
  });
};

export const updateTask = async ({ 
  taskId, 
  orgId, 
  title, 
  description, 
  status, 
  priority, 
  assignedTo, 
  dueDate, 
  user,
  tenant
}) => {
  const existing = await taskRepo.findTaskById(taskId, orgId);
  if (!existing) {
    throw new NotFoundError('Task not found in this organization');
  }

  // Permission check for standard members:
  // If role is Member, they can only update their own assigned tasks
  if (tenant.roleName === 'Member' && existing.assigned_to !== user.id) {
    throw new ForbiddenError('Members can only update tasks assigned to them');
  }

  // If reassigning, verify permission and membership
  if (assignedTo !== undefined && assignedTo !== existing.assigned_to) {
    if (!tenant.permissions.has('task:assign')) {
      throw new ForbiddenError('Missing permission to assign tasks [task:assign]');
    }

    if (assignedTo !== null) {
      const member = await taskRepo.validateUserInOrg(assignedTo, orgId);
      if (!member) {
        throw new BadRequestError('Assigned user must be an active member of this organization');
      }
    }
  }

  const updated = await taskRepo.updateTask({
    taskId,
    orgId,
    title,
    description,
    status,
    priority,
    assignedTo,
    dueDate,
    userId: user.id
  });

  return updated;
};

export const deleteTask = async (taskId, orgId, userId) => {
  const deleted = await taskRepo.deleteTask(taskId, orgId, userId);
  if (!deleted) {
    throw new NotFoundError('Task not found in this organization');
  }
  return deleted;
};
