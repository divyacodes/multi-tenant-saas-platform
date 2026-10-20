import { query } from '../../config/db.js';

export const getDashboardStats = async (orgId) => {
  // Efficient SQL query combining counts with conditional aggregation
  const res = await query(
    `SELECT
       (SELECT COUNT(*)::int FROM projects WHERE organization_id = $1) as total_projects,
       (SELECT COUNT(*)::int FROM projects WHERE organization_id = $1 AND status = 'Active') as active_projects,
       (SELECT COUNT(*)::int FROM projects WHERE organization_id = $1 AND status = 'Completed') as completed_projects,
       (SELECT COUNT(*)::int FROM tasks WHERE organization_id = $1) as total_tasks,
       (SELECT COUNT(*)::int FROM tasks WHERE organization_id = $1 AND status = 'In Progress') as tasks_in_progress,
       (SELECT COUNT(*)::int FROM tasks WHERE organization_id = $1 AND status = 'Done') as completed_tasks,
       (SELECT COUNT(*)::int FROM tasks WHERE organization_id = $1 AND status != 'Done' AND due_date < CURRENT_DATE) as overdue_tasks,
       (SELECT COUNT(*)::int FROM memberships WHERE organization_id = $1 AND status = 'active') as active_members;`,
    [orgId]
  );

  return res.rows[0];
};

export const getRecentActivity = async (orgId, limit = 15) => {
  const res = await query(
    `SELECT 
       a.id,
       a.organization_id,
       a.action,
       a.entity_type,
       a.entity_id,
       a.metadata,
       a.created_at,
       u.name as actor_name,
       u.email as actor_email
     FROM audit_logs a
     LEFT JOIN users u ON u.id = a.actor_user_id
     WHERE a.organization_id = $1
     ORDER BY a.created_at DESC
     LIMIT $2;`,
    [orgId, limit]
  );

  return res.rows;
};
