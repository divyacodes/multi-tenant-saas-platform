import * as roleService from './service.js';
import { successResponse } from '../../utils/response.js';

export const listRoles = async (req, res, next) => {
  try {
    const roles = await roleService.listRoles(req.tenant.organizationId);
    return successResponse(res, roles, 'Roles retrieved');
  } catch (err) {
    next(err);
  }
};

export const listPermissions = async (req, res, next) => {
  try {
    const permissions = await roleService.listPermissions();
    return successResponse(res, permissions, 'Permissions retrieved');
  } catch (err) {
    next(err);
  }
};

export const createRole = async (req, res, next) => {
  try {
    const role = await roleService.createRole({
      orgId: req.tenant.organizationId,
      name: req.body.name,
      description: req.body.description,
      permissionKeys: req.body.permissionKeys
    });
    return successResponse(res, role, 'Role created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const updateRole = async (req, res, next) => {
  try {
    const role = await roleService.updateRole({
      roleId: req.params.roleId,
      orgId: req.tenant.organizationId,
      name: req.body.name,
      description: req.body.description,
      permissionKeys: req.body.permissionKeys
    });
    return successResponse(res, role, 'Role updated successfully');
  } catch (err) {
    next(err);
  }
};
