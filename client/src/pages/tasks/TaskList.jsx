import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  TextField,
  InputAdornment,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Alert,
  Select,
  FormControl,
  InputLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';

const STATUS_OPTIONS = ['All', 'Todo', 'In Progress', 'Done'];
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Urgent'];

export default function TaskList() {
  const { user, hasPermission, currentOrg } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [projectFilter, setProjectFilter] = useState('All');
  const [projectsList, setProjectsList] = useState([]);
  const [membersList, setMembersList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [formData, setFormData] = useState({
    projectId: '',
    title: '',
    description: '',
    status: 'Todo',
    priority: 'Medium',
    assignedTo: '',
    dueDate: ''
  });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const fetchAuxiliaryData = async () => {
    try {
      const [projRes, memRes] = await Promise.all([
        api.get('/projects?limit=100'),
        api.get(`/organizations/${currentOrg?.id}/members`)
      ]);
      if (projRes.data.success) {
        setProjectsList(projRes.data.data);
      }
      if (memRes.data.success) {
        setMembersList(memRes.data.data);
      }
    } catch (e) {
      console.error('Error fetching aux data:', e);
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 8,
        search: search.trim() || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter,
        priority: priorityFilter === 'All' ? undefined : priorityFilter,
        projectId: projectFilter === 'All' ? undefined : projectFilter
      };

      const res = await api.get('/tasks', { params });
      if (res.data.success) {
        setTasks(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentOrg) {
      fetchAuxiliaryData();
    }
  }, [currentOrg]);

  useEffect(() => {
    fetchTasks();
  }, [page, statusFilter, priorityFilter, projectFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchTasks();
  };

  const handleOpenCreateModal = () => {
    setEditTask(null);
    setFormData({
      projectId: projectsList.length > 0 ? projectsList[0].id : '',
      title: '',
      description: '',
      status: 'Todo',
      priority: 'Medium',
      assignedTo: '',
      dueDate: ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditTask(task);
    setFormData({
      projectId: task.project_id,
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      assignedTo: task.assigned_to || '',
      dueDate: task.due_date ? task.due_date.substring(0, 10) : ''
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      const payload = {
        title: formData.title,
        description: formData.description || undefined,
        status: formData.status,
        priority: formData.priority,
        assignedTo: formData.assignedTo || null,
        dueDate: formData.dueDate || null
      };

      if (editTask) {
        await api.patch(`/tasks/${editTask.id}`, payload);
      } else {
        await api.post('/tasks', { ...payload, projectId: formData.projectId });
      }

      setModalOpen(false);
      fetchTasks();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClick = (task) => {
    setTaskToDelete(task);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;
    try {
      await api.delete(`/tasks/${taskToDelete.id}`);
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
      fetchTasks();
    } catch (err) {
      console.error('Delete task failed:', err);
    }
  };

  const canEditTask = (task) => {
    if (currentOrg?.role_name === 'Admin' || currentOrg?.role_name === 'Manager') return true;
    return currentOrg?.role_name === 'Member' && task.assigned_to === user?.id;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Task Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Track, assign, and prioritize tasks across projects
          </Typography>
        </Box>

        {hasPermission('task:create') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
            disabled={projectsList.length === 0}
          >
            Create Task
          </Button>
        )}
      </Box>

      {/* Filter Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <GridStack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems="center">
            <form onSubmit={handleSearchSubmit} style={{ flex: 1, width: '100%' }}>
              <TextField
                size="small"
                placeholder="Search tasks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  )
                }}
              />
            </form>

            <Stack direction="row" spacing={1.5} sx={{ width: { xs: '100%', md: 'auto' } }}>
              <TextField
                select
                size="small"
                label="Status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                sx={{ minWidth: 120 }}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Priority"
                value={priorityFilter}
                onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}
                sx={{ minWidth: 120 }}
              >
                {PRIORITY_OPTIONS.map((opt) => (
                  <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Project"
                value={projectFilter}
                onChange={(e) => { setProjectFilter(e.target.value); setPage(1); }}
                sx={{ minWidth: 150 }}
              >
                <MenuItem value="All">All Projects</MenuItem>
                {projectsList.map((p) => (
                  <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>
        </GridStack>
      </Paper>

      {/* Tasks Table */}
      {loading ? (
        <LoadingState rows={5} />
      ) : tasks.length === 0 ? (
        <EmptyState
          title="No tasks found"
          description={projectsList.length === 0 ? "You need to create a project before adding tasks." : "No tasks match your current filter settings."}
          actionLabel={projectsList.length > 0 && hasPermission('task:create') ? "Create Task" : undefined}
          onAction={handleOpenCreateModal}
        />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>TASK TITLE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>PROJECT</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>PRIORITY</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>ASSIGNEE</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>DUE DATE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tasks.map((task) => (
                  <TableRow key={task.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {task.title}
                      </Typography>
                      {task.description && (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 260, display: 'block' }}>
                          {task.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip label={task.project_name} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
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
                    <TableCell align="right">
                      {canEditTask(task) && (
                        <IconButton
                          size="small"
                          color="inherit"
                          onClick={() => handleOpenEditModal(task)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}

                      {hasPermission('task:delete') && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(task)}
                        >
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {total > 8 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination
                count={Math.ceil(total / 8)}
                page={page}
                onChange={(_, val) => setPage(val)}
                color="primary"
              />
            </Box>
          )}
        </>
      )}

      {/* Task Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editTask ? 'Edit Task' : 'Create New Task'}
          </DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Stack spacing={2.5} sx={{ mt: 1 }}>
              {!editTask && (
                <TextField
                  select
                  label="Project"
                  fullWidth
                  required
                  value={formData.projectId}
                  onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                >
                  {projectsList.map((p) => (
                    <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                label="Task Title"
                fullWidth
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Implement JWT refresh strategy"
                autoFocus
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2.5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />

              <Stack direction="row" spacing={2}>
                <TextField
                  select
                  label="Priority"
                  fullWidth
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  {['Low', 'Medium', 'High', 'Urgent'].map((p) => (
                    <MenuItem key={p} value={p}>{p}</MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  label="Status"
                  fullWidth
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  {['Todo', 'In Progress', 'Done'].map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Stack>

              {hasPermission('task:assign') && (
                <TextField
                  select
                  label="Assignee"
                  fullWidth
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                >
                  <MenuItem value="">Unassigned</MenuItem>
                  {membersList.map((m) => (
                    <MenuItem key={m.user_id} value={m.user_id}>
                      {m.user_name} ({m.role_name})
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <TextField
                label="Due Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={formSubmitting || !formData.title.trim()}
            >
              {formSubmitting ? 'Saving...' : editTask ? 'Update Task' : 'Create Task'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Task?"
        message={`Are you sure you want to delete "${taskToDelete?.title}"?`}
        confirmText="Delete Task"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
}

function GridStack({ children }) {
  return <Box sx={{ width: '100%' }}>{children}</Box>;
}
