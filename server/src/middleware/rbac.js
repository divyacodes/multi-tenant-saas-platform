import { ForbiddenError } from '../utils/errors.js';

export const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return next(new ForbiddenError('Tenant context required for permission check'));
    }

    if (!req.tenant.permissions || !req.tenant.permissions.has(permissionKey)) {
      return next(
        new ForbiddenError(`Forbidden: Missing required permission [${permissionKey}]`)
      );
    }

    next();
  };
};

export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return next(new ForbiddenError('Tenant context required for role verification'));
    }

    if (!allowedRoles.includes(req.tenant.roleName)) {
      return next(
        new ForbiddenError(`Forbidden: Requires one of the following roles: ${allowedRoles.join(', ')}`)
      );
    }

    next();
  };
};
