import * as orgRepo from './repository.js';
import { findUserByEmail, findUserById } from '../auth/repository.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../../utils/errors.js';

const generateSlug = (name) => {
  const base = name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  const randomSuffix = Math.random().toString(36).substring(2, 6);
  return `${base || 'org'}-${randomSuffix}`;
};

export const getUserOrganizations = async (userId) => {
  return await orgRepo.listUserOrganizations(userId);
};

export const getOrganization = async (orgId) => {
  const org = await orgRepo.findOrganizationById(orgId);
  if (!org) {
    throw new NotFoundError('Organization not found');
  }
  return org;
};

export const updateOrganization = async (orgId, { name }) => {
  const org = await orgRepo.updateOrganization(orgId, { name });
  if (!org) {
    throw new NotFoundError('Organization not found');
  }
  return org;
};

export const createOrganization = async ({ name, userId }) => {
  const slug = generateSlug(name);
  return await orgRepo.createOrganizationWithAdmin({ name, slug, userId });
};

export const listMembers = async (orgId) => {
  return await orgRepo.listOrganizationMembers(orgId);
};

export const addMember = async ({ orgId, email, roleName, actorUserId }) => {
  const user = await findUserByEmail(email);
  if (!user) {
    throw new NotFoundError(`No registered user found with email: ${email}. The user must have an existing account.`);
  }

  // Resolve role
  const role = await orgRepo.findRoleByName(roleName, orgId);
  if (!role) {
    throw new BadRequestError(`Invalid role specified: ${roleName}`);
  }

  try {
    const membership = await orgRepo.addMember({
      orgId,
      userId: user.id,
      roleId: role.id,
      actorUserId
    });
    return {
      membership,
      user: {
        id: user.id,
        name: user.name,
        email: user.email
      },
      role: {
        id: role.id,
        name: role.name
      }
    };
  } catch (err) {
    if (err.code === '23505') {
      throw new ConflictError('This user is already a member of this organization');
    }
    throw err;
  }
};

export const updateMember = async ({ orgId, membershipId, roleName, status, actorUserId, actorMembershipId }) => {
  const targetMembership = await orgRepo.findMembershipById(membershipId, orgId);
  if (!targetMembership) {
    throw new NotFoundError('Membership not found in this organization');
  }

  // Rule: Prevent demoting or suspending the final active administrator
  const isDemotingAdmin = targetMembership.role_name === 'Admin' && roleName && roleName !== 'Admin';
  const isSuspendingAdmin = targetMembership.role_name === 'Admin' && status === 'suspended';

  if (isDemotingAdmin || isSuspendingAdmin) {
    const activeAdminCount = await orgRepo.countActiveAdmins(orgId);
    if (activeAdminCount <= 1) {
      throw new BadRequestError("Cannot demote or suspend the organization's sole active administrator");
    }
  }

  // Rule: Users cannot change their own role to gain or manipulate privileges
  if (targetMembership.id === actorMembershipId && roleName && roleName !== targetMembership.role_name) {
    throw new ForbiddenError('You cannot change your own role');
  }

  let roleId = undefined;
  if (roleName) {
    const role = await orgRepo.findRoleByName(roleName, orgId);
    if (!role) {
      throw new BadRequestError(`Invalid role specified: ${roleName}`);
    }
    roleId = role.id;
  }

  const updated = await orgRepo.updateMembership({
    membershipId,
    orgId,
    roleId,
    status,
    actorUserId
  });

  return updated;
};
