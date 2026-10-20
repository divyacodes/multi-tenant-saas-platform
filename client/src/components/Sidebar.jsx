import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Chip
} from '@mui/material';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import SecurityOutlinedIcon from '@mui/icons-material/SecurityOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { useAuth } from '../context/AuthContext';

const DRAWER_WIDTH = 250;

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/dashboard', icon: DashboardOutlinedIcon },
  { label: 'Projects', path: '/projects', icon: FolderOutlinedIcon },
  { label: 'Tasks', path: '/tasks', icon: CheckCircleOutlineIcon },
  { label: 'Team Members', path: '/team', icon: PeopleOutlineIcon },
  { label: 'Roles & Permissions', path: '/roles', icon: SecurityOutlinedIcon, adminOnly: true },
  { label: 'Org Settings', path: '/settings/organization', icon: SettingsOutlinedIcon, adminOnly: true }
];

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const location = useLocation();
  const { currentOrg, isAdmin } = useAuth();

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Brand Header */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          sx={{
            width: 38,
            height: 38,
            borderRadius: 2.5,
            background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.35)'
          }}
        >
          <RocketLaunchIcon sx={{ color: '#fff', fontSize: 20 }} />
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 800, lineHeight: 1.1, letterSpacing: -0.5 }}>
            SaaS<span style={{ color: '#818cf8' }}>Hub</span>
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
            Multi-Tenant Platform
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.08)' }} />

      {/* Navigation Links */}
      <List sx={{ px: 1.5, py: 2, flex: 1 }}>
        {NAV_ITEMS.map((item) => {
          if (item.adminOnly && !isAdmin) return null;

          const isActive = location.pathname.startsWith(item.path);
          const Icon = item.icon;

          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.75 }}>
              <ListItemButton
                component={NavLink}
                to={item.path}
                onClick={onMobileClose}
                sx={{
                  borderRadius: 2,
                  py: 1.1,
                  px: 1.75,
                  bgcolor: isActive ? 'rgba(99, 102, 241, 0.12)' : 'transparent',
                  color: isActive ? 'primary.light' : 'text.secondary',
                  border: isActive ? '1px solid rgba(99, 102, 241, 0.25)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: 'rgba(255, 255, 255, 0.04)',
                    color: 'text.primary'
                  }
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 38,
                    color: isActive ? 'primary.light' : 'text.secondary'
                  }}
                >
                  <Icon fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 500
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Footer Tenant Info */}
      <Box sx={{ p: 2, m: 1.5, borderRadius: 2, bgcolor: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
        <Typography variant="caption" color="text.secondary" display="block">
          Active Workspace
        </Typography>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {currentOrg?.name || 'No Org'}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            bgcolor: '#0e1424',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)'
          }
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Persistent Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: DRAWER_WIDTH,
            boxSizing: 'border-box',
            bgcolor: '#0e1424',
            borderRight: '1px solid rgba(255, 255, 255, 0.08)'
          }
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
}
