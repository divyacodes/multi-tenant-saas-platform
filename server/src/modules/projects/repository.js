import { query, withTransaction } from '../../config/db.js';

export const listProjects = async ({ orgId, page = 1, limit = 10, search, status, sortBy = 'created_at', sortOrder = 'desc' }) => {
  const offset = (page - 1) * limit;
  const whereClauses = ['organization_id = $1'];
  const params = [orgId];

  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    whereClauses.push(`name ILIKE $${params.length}`);
  }

  if (status) {
    params.push(status);
    whereClauses.push(`status = $${params.length}`);
  }

  const whereSql = whereClauses.join(' AND ');

  // Count total records
  const countRes = await query(
    `SELECT COUNT(*)::int as total FROM projects WHERE ${whereSql};`,
    params
  );
  const total = countRes.rows[0].total;

  // Whitelisted sort columns
  const allowedSortColumns = {
    name: 'p.name',
    status: 'p.status',
    created_at: 'p.created_at'
  };
  const sortColumn = allowedSortColumns[sortBy] || 'p.created_at';
  const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  // Fetch paginated results with creator info and task count
  const itemsParams = [...params, limit, offset];
  const itemsRes = await query(
    `SELECT 
       p.id,
       p.organization_id,
       p.name,
       p.description,
       p.status,
       p.created_at,
       p.updated_at,
       u.name as creator_name,
       COUNT(t.id)::int as total_tasks,
       COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::int as completed_tasks
     FROM projects p
     LEFT JOIN users u ON u.id = p.created_by
     LEFT JOIN tasks t ON t.project_id = p.id AND t.organization_id = p.organization_id
     WHERE ${whereSql.replace(/organization_id/g, 'p.organization_id').replace(/name ILIKE/g, 'p.name ILIKE').replace(/status =/g, 'p.status =')}
     GROUP BY p.id, u.name
     ORDER BY ${sortColumn} ${orderDirection}
     LIMIT $${itemsParams.length - 1} OFFSET $${itemsParams.length};`,
    itemsParams
  );

  return {
    items: itemsRes.rows,
    total,
    page,
    limit
  };
};

export const findProjectById = async (projectId, orgId) => {
  const res = await query(
    `SELECT 
       p.id,
       p.organization_id,
       p.name,
       p.description,
       p.status,
       p.created_at,
       p.updated_at,
       u.name as creator_name,
       u.email as creator_email,
       COUNT(t.id)::int as total_tasks,
       COUNT(CASE WHEN t.status = 'Done' THEN 1 END)::int as completed_tasks
     FROM projects p
     LEFT JOIN users u ON u.id = p.created_by
     LEFT JOIN tasks t ON t.project_id = p.id AND t.organization_id = p.organization_id
     WHERE p.id = $1 AND p.organization_id = $2
     GROUP BY p.id, u.name, u.email;`,
    [projectId, orgId]
  );
  return res.rows[0] || null;
};

export const createProject = async ({ orgId, name, description, status, userId }) => {
  return await withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO projects (organization_id, name, description, status, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, organization_id, name, description, status, created_at, updated_at;`,
      [orgId, name.trim(), description || null, status, userId]
    );
    const project = res.rows[0];

    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'PROJECT_CREATED', 'PROJECT', $3, $4);`,
      [orgId, userId, project.id, JSON.stringify({ name: project.name, status: project.status })]
    );

    return project;
  });
};

export const updateProject = async ({ projectId, orgId, name, description, status, userId }) => {
  return await withTransaction(async (client) => {
    const setClauses = [];
    const values = [];
    let idx = 1;

    if (name !== undefined && name !== null) {
      setClauses.push(`name = $${idx++}`);
      values.push(name.trim());
    }
    if (description !== undefined) {
      setClauses.push(`description = $${idx++}`);
      values.push(description);
    }
    if (status !== undefined && status !== null) {
      setClauses.push(`status = $${idx++}`);
      values.push(status);
    }

    if (setClauses.length === 0) {
      const existing = await client.query(
        `SELECT id, organization_id, name, description, status, created_at, updated_at FROM projects WHERE id = $1 AND organization_id = $2;`,
        [projectId, orgId]
      );
      return existing.rows[0] || null;
    }

    values.push(projectId);
    const projIdIdx = idx++;
    values.push(orgId);
    const orgIdIdx = idx++;

    const res = await client.query(
      `UPDATE projects
       SET ${setClauses.join(', ')}
       WHERE id = $${projIdIdx} AND organization_id = $${orgIdIdx}
       RETURNING id, organization_id, name, description, status, created_at, updated_at;`,
      values
    );

    const project = res.rows[0];
    if (!project) return null;

    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'PROJECT_UPDATED', 'PROJECT', $3, $4);`,
      [orgId, userId, projectId, JSON.stringify({ name: project.name, status: project.status })]
    );

    return project;
  });
};

export const deleteProject = async (projectId, orgId, userId) => {
  return await withTransaction(async (client) => {
    // Delete project scoped to tenant (tasks cascade via fk_tasks_project_org)
    const res = await client.query(
      `DELETE FROM projects
       WHERE id = $1 AND organization_id = $2
       RETURNING id, name;`,
      [projectId, orgId]
    );

    const deleted = res.rows[0];
    if (!deleted) return null;

    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'PROJECT_DELETED', 'PROJECT', $3, $4);`,
      [orgId, userId, projectId, JSON.stringify({ name: deleted.name })]
    );

    return deleted;
  });
};
