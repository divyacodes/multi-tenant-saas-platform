import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Alert,
  Stack,
  Divider,
  Paper
} from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';
import AddIcon from '@mui/icons-material/Add';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../../components/LoadingState';

export default function RoleList() {
  const { currentOrg, hasPermission } = useAuth();

  const [roles, setRoles] = useState([]);
  const [allPermissions, setAllPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [roleName, setRoleName] = useState('');
  const [roleDesc, setRoleDesc] = useState('');
  const [selectedPerms, setSelectedPerms] = useState([]);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRolesData = async () => {
    if (!currentOrg) return;
    try {
      setLoading(true);
      const [rolesRes, permsRes] = await Promise.all([
        api.get(`/organizations/${currentOrg.id}/roles`),
        api.get('/permissions')
      ]);

      if (rolesRes.data.success) {
        setRoles(rolesRes.data.data);
      }
      if (permsRes.data.success) {
        setAllPermissions(permsRes.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesData();
  }, [currentOrg]);

  const handleCheckboxToggle = (permKey) => {
    if (selectedPerms.includes(permKey)) {
      setSelectedPerms(selectedPerms.filter(p => p !== permKey));
    } else {
      setSelectedPerms([...selectedPerms, permKey]);
    }
  };

  const handleCreateRole = async (e) => {
    e.preventDefault();
    if (!roleName.trim()) return;
    if (selectedPerms.length === 0) {
      setError('Please select at least one permission');
      return;
    }

    try {
      setError('');
      setSubmitting(true);
      await api.post(`/organizations/${currentOrg.id}/roles`, {
        name: roleName.trim(),
        description: roleDesc.trim() || undefined,
        permissionKeys: selectedPerms
      });
      setCreateModalOpen(false);
      setRoleName('');
      setRoleDesc('');
      setSelectedPerms([]);
      fetchRolesData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create role');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingState rows={4} />;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Roles & Permissions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Role-Based Access Control matrix for <strong style={{ color: '#f8fafc' }}>{currentOrg?.name}</strong>
          </Typography>
        </Box>

        {hasPermission('role:manage') && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateModalOpen(true)}
          >
            Create Custom Role
          </Button>
        )}
      </Box>

      {/* Role Cards Grid */}
      <Grid container spacing={3}>
        {roles.map((role) => (
          <Grid item xs={12} md={6} lg={4} key={role.id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>
                    {role.name}
                  </Typography>
                  <Chip
                    icon={role.is_system_role ? <VerifiedUserIcon /> : <SecurityIcon />}
                    label={role.is_system_role ? 'System Role' : 'Custom'}
                    size="small"
                    color={role.is_system_role ? 'primary' : 'secondary'}
                    variant="outlined"
                    sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ minHeight: 40, mb: 2 }}>
                  {role.description || 'Custom organization role.'}
                </Typography>

                <Divider sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.08)' }} />

                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', display: 'block', mb: 1 }}>
                  GRANTED PERMISSIONS ({role.permissions?.length || 0})
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  {role.permissions && role.permissions.map((perm) => (
                    <Chip
                      key={perm}
                      label={perm}
                      size="small"
                      sx={{
                        fontSize: '0.68rem',
                        bgcolor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid rgba(255, 255, 255, 0.1)'
                      }}
                    />
                  ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Custom Role Dialog */}
      <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreateRole}>
          <DialogTitle sx={{ fontWeight: 700 }}>Create Custom Role</DialogTitle>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Stack spacing={2.5} sx={{ mt: 1 }}>
              <TextField
                label="Role Name"
                fullWidth
                required
                value={roleName}
                onChange={(e) => setRoleName(e.target.value)}
                placeholder="e.g. Lead Developer"
                autoFocus
              />

              <TextField
                label="Description"
                fullWidth
                multiline
                rows={2}
                value={roleDesc}
                onChange={(e) => setRoleDesc(e.target.value)}
                placeholder="Responsibilities and access scope..."
              />

              <Typography variant="subtitle2" sx={{ fontWeight: 600, mt: 1 }}>
                Select Granular Permissions:
              </Typography>

              <Paper sx={{ p: 2, maxHeight: 260, overflowY: 'auto', bgcolor: 'rgba(0, 0, 0, 0.2)' }}>
                <FormGroup>
                  {allPermissions.map((perm) => (
                    <FormControlLabel
                      key={perm.id}
                      control={
                        <Checkbox
                          checked={selectedPerms.includes(perm.key)}
                          onChange={() => handleCheckboxToggle(perm.key)}
                          size="small"
                        />
                      }
                      label={
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {perm.key}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {perm.description}
                          </Typography>
                        </Box>
                      }
                      sx={{ mb: 1, alignItems: 'flex-start' }}
                    />
                  ))}
                </FormGroup>
              </Paper>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setCreateModalOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={submitting || !roleName.trim()}
            >
              {submitting ? 'Creating...' : 'Create Role'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}
