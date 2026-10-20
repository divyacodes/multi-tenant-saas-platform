import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  Chip,
  Breadcrumbs,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const { hasPermission, currentOrg } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Task Dialog state
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    priority: 'Medium',
    status: 'Todo',
    assignedTo: '',
    dueDate: ''
  });
  const [taskError, setTaskError] = useState('');
  const [taskSubmitting, setTaskSubmitting] = useState(false);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const [projRes, tasksRes, membersRes] = await Promise.all([
        api.get(`/projects/${projectId}`),
        api.get(`/tasks?projectId=${projectId}&limit=50`),
        api.get(`/organizations/${currentOrg?.id}/members`)
      ]);

      if (projRes.data.success) {
        setProject(projRes.data.data);
      }
      if (tasksRes.data.success) {
        setTasks(tasksRes.data.data);
      }
      if (membersRes.data.success) {
        setMembers(membersRes.data.data);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectId && currentOrg) {
      fetchProjectDetails();
    }
  }, [projectId, currentOrg]);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError('');
    setTaskSubmitting(true);

    try {
      const payload = {
        projectId,
        title: taskForm.title,
        description: taskForm.description || undefined,
        priority: taskForm.priority,
        status: taskForm.status,
        assignedTo: taskForm.assignedTo || undefined,
        dueDate: taskForm.dueDate || undefined
      };

      await api.post('/tasks', payload);
      setTaskModalOpen(false);
      setTaskForm({ title: '', description: '', priority: 'Medium', status: 'Todo', assignedTo: '', dueDate: '' });
      fetchProjectDetails();
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Failed to create task');
    } finally {
      setTaskSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState rows={4} />;
  }

  if (!project) {
    return (
      <EmptyState
        title="Project not found"
        description="This project may have been deleted or belongs to a different organization."
        actionLabel="Back to Projects"
        onAction={() => navigate('/projects')}
      />
    );
  }

  return (
    <Box>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 2 }}>
        <Link component={RouterLink} to="/projects" color="inherit" underline="hover">
          Projects
        </Link>
        <Typography color="text.primary">{project.name}</Typography>
      </Breadcrumbs>

      {/* Project Banner Card */}
      <Paper sx={{ p: 3.5, borderRadius: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="h4" sx={{ fontWeight: 800 }}>
                {project.name}
              </Typography>
              <Chip label={project.status} color="primary" size="small" sx={{ fontWeight: 600 }} />
            </Stack>
            <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 700, mb: 2 }}>
              {project.description || 'No description provided.'}
            </Typography>

            <Stack direction="row" spacing={3} sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
              <span>Created by: <strong>{project.creator_name || 'System'}</strong></span>
              <span>Created: <strong>{new Date(project.created_at).toLocaleDateString()}</strong></span>
              <span>Tasks: <strong>{project.completed_tasks} / {project.total_tasks} completed</strong></span>
            </Stack>
          </Box>

          {hasPermission('task:create') && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setTaskModalOpen(true)}
            >
              Add Task
            </Button>
          )}
        </Box>
      </Paper>

      {/* Linked Tasks Section */}
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 2 }}>
        Project Tasks ({tasks.length})
      </Typography>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks in this project"
          description="Create actionable tasks to track project progress."
          actionLabel={hasPermission('task:create') ? "Add Task" : undefined}
          onAction={() => setTaskModalOpen(true)}
        />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>TITLE</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PRIORITY</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ASSIGNEE</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>DUE DATE</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {tasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {task.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.status}
                      size="small"
                      color={task.status === 'Done' ? 'success' : task.status === 'In Progress' ? 'primary' : 'default'}
                      sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={task.priority}
                      size="small"
                      variant="outlined"
                      color={task.priority === 'Urgent' ? 'error' : task.priority === 'High' ? 'warning' : 'default'}
                      sx={{ fontSize: '0.72rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {task.assignee_name || 'Unassigned'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">
                      {task.due_date ? new Date(task.due_date).toLocaleDateString() : '-'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Create Task Modal */}
      <Dialog open={taskModalOpen} onClose={() => setTaskModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateTask}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add Task to {project.name}</DialogTitle>
          <DialogContent>
            {taskError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {taskError}
              </Alert>
            )}

            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Task Title"
                fullWidth
                required
                value={taskForm.title}
                onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                placeholder="e.g. Design Landing Page Mockup"
                autoFocus
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2.5}
                value={taskForm.description}
                onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="Priority"
                  fullWidth
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                >
                  {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={taskForm.status}
                  onChange={(e) => setTaskForm({ ...taskForm, status: e.target.value })}
                >
                  {['Todo', 'In Progress', 'Done'].map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              <TextField
                select
                label="Assignee"
                fullWidth
                value={taskForm.assignedTo}
                onChange={(e) => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
              >
                <MenuItem value="">Unassigned</MenuItem>
                {members.map((m) => (
                  <MenuItem key={m.user_id} value={m.user_id}>
                    {m.user_name} ({m.role_name})
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Due Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={taskForm.dueDate}
                onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setTaskModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={taskSubmitting || !taskForm.title.trim()}
            >
              {taskSubmitting ? 'Creating...' : 'Create Task'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
