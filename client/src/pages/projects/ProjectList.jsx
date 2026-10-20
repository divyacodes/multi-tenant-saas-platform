import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';
import LoadingState from '../../components/LoadingState';

const STATUS_OPTIONS = ['All', 'Planning', 'Active', 'On Hold', 'Completed', 'Archived'];

export default function ProjectList() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', status: 'Active' });
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Delete State
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {
        page,
        limit: 8,
        search: search.trim() || undefined,
        status: statusFilter === 'All' ? undefined : statusFilter
      };

      const res = await api.get('/projects', { params });
      if (res.data.success) {
        setProjects(res.data.data);
        setTotal(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to fetch projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProjects();
  };

  const handleOpenCreateModal = () => {
    setEditProject(null);
    setFormData({ name: '', description: '', status: 'Active' });
    setFormError('');
    setModalOpen(true);
  };

  const handleOpenEditModal = (project) => {
    setEditProject(project);
    setFormData({
      name: project.name,
      description: project.description || '',
      status: project.status
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSubmitting(true);

    try {
      if (editProject) {
        await api.patch(`/projects/${editProject.id}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      setModalOpen(false);
      fetchProjects();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save project');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteClick = (project) => {
    setProjectToDelete(project);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!projectToDelete) return;
    try {
      await api.delete(`/projects/${projectToDelete.id}`);
      setDeleteConfirmOpen(false);
      setProjectToDelete(null);
      fetchProjects();
    } catch (err) {
      console.error('Delete project failed:', err);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'primary';
      case 'Completed': return 'success';
      case 'On Hold': return 'warning';
      case 'Archived': return 'default';
      default: return 'info';
    }
  };

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Projects
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage your organization's initiatives, tasks, and progress
          </Typography>
        </Box>

        {hasPermission('project:create') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenCreateModal}
          >
            Create Project
          </Button>
        )}
      </Box>

      {/* Filters and Search Bar */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <form onSubmit={handleSearchSubmit} style={{ flex: 1, width: '100%' }}>
            <TextField
              size="small"
              placeholder="Search projects by name..."
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

          <TextField
            select
            size="small"
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            sx={{ minWidth: 160, width: { xs: '100%', sm: 'auto' } }}
          >
            {STATUS_OPTIONS.map((opt) => (
              <MenuItem key={opt} value={opt}>
                {opt}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Paper>

      {/* Projects Table / Empty State */}
      {loading ? (
        <LoadingState rows={4} />
      ) : projects.length === 0 ? (
        <EmptyState
          title="No projects found"
          description={search ? "No projects match your search criteria." : "Create your organization's first project to organize work."}
          actionLabel={hasPermission('project:create') ? "Create Project" : undefined}
          onAction={handleOpenCreateModal}
        />
      ) : (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 3, mb: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>PROJECT NAME</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>TASKS</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>CREATED BY</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>DATE</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>ACTIONS</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {projects.map((proj) => (
                  <TableRow
                    key={proj.id}
                    hover
                    sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/projects/${proj.id}`)}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {proj.name}
                      </Typography>
                      {proj.description && (
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 300, display: 'block' }}>
                          {proj.description}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={proj.status}
                        size="small"
                        color={getStatusColor(proj.status)}
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {proj.completed_tasks} / {proj.total_tasks} done
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {proj.creator_name || 'System'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(proj.created_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <IconButton
                        size="small"
                        color="inherit"
                        onClick={() => navigate(`/projects/${proj.id}`)}
                      >
                        <VisibilityOutlinedIcon fontSize="small" />
                      </IconButton>

                      {hasPermission('project:update') && (
                        <IconButton
                          size="small"
                          color="inherit"
                          onClick={() => handleOpenEditModal(proj)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      )}

                      {hasPermission('project:delete') && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteClick(proj)}
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

      {/* Project Form Modal */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleFormSubmit}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            {editProject ? 'Edit Project' : 'Create New Project'}
          </DialogTitle>
          <DialogContent>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}

            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Project Name"
                fullWidth
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Website Redesign"
                autoFocus
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Goals, milestones, and deliverables..."
              />

              <TextField
                select
                label="Status"
                fullWidth
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                {STATUS_OPTIONS.filter((s) => s !== 'All').map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </TextField>
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
              disabled={formSubmitting || !formData.name.trim()}
            >
              {formSubmitting ? 'Saving...' : editProject ? 'Update Project' : 'Create Project'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Delete Project?"
        message={`Are you sure you want to delete "${projectToDelete?.name}"? All associated tasks will be permanently removed.`}
        confirmText="Delete Project"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
}
