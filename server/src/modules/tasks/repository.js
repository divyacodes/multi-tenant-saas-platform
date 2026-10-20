import { query, withTransaction } from '../../config/db.js';

export const validateProjectInOrg = async (projectId, orgId) => {
  const res = await query(
    'SELECT id, name FROM projects WHERE id = $1 AND organization_id = $2;',
    [projectId, orgId]
  );
  return res.rows[0] || null;
};

export const validateUserInOrg = async (userId, orgId) => {
  const res = await query(
    `SELECT m.id, u.name, u.email 
     FROM memberships m
     JOIN users u ON u.id = m.user_id
     WHERE m.user_id = $1 AND m.organization_id = $2 AND m.status = 'active';`,
    [userId, orgId]
  );
  return res.rows[0] || null;
};

export const listTasks = async ({ 
  orgId, 
  page = 1, 
  limit = 10, 
  projectId, 
  assignedTo, 
  status, 
  priority, 
  search, 
  sortBy = 'created_at', 
  sortOrder = 'desc' 
}) => {
  const offset = (page - 1) * limit;
  const whereClauses = ['t.organization_id = $1'];
  const params = [orgId];

  if (projectId) {
    params.push(projectId);
    whereClauses.push(`t.project_id = $${params.length}`);
  }

  if (assignedTo) {
    params.push(assignedTo);
    whereClauses.push(`t.assigned_to = $${params.length}`);
  }

  if (status) {
    params.push(status);
    whereClauses.push(`t.status = $${params.length}`);
  }

  if (priority) {
    params.push(priority);
    whereClauses.push(`t.priority = $${params.length}`);
  }

  if (search && search.trim() !== '') {
    params.push(`%${search.trim()}%`);
    whereClauses.push(`(t.title ILIKE $${params.length} OR t.description ILIKE $${params.length})`);
  }

  const whereSql = whereClauses.join(' AND ');

  // Total count
  const countRes = await query(
    `SELECT COUNT(*)::int as total FROM tasks t WHERE ${whereSql};`,
    params
  );
  const total = countRes.rows[0].total;

  // Sorting
  const allowedSortColumns = {
    created_at: 't.created_at',
    due_date: 't.due_date',
    priority: 't.priority',
    status: 't.status',
    title: 't.title'
  };
  const sortColumn = allowedSortColumns[sortBy] || 't.created_at';
  const orderDirection = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

  const itemsParams = [...params, limit, offset];
  const itemsRes = await query(
    `SELECT 
       t.id,
       t.organization_id,
       t.project_id,
       p.name as project_name,
       t.title,
       t.description,
       t.status,
       t.priority,
       t.assigned_to,
       ua.name as assignee_name,
       ua.email as assignee_email,
       t.due_date,
       t.created_by,
       uc.name as creator_name,
       t.created_at,
       t.updated_at
     FROM tasks t
     JOIN projects p ON p.id = t.project_id AND p.organization_id = t.organization_id
     LEFT JOIN users ua ON ua.id = t.assigned_to
     LEFT JOIN users uc ON uc.id = t.created_by
     WHERE ${whereSql}
     ORDER BY ${sortColumn} ${orderDirection} NULLS LAST
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

export const findTaskById = async (taskId, orgId) => {
  const res = await query(
    `SELECT 
       t.id,
       t.organization_id,
       t.project_id,
       p.name as project_name,
       t.title,
       t.description,
       t.status,
       t.priority,
       t.assigned_to,
       ua.name as assignee_name,
       ua.email as assignee_email,
       t.due_date,
       t.created_by,
       uc.name as creator_name,
       t.created_at,
       t.updated_at
     FROM tasks t
     JOIN projects p ON p.id = t.project_id AND p.organization_id = t.organization_id
     LEFT JOIN users ua ON ua.id = t.assigned_to
     LEFT JOIN users uc ON uc.id = t.created_by
     WHERE t.id = $1 AND t.organization_id = $2;`,
    [taskId, orgId]
  );
  return res.rows[0] || null;
};

export const createTask = async ({ 
  orgId, 
  projectId, 
  title, 
  description, 
  status, 
  priority, 
  assignedTo, 
  dueDate, 
  userId 
}) => {
  return await withTransaction(async (client) => {
    const res = await client.query(
      `INSERT INTO tasks (
         organization_id, 
         project_id, 
         title, 
         description, 
         status, 
         priority, 
         assigned_to, 
         due_date, 
         created_by
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *;`,
      [
        orgId, 
        projectId, 
        title.trim(), 
        description || null, 
        status, 
        priority, 
        assignedTo || null, 
        dueDate || null, 
        userId
      ]
    );
    const task = res.rows[0];

    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'TASK_CREATED', 'TASK', $3, $4);`,
      [orgId, userId, task.id, JSON.stringify({ title: task.title, project_id: projectId, status, priority })]
    );

    return task;
  });
};

export const updateTask = async ({ 
  taskId, 
  orgId, 
  title, 
  description, 
  status, 
  priority, 
  assignedTo, 
  dueDate, 
  userId 
}) => {
  return await withTransaction(async (client) => {
    const res = await client.query(
      `UPDATE tasks
       SET 
         title = COALESCE($1, title),
         description = CASE WHEN $2 IS NOT NULL THEN $2 ELSE description END,
         status = COALESCE($3, status),
         priority = COALESCE($4, priority),
         assigned_to = CASE WHEN $5 IS NOT NULL THEN $5 ELSE assigned_to END,
         due_date = CASE WHEN $6 IS NOT NULL THEN $6 ELSE due_date END
       WHERE id = $7 AND organization_id = $8
       RETURNING *;`,
      [
        title ? title.trim() : null,
        description !== undefined ? description : null,
        status || null,
        priority || null,
        assignedTo !== undefined ? assignedTo : null,
        dueDate !== undefined ? dueDate : null,
        taskId,
        orgId
      ]
    );

    const task = res.rows[0];
    if (!task) return null;

    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'TASK_UPDATED', 'TASK', $3, $4);`,
      [orgId, userId, taskId, JSON.stringify({ title: task.title, status, priority })]
    );

    return task;
  });
};

export const deleteTask = async (taskId, orgId, userId) => {
  return await withTransaction(async (client) => {
    const res = await client.query(
      `DELETE FROM tasks WHERE id = $1 AND organization_id = $2 RETURNING id, title;`,
      [taskId, orgId]
    );
    const deleted = res.rows[0];
    if (!deleted) return null;

    await client.query(
      `INSERT INTO audit_logs (organization_id, actor_user_id, action, entity_type, entity_id, metadata)
       VALUES ($1, $2, 'TASK_DELETED', 'TASK', $3, $4);`,
      [orgId, userId, taskId, JSON.stringify({ title: deleted.title })]
    );

    return deleted;
  });
};
