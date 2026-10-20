import { query } from '../config/db.js';
import { BadRequestError, ForbiddenError, NotFoundError } from '../utils/errors.js';

export const resolveTenant = (options = { required: true }) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        throw new ForbiddenError('Authentication required prior to tenant resolution');
      }

      // Extract organization ID selector from route parameter, header, or query parameter
      const orgId = req.params.organizationId || 
                    req.headers['x-organization-id'] || 
                    req.query.organizationId;

      if (!orgId) {
        if (options.required) {
          throw new BadRequestError('Organization context required. Specify organizationId in route or X-Organization-Id header.');
        }
        return next();
      }

      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(orgId)) {
        throw new BadRequestError('Invalid organization identifier format');
      }

      // Query database for membership, status, role, and permissions in this organization
      const resMembership = await query(
        `SELECT 
           m.id as membership_id,
           m.organization_id,
           m.status as membership_status,
           r.id as role_id,
           r.name as role_name,
           o.name as organization_name,
           o.slug as organization_slug,
           COALESCE(
             array_agg(p.key) FILTER (WHERE p.key IS NOT NULL), 
             ARRAY[]::varchar[]
           ) as permissions
         FROM memberships m
         JOIN organizations o ON o.id = m.organization_id
         JOIN roles r ON r.id = m.role_id
         LEFT JOIN role_permissions rp ON rp.role_id = r.id
         LEFT JOIN permissions p ON p.id = rp.permission_id
         WHERE m.user_id = $1 AND m.organization_id = $2
         GROUP BY m.id, m.organization_id, m.status, r.id, r.name, o.name, o.slug;`,
        [req.user.id, orgId]
      );

      if (resMembership.rows.length === 0) {
        // Return 404 or 403 to prevent organization existence enumeration
        throw new ForbiddenError('Access denied: You are not a member of this organization');
      }

      const membership = resMembership.rows[0];

      if (membership.membership_status !== 'active') {
        throw new ForbiddenError(`Access denied: Your membership in this organization is ${membership.membership_status}`);
      }

      // Establish verified trusted tenant context
      req.tenant = {
        organizationId: membership.organization_id,
        organizationName: membership.organization_name,
        organizationSlug: membership.organization_slug,
        membershipId: membership.membership_id,
        roleId: membership.role_id,
        roleName: membership.role_name,
        permissions: new Set(membership.permissions)
      };

      next();
    } catch (err) {
      next(err);
    }
  };
};
