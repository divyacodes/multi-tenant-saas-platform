import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  Stack,
  Divider,
  Chip
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import SaveIcon from '@mui/icons-material/Save';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import LoadingState from '../../components/LoadingState';

export default function OrgSettings() {
  const { currentOrg, hasPermission, refreshUser } = useAuth();

  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: 'info' });

  useEffect(() => {
    const fetchOrg = async () => {
      if (!currentOrg) return;
      try {
        setLoading(true);
        const res = await api.get(`/organizations/${currentOrg.id}`);
        if (res.data.success) {
          setName(res.data.data.name);
          setSlug(res.data.data.slug);
        }
      } catch (err) {
        console.error('Failed to fetch org details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrg();
  }, [currentOrg]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      setMessage({ text: '', type: 'info' });
      const res = await api.patch(`/organizations/${currentOrg.id}`, { name: name.trim() });
      if (res.data.success) {
        setMessage({ text: 'Organization settings updated successfully.', type: 'success' });
        await refreshUser();
      }
    } catch (err) {
      setMessage({ text: err.response?.data?.message || 'Failed to update organization.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState rows={3} />;
  }

  return (
    <Box sx={{ maxWidth: 750 }}>
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
          Organization Settings
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Manage workspace identity and tenant details
        </Typography>
      </Box>

      <Paper sx={{ p: 4, borderRadius: 3 }}>
        {message.text && (
          <Alert severity={message.type} sx={{ mb: 3 }}>
            {message.text}
          </Alert>
        )}

        <form onSubmit={handleUpdate}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                General Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This is the public display name of your organization.
              </Typography>

              <TextField
                label="Organization Name"
                fullWidth
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={!hasPermission('organization:update')}
                required
              />
            </Box>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                Workspace Identifiers
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Unique system identifiers assigned to this tenant partition.
              </Typography>

              <Stack spacing={2}>
                <TextField
                  label="Organization Slug"
                  fullWidth
                  value={slug}
                  disabled
                  helperText="Unique permanent slug generated upon workspace creation"
                />

                <TextField
                  label="Tenant UUID"
                  fullWidth
                  value={currentOrg?.id || ''}
                  disabled
                  helperText="Database identifier used for tenant isolation"
                />
              </Stack>
            </Box>

            {hasPermission('organization:update') && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  startIcon={<SaveIcon />}
                  disabled={saving || !name.trim()}
                >
                  {saving ? 'Saving...' : 'Save Settings'}
                </Button>
              </Box>
            )}
          </Stack>
        </form>
      </Paper>
    </Box>
  );
}
