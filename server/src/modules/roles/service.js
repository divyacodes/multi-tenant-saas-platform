import * as roleRepo from './repository.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors.js';

export const listRoles = async (orgId) => {
  return await roleRepo.listRoles(orgId);
};

export const listPermissions = async () => {
  return await roleRepo.listAllPermissions();
};

export const createRole = async ({ orgId, name, description, permissionKeys }) => {
  try {
    return await roleRepo.createCustomRole({
      orgId,
      name,
      description,
      permissionKeys
    });
  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictError(`A role named '${name}' already exists in this organization`);
    }
    throw err;
  }
};

export const updateRole = async ({ roleId, orgId, name, description, permissionKeys }) => {
  const existing = await roleRepo.findRoleById(roleId, orgId);
  if (!existing) {
    throw new NotFoundError('Role not found');
  }

  if (existing.is_system_role) {
    throw new ForbiddenError('System-defined default roles (Admin, Manager, Member) cannot be modified');
  }

  try {
    const updated = await roleRepo.updateCustomRole({
      roleId,
      orgId,
      name,
      description,
      permissionKeys
    });

    if (!updated) {
      throw new NotFoundError('Role not found in this organization');
    }
    return updated;
  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictError(`A role named '${name}' already exists in this organization`);
    }
    throw err;
  }
};
