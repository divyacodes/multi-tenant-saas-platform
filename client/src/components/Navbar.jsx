import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Menu,
  MenuItem,
  Avatar,
  Chip,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CorporateFareIcon from '@mui/icons-material/CorporateFare';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import AddIcon from '@mui/icons-material/Add';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';

export default function Navbar({ onMobileMenuToggle }) {
  const { user, currentOrg, organizations, switchOrganization, logout, refreshUser } = useAuth();
  
  // Org Menu state
  const [orgMenuAnchor, setOrgMenuAnchor] = useState(null);
  // User Menu state
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  
  // Create Org Dialog state
  const [createOrgOpen, setCreateOrgOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const handleOpenOrgMenu = (event) => setOrgMenuAnchor(event.currentTarget);
  const handleCloseOrgMenu = () => setOrgMenuAnchor(null);

  const handleOpenUserMenu = (event) => setUserMenuAnchor(event.currentTarget);
  const handleCloseUserMenu = () => setUserMenuAnchor(null);

  const handleSelectOrg = (org) => {
    handleCloseOrgMenu();
    if (org.id !== currentOrg?.id) {
      switchOrganization(org);
    }
  };

  const handleCreateOrg = async (e) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    try {
      setCreateLoading(true);
      setCreateError('');
      const res = await api.post('/organizations', { name: newOrgName.trim() });
      if (res.data.success) {
        setCreateOrgOpen(false);
        setNewOrgName('');
        await refreshUser();
        // Switch to newly created organization
        const newOrg = {
          id: res.data.data.organization.id,
          name: res.data.data.organization.name,
          slug: res.data.data.organization.slug,
          role_name: 'Admin',
          membership_status: 'active'
        };
        switchOrganization(newOrg);
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || 'Failed to create organization');
    } finally {
      setCreateLoading(false);
    }
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: 'rgba(17, 24, 39, 0.85)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          zIndex: (theme) => theme.zIndex.drawer + 1
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', px: { xs: 2, sm: 3 } }}>
          {/* Left: Mobile Drawer button and Brand / Org Switcher */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              color="inherit"
              edge="start"
              onClick={onMobileMenuToggle}
              sx={{ display: { md: 'none' } }}
            >
              <MenuIcon />
            </IconButton>

            {/* Organization Selector */}
            <Button
              onClick={handleOpenOrgMenu}
              variant="outlined"
              size="small"
              startIcon={<CorporateFareIcon color="primary" />}
              endIcon={<KeyboardArrowDownIcon />}
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.15)',
                color: 'text.primary',
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                px: 1.5,
                py: 0.75,
                fontWeight: 600,
                textTransform: 'none',
                maxWidth: 240,
                justifyContent: 'space-between'
              }}
            >
              <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                {currentOrg?.name || 'Select Organization'}
              </Typography>
            </Button>

            {currentOrg?.role_name && (
              <Chip
                label={currentOrg.role_name}
                size="small"
                color={currentOrg.role_name === 'Admin' ? 'primary' : 'default'}
                variant="outlined"
                sx={{ height: 22, fontSize: '0.72rem', fontWeight: 600 }}
              />
            )}
          </Box>

          {/* Right: User Profile & Menu */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Button
              onClick={handleOpenUserMenu}
              sx={{
                textTransform: 'none',
                color: 'text.primary',
                display: 'flex',
                alignItems: 'center',
                gap: 1.25,
                p: 0.5,
                borderRadius: 2
              }}
            >
              <Avatar
                sx={{
                  width: 34,
                  height: 34,
                  bgcolor: 'primary.dark',
                  fontSize: '0.875rem',
                  fontWeight: 700
                }}
              >
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' }, textAlign: 'left' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                  {user?.name}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {user?.email}
                </Typography>
              </Box>
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Organization Switcher Dropdown */}
      <Menu
        anchorEl={orgMenuAnchor}
        open={Boolean(orgMenuAnchor)}
        onClose={handleCloseOrgMenu}
        PaperProps={{
          sx: {
            minWidth: 260,
            mt: 1.5,
            bgcolor: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2
          }
        }}
      >
        <Box sx={{ px: 2, py: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
            SWITCH ORGANIZATION
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />

        {organizations.map((org) => (
          <MenuItem
            key={org.id}
            selected={org.id === currentOrg?.id}
            onClick={() => handleSelectOrg(org)}
            sx={{
              py: 1.2,
              px: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {org.name}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {org.slug}
              </Typography>
            </Box>
            <Chip
              label={org.role_name}
              size="small"
              sx={{ height: 20, fontSize: '0.68rem' }}
            />
          </MenuItem>
        ))}

        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            handleCloseOrgMenu();
            setCreateOrgOpen(true);
          }}
          sx={{ py: 1.2, px: 2, color: 'primary.light', gap: 1 }}
        >
          <AddIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Create Organization
          </Typography>
        </MenuItem>
      </Menu>

      {/* User Options Dropdown */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={handleCloseUserMenu}
        PaperProps={{
          sx: {
            minWidth: 220,
            mt: 1.5,
            bgcolor: '#111827',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2
          }
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            {user?.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {user?.email}
          </Typography>
        </Box>
        <Divider sx={{ my: 0.5 }} />
        <MenuItem
          onClick={() => {
            handleCloseUserMenu();
            logout();
          }}
          sx={{ py: 1.2, px: 2, color: 'error.main', gap: 1.5 }}
        >
          <LogoutIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>
            Sign Out
          </Typography>
        </MenuItem>
      </Menu>

      {/* Create Organization Modal */}
      <Dialog
        open={createOrgOpen}
        onClose={() => setCreateOrgOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <form onSubmit={handleCreateOrg}>
          <DialogTitle sx={{ fontWeight: 700 }}>Create New Organization</DialogTitle>
          <DialogContent>
            {createError && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {createError}
              </Typography>
            )}
            <TextField
              autoFocus
              margin="dense"
              label="Organization Name"
              type="text"
              fullWidth
              variant="outlined"
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              placeholder="e.g. Apex Global"
              required
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2.5 }}>
            <Button onClick={() => setCreateOrgOpen(false)} color="inherit">
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={createLoading || !newOrgName.trim()}
            >
              {createLoading ? 'Creating...' : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}
