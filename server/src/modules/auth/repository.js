import { query, withTransaction } from '../../config/db.js';

export const findUserByEmail = async (email) => {
  const res = await query(
    'SELECT id, name, email, password_hash, created_at FROM users WHERE email = $1',
    [email.toLowerCase().trim()]
  );
  return res.rows[0] || null;
};

export const findUserById = async (id) => {
  const res = await query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [id]
  );
  return res.rows[0] || null;
};

export const getUserOrganizations = async (userId) => {
  const res = await query(
    `SELECT 
       o.id, 
       o.name, 
       o.slug, 
       m.id as membership_id, 
       m.status as membership_status,
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

export const createUserWithOrganization = async ({ name, email, passwordHash, orgName, orgSlug }) => {
  return await withTransaction(async (client) => {
    // 1. Create User
    const userRes = await client.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at;`,
      [name.trim(), email.toLowerCase().trim(), passwordHash]
    );
    const user = userRes.rows[0];

    // 2. Create Organization
    const orgRes = await client.query(
      `INSERT INTO organizations (name, slug)
       VALUES ($1, $2)
       RETURNING id, name, slug, created_at;`,
      [orgName.trim(), orgSlug]
    );
    const org = orgRes.rows[0];

    // 3. Find Admin role (system role where organization_id IS NULL)
    const roleRes = await client.query(
      `SELECT id FROM roles WHERE name = 'Admin' AND organization_id IS NULL;`
    );
    if (roleRes.rows.length === 0) {
      throw new Error('Default Admin role not found. Please ensure seeds have run.');
    }
    const adminRoleId = roleRes.rows[0].id;

    // 4. Create Active Membership
    await client.query(
      `INSERT INTO memberships (organization_id, user_id, role_id, status)
       VALUES ($1, $2, $3, 'active');`,
      [org.id, user.id, adminRoleId]
    );

    // 5. Audit Log Entry
    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'ORGANIZATION_CREATED', 'ORGANIZATION', $1, $3);`,
      [org.id, user.id, JSON.stringify({ organization_name: org.name, slug: org.slug })]
    );

    return { user, organization: org };
  });
};
