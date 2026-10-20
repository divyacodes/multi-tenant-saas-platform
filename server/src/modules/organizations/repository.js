import { query, withTransaction } from '../../config/db.js';

export const listUserOrganizations = async (userId) => {
  const res = await query(
    `SELECT 
       o.id, 
       o.name, 
       o.slug, 
       o.created_at,
       m.id as membership_id, 
       m.status as membership_status,
       r.id as role_id,
       r.name as role_name
     FROM memberships m
     JOIN organizations o ON o.id = m.organization_id
     JOIN roles r ON r.id = m.role_id
     WHERE m.user_id = $1
     ORDER BY o.name ASC;`,
    [userId]
  );
  return res.rows;
};

export const findOrganizationById = async (orgId) => {
  const res = await query(
    `SELECT id, name, slug, created_at, updated_at
     FROM organizations
     WHERE id = $1;`,
    [orgId]
  );
  return res.rows[0] || null;
};

export const updateOrganization = async (orgId, { name }) => {
  const res = await query(
    `UPDATE organizations
     SET name = COALESCE($1, name)
     WHERE id = $2
     RETURNING id, name, slug, created_at, updated_at;`,
    [name ? name.trim() : null, orgId]
  );
  return res.rows[0] || null;
};

export const createOrganizationWithAdmin = async ({ name, slug, userId }) => {
  return await withTransaction(async (client) => {
    // 1. Create Organization
    const orgRes = await client.query(
      `INSERT INTO organizations (name, slug)
       VALUES ($1, $2)
       RETURNING id, name, slug, created_at;`,
      [name.trim(), slug]
    );
    const org = orgRes.rows[0];

    // 2. Find Admin role
    const roleRes = await client.query(
      `SELECT id FROM roles WHERE name = 'Admin' AND organization_id IS NULL;`
    );
    const adminRoleId = roleRes.rows[0].id;

    // 3. Create Admin Membership
    const memRes = await client.query(
      `INSERT INTO memberships (organization_id, user_id, role_id, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, organization_id, user_id, role_id, status;`,
      [org.id, userId, adminRoleId]
    );

    // 4. Audit Log
    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'ORGANIZATION_CREATED', 'ORGANIZATION', $1, $3);`,
      [org.id, userId, JSON.stringify({ organization_name: org.name })]
    );

    return {
      organization: org,
      membership: memRes.rows[0]
    };
  });
};

export const listOrganizationMembers = async (orgId) => {
  const res = await query(
    `SELECT 
       m.id as membership_id,
       m.status,
       m.created_at as joined_at,
       u.id as user_id,
       u.name as user_name,
       u.email as user_email,
       r.id as role_id,
       r.name as role_name
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     JOIN roles r ON r.id = m.role_id
     WHERE m.organization_id = $1
     ORDER BY u.name ASC;`,
    [orgId]
  );
  return res.rows;
};

export const findMembershipById = async (membershipId, orgId) => {
  const res = await query(
    `SELECT 
       m.id, 
       m.organization_id, 
       m.user_id, 
       m.role_id, 
       m.status,
       r.name as role_name
     FROM memberships m
     JOIN roles r ON r.id = m.role_id
     WHERE m.id = $1 AND m.organization_id = $2;`,
    [membershipId, orgId]
  );
  return res.rows[0] || null;
};

export const findRoleByName = async (roleName, orgId = null) => {
  const res = await query(
    `SELECT id, name FROM roles 
     WHERE name = $1 AND (organization_id IS NULL OR organization_id = $2)
     ORDER BY organization_id DESC NULLS LAST
     LIMIT 1;`,
    [roleName, orgId]
  );
  return res.rows[0] || null;
};

export const countActiveAdmins = async (orgId) => {
  const res = await query(
    `SELECT COUNT(*)::int as count
     FROM memberships m
     JOIN roles r ON r.id = m.role_id
     WHERE m.organization_id = $1 
       AND r.name = 'Admin' 
       AND m.status = 'active';`,
    [orgId]
  );
  return res.rows[0].count;
};

export const addMember = async ({ orgId, userId, roleId, actorUserId }) => {
  return await withTransaction(async (client) => {
    const memRes = await client.query(
      `INSERT INTO memberships (organization_id, user_id, role_id, status)
       VALUES ($1, $2, $3, 'active')
       RETURNING id, organization_id, user_id, role_id, status, created_at;`,
      [orgId, userId, roleId]
    );
    const membership = memRes.rows[0];

    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'MEMBER_ADDED', 'MEMBERSHIP', $3, $4);`,
      [orgId, actorUserId, membership.id, JSON.stringify({ user_id: userId, role_id: roleId })]
    );

    return membership;
  });
};

export const updateMembership = async ({ membershipId, orgId, roleId, status, actorUserId }) => {
  return await withTransaction(async (client) => {
    const memRes = await client.query(
      `UPDATE memberships
       SET 
         role_id = COALESCE($1, role_id),
         status = COALESCE($2, status)
       WHERE id = $3 AND organization_id = $4
       RETURNING id, organization_id, user_id, role_id, status, updated_at;`,
      [roleId || null, status || null, membershipId, orgId]
    );
    const updated = memRes.rows[0];

    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'MEMBER_UPDATED', 'MEMBERSHIP', $3, $4);`,
      [orgId, actorUserId, membershipId, JSON.stringify({ role_id: roleId, status })]
    );

    return updated;
  });
};
