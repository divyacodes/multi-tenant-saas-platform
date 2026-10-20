import { pool } from '../../config/db.js';

export const PERMISSIONS = [
  { key: 'organization:read', description: 'View organization details' },
  { key: 'organization:update', description: 'Update organization settings' },
  { key: 'user:read', description: 'View organization team members' },
  { key: 'user:manage', description: 'Invite, change roles, or remove members' },
  { key: 'role:manage', description: 'Manage custom roles and permission assignments' },
  { key: 'project:read', description: 'View projects within organization' },
  { key: 'project:create', description: 'Create new projects' },
  { key: 'project:update', description: 'Update existing projects' },
  { key: 'project:delete', description: 'Delete projects' },
  { key: 'task:read', description: 'View tasks within organization' },
  { key: 'task:create', description: 'Create new tasks' },
  { key: 'task:update', description: 'Update existing tasks' },
  { key: 'task:delete', description: 'Delete tasks' },
  { key: 'task:assign', description: 'Assign tasks to organization members' },
  { key: 'dashboard:read', description: 'View tenant dashboard metrics and activity' },
  { key: 'audit_log:read', description: 'View organization security and audit logs' }
];

export const seedDatabase = async () => {
  const client = await pool.connect();
  try {
    console.log('Seeding permissions and system roles...');
    await client.query('BEGIN');

    // 1. Seed Permissions
    const permissionMap = new Map();
    for (const perm of PERMISSIONS) {
      const res = await client.query(
        `INSERT INTO permissions (key, description)
         VALUES ($1, $2)
         ON CONFLICT (key) DO UPDATE SET description = EXCLUDED.description
         RETURNING id, key;`,
        [perm.key, perm.description]
      );
      permissionMap.set(perm.key, res.rows[0].id);
    }
    console.log(`Seeded ${permissionMap.size} permissions.`);

    // 2. Helper to ensure role exists and assign permissions
    const ensureRoleWithPermissions = async (roleName, description, permKeys) => {
      // Find or insert system role (where organization_id is NULL)
      let roleRes = await client.query(
        `SELECT id FROM roles WHERE name = $1 AND organization_id IS NULL;`,
        [roleName]
      );

      let roleId;
      if (roleRes.rows.length === 0) {
        const insertRes = await client.query(
          `INSERT INTO roles (name, description, organization_id)
           VALUES ($1, $2, NULL)
           RETURNING id;`,
          [roleName, description]
        );
        roleId = insertRes.rows[0].id;
      } else {
        roleId = roleRes.rows[0].id;
      }

      // Assign permissions
      for (const key of permKeys) {
        const permId = permissionMap.get(key);
        if (permId) {
          await client.query(
            `INSERT INTO role_permissions (role_id, permission_id)
             VALUES ($1, $2)
             ON CONFLICT (role_id, permission_id) DO NOTHING;`,
            [roleId, permId]
          );
        }
      }
      return roleId;
    };

    // 3. Admin: Full Access
    const allPermKeys = PERMISSIONS.map(p => p.key);
    await ensureRoleWithPermissions(
      'Admin',
      'Full administrative access to organization resources, members, and settings',
      allPermKeys
    );

    // 4. Manager: Operational Access (Cannot manage roles or delete projects)
    const managerPermKeys = [
      'organization:read',
      'user:read',
      'project:read',
      'project:create',
      'project:update',
      'task:read',
      'task:create',
      'task:update',
      'task:delete',
      'task:assign',
      'dashboard:read'
    ];
    await ensureRoleWithPermissions(
      'Manager',
      'Manage projects, tasks, and team assignments without administrative privileges',
      managerPermKeys
    );

    // 5. Member: View and Assigned Task Access
    const memberPermKeys = [
      'organization:read',
      'user:read',
      'project:read',
      'task:read',
      'task:update',
      'dashboard:read'
    ];
    await ensureRoleWithPermissions(
      'Member',
      'Standard member access to view projects and update tasks',
      memberPermKeys
    );

    await client.query('COMMIT');
    console.log('System roles and permission matrix seeded successfully.');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during seeding:', err);
    throw err;
  } finally {
    client.release();
  }
};

if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  seedDatabase()
    .then(() => {
      console.log('Seed completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed failed:', err);
      process.exit(1);
    });
}
