import * as orgService from './service.js';
import { successResponse } from '../../utils/response.js';

export const listOrganizations = async (req, res, next) => {
  try {
    const orgs = await orgService.getUserOrganizations(req.user.id);
    return successResponse(res, orgs, 'User organizations retrieved');
  } catch (err) {
    next(err);
  }
};

export const createOrganization = async (req, res, next) => {
  try {
    const result = await orgService.createOrganization({
      name: req.body.name,
      userId: req.user.id
    });
    return successResponse(res, result, 'Organization created successfully', 201);
  } catch (err) {
    next(err);
  }
};

export const getOrganization = async (req, res, next) => {
  try {
    const org = await orgService.getOrganization(req.tenant.organizationId);
    return successResponse(res, org, 'Organization details retrieved');
  } catch (err) {
    next(err);
  }
};

export const updateOrganization = async (req, res, next) => {
  try {
    const updated = await orgService.updateOrganization(req.tenant.organizationId, req.body);
    return successResponse(res, updated, 'Organization updated successfully');
  } catch (err) {
    next(err);
  }
};

export const listMembers = async (req, res, next) => {
  try {
    const members = await orgService.listMembers(req.tenant.organizationId);
    return successResponse(res, members, 'Organization members retrieved');
  } catch (err) {
    next(err);
  }
};

export const addMember = async (req, res, next) => {
  try {
    const result = await orgService.addMember({
      orgId: req.tenant.organizationId,
      email: req.body.email,
      roleName: req.body.roleName,
      actorUserId: req.user.id
    });
    return successResponse(res, result, 'Member added to organization', 201);
  } catch (err) {
    next(err);
  }
};

export const updateMember = async (req, res, next) => {
  try {
    const updated = await orgService.updateMember({
      orgId: req.tenant.organizationId,
      membershipId: req.params.membershipId,
      roleName: req.body.roleName,
      status: req.body.status,
      actorUserId: req.user.id,
      actorMembershipId: req.tenant.membershipId
    });
    return successResponse(res, updated, 'Member updated successfully');
  } catch (err) {
    next(err);
  }
};
