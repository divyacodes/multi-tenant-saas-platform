import { query, withTransaction } from '../../config/db.js';

export const listAllPermissions = async () => {
  const res = await query('SELECT id, key, description FROM permissions ORDER BY key ASC;');
  return res.rows;
};

export const listRoles = async (orgId) => {
  const res = await query(
    `SELECT 
       r.id,
       r.organization_id,
       r.name,
       r.description,
       r.created_at,
       (r.organization_id IS NULL) as is_system_role,
       COALESCE(
         array_agg(p.key) FILTER (WHERE p.key IS NOT NULL),
         ARRAY[]::varchar[]
       ) as permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE r.organization_id IS NULL OR r.organization_id = $1
     GROUP BY r.id, r.organization_id, r.name, r.description, r.created_at
     ORDER BY is_system_role DESC, r.name ASC;`,
    [orgId]
  );
  return res.rows;
};

export const findRoleById = async (roleId, orgId) => {
  const res = await query(
    `SELECT 
       r.id,
       r.organization_id,
       r.name,
       r.description,
       r.created_at,
       (r.organization_id IS NULL) as is_system_role,
       COALESCE(
         array_agg(p.key) FILTER (WHERE p.key IS NOT NULL),
         ARRAY[]::varchar[]
       ) as permissions
     FROM roles r
     LEFT JOIN role_permissions rp ON rp.role_id = r.id
     LEFT JOIN permissions p ON p.id = rp.permission_id
     WHERE r.id = $1 AND (r.organization_id IS NULL OR r.organization_id = $2)
     GROUP BY r.id, r.organization_id, r.name, r.description, r.created_at;`,
    [roleId, orgId]
  );
  return res.rows[0] || null;
};

export const createCustomRole = async ({ orgId, name, description, permissionKeys }) => {
  return await withTransaction(async (client) => {
    // 1. Create Role scoped to tenant
    const roleRes = await client.query(
      `INSERT INTO roles (organization_id, name, description)
       VALUES ($1, $2, $3)
       RETURNING id, organization_id, name, description, created_at;`,
      [orgId, name.trim(), description || null]
    );
    const role = roleRes.rows[0];

    // 2. Attach permissions
    if (permissionKeys && permissionKeys.length > 0) {
      const permsRes = await client.query(
        `SELECT id, key FROM permissions WHERE key = ANY($1::varchar[]);`,
        [permissionKeys]
      );

      for (const p of permsRes.rows) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2);`,
          [role.id, p.id]
        );
      }
    }

    return role;
  });
};

export const updateCustomRole = async ({ roleId, orgId, name, description, permissionKeys }) => {
  return await withTransaction(async (client) => {
    // Cannot modify system roles (where organization_id is NULL)
    const roleRes = await client.query(
      `UPDATE roles
       SET 
         name = COALESCE($1, name),
         description = COALESCE($2, description)
       WHERE id = $3 AND organization_id = $4
       RETURNING id, organization_id, name, description;`,
      [name ? name.trim() : null, description !== undefined ? description : null, roleId, orgId]
    );

    if (roleRes.rows.length === 0) {
      return null;
    }

    if (permissionKeys !== undefined) {
      // Clear existing permissions and reassign
      await client.query('DELETE FROM role_permissions WHERE role_id = $1;', [roleId]);

      if (permissionKeys.length > 0) {
        const permsRes = await client.query(
          `SELECT id FROM permissions WHERE key = ANY($1::varchar[]);`,
          [permissionKeys]
        );

        for (const p of permsRes.rows) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2);`,
            [roleId, p.id]
          );
        }
      }
    }

    return roleRes.rows[0];
  });
};
