import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Stack,
  IconButton
} from '@mui/material';
import PersonAddAltIcon from '@mui/icons-material/PersonAddAlt';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../../components/LoadingState';
import EmptyState from '../../components/EmptyState';

const ROLES = ['Admin', 'Manager', 'Member'];

export default function TeamList() {
  const { user, currentOrg, hasPermission, isAdmin } = useAuth();

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Invite/Add modal state
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [roleName, setRoleName] = useState('Member');
  const [addError, setAddError] = useState('');
  const [addSubmitting, setAddSubmitting] = useState(false);

  // Edit role modal state
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [editRole, setEditRole] = useState('');
  const [editStatus, setEditStatus] = useState('');
  const [editError, setEditError] = useState('');
  const [editSubmitting, setEditSubmitting] = useState(false);

  const fetchMembers = async () => {
    if (!currentOrg) return;
    try {
      setLoading(true);
      const res = await api.get(`/organizations/${currentOrg.id}/members`);
      if (res.data.success) {
        setMembers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [currentOrg]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddError('');
    setAddSubmitting(true);

    try {
      await api.post(`/organizations/${currentOrg.id}/members`, {
        email: email.trim(),
        roleName
      });
      setAddModalOpen(false);
      setEmail('');
      setRoleName('Member');
      fetchMembers();
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddSubmitting(false);
    }
  };

  const handleOpenEdit = (mem) => {
    setSelectedMember(mem);
    setEditRole(mem.role_name);
    setEditStatus(mem.status);
    setEditError('');
    setEditModalOpen(true);
  };

  const handleUpdateMember = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);

    try {
      await api.patch(`/organizations/${currentOrg.id}/members/${selectedMember.membership_id}`, {
        roleName: editRole,
        status: editStatus
      });
      setEditModalOpen(false);
      fetchMembers();
    } catch (err) {
      setEditError(err.response?.data?.message || 'Failed to update member');
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Team Members
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Manage members and role permissions for <strong style={{ color: '#f8fafc' }}>{currentOrg?.name}</strong>
          </Typography>
        </Box>

        {hasPermission('user:manage') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<PersonAddAltIcon />}
            onClick={() => setAddModalOpen(true)}
          >
            Add Member
          </Button>
        )}
      </Box>

      {loading ? (
        <LoadingState rows={4} />
      ) : members.length === 0 ? (
        <EmptyState
          title="No members found"
          description="Add teammates by email to collaborate."
          actionLabel={hasPermission('user:manage') ? "Add Member" : undefined}
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table>
            <TableHead sx={{ bgcolor: 'rgba(255, 255, 255, 0.02)' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 700 }}>USER</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>ROLE</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>JOINED DATE</TableCell>
                {isAdmin && <TableCell align="right" sx={{ fontWeight: 700 }}>ACTIONS</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((mem) => {
                const isCurrentUser = mem.user_id === user?.id;

                return (
                  <TableRow key={mem.membership_id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.dark', fontSize: '0.85rem' }}>
                          {mem.user_name ? mem.user_name.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {mem.user_name} {isCurrentUser && <Chip label="You" size="small" sx={{ ml: 0.5, height: 18, fontSize: '0.65rem' }} />}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {mem.user_email}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={mem.role_name}
                        size="small"
                        color={mem.role_name === 'Admin' ? 'primary' : mem.role_name === 'Manager' ? 'secondary' : 'default'}
                        variant={mem.role_name === 'Member' ? 'outlined' : 'filled'}
                        sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={mem.status}
                        size="small"
                        color={mem.status === 'active' ? 'success' : 'error'}
                        variant="outlined"
                        sx={{ fontSize: '0.72rem', textTransform: 'capitalize' }}
                      />
                    </TableCell>

                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(mem.joined_at).toLocaleDateString()}
                      </Typography>
                    </TableCell>

                    {isAdmin && (
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          color="inherit"
                          onClick={() => handleOpenEdit(mem)}
                          title="Edit role and status"
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Member Modal */}
      <Dialog open={addModalOpen} onClose={() => setAddModalOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleAddMember}>
          <DialogTitle sx={{ fontWeight: 700 }}>Add Team Member</DialogTitle>
          <DialogContent>
            {addError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {addError}
              </Alert>
            )}

            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Registered User Email"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colleague@company.com"
                helperText="Must be an existing registered user on the platform"
                autoFocus
              />

              <TextField
                select
                label="Assigned Role"
                fullWidth
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setAddModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={addSubmitting || !email.trim()}
            >
              {addSubmitting ? 'Adding...' : 'Add to Organization'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Member Modal */}
      <Dialog open={editModalOpen} onClose={() => setEditModalOpen(false)} maxWidth="xs" fullWidth>
        <form onSubmit={handleUpdateMember}>
          <DialogTitle sx={{ fontWeight: 700 }}>
            Manage {selectedMember?.user_name}
          </DialogTitle>
          <DialogContent>
            {editError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {editError}
              </Alert>
            )}

            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                select
                label="Role"
                fullWidth
                value={editRole}
                onChange={(e) => setEditRole(e.target.value)}
                disabled={selectedMember?.user_id === user?.id}
                helperText={selectedMember?.user_id === user?.id ? "You cannot modify your own role" : ""}
              >
                {ROLES.map((r) => (
                  <MenuItem key={r} value={r}>{r}</MenuItem>
                ))}
              </TextField>

              <TextField
                select
                label="Membership Status"
                fullWidth
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value)}
                disabled={selectedMember?.user_id === user?.id}
              >
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="suspended">Suspended</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setEditModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={editSubmitting}
            >
              {editSubmitting ? 'Updating...' : 'Save Changes'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
