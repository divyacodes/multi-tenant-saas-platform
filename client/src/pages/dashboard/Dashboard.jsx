import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  LinearProgress,
  Stack,
  Chip,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon
} from '@mui/material';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import AddIcon from '@mui/icons-material/Add';
import HistoryIcon from '@mui/icons-material/History';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../api/client';
import LoadingState from '../../components/LoadingState';

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentOrg } = useAuth();
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentOrg) return;
      try {
        setLoading(true);
        const [statsRes, actRes] = await Promise.all([
          api.get('/dashboard/stats'),
          api.get('/dashboard/activity?limit=8')
        ]);

        if (statsRes.data.success) {
          setStats(statsRes.data.data);
        }
        if (actRes.data.success) {
          setActivities(actRes.data.data);
        }
      } catch (err) {
        console.error('Error fetching dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentOrg]);

  if (loading) {
    return <LoadingState rows={5} />;
  }

  const completionRate = stats && stats.total_tasks > 0 
    ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
    : 0;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3.5, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Dashboard Overview
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Metrics and real-time status for <strong style={{ color: '#f8fafc' }}>{currentOrg?.name}</strong>
          </Typography>
        </Box>

        <Stack direction="row" spacing={1.5}>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => navigate('/projects')}
            sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }}
          >
            New Project
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => navigate('/tasks')}
          >
            New Task
          </Button>
        </Stack>
      </Box>

      {/* Metric KPI Cards */}
      <Grid container spacing={2.5} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  TOTAL PROJECTS
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(99, 102, 241, 0.12)', color: 'primary.light' }}>
                  <FolderOutlinedIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                {stats?.total_projects || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats?.active_projects || 0} active in progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  TOTAL TASKS
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(6, 182, 212, 0.12)', color: 'secondary.light' }}>
                  <PendingActionsIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800 }}>
                {stats?.total_tasks || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stats?.tasks_in_progress || 0} currently active
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  COMPLETED TASKS
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(16, 185, 129, 0.12)', color: '#10b981' }}>
                  <CheckCircleOutlineIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: '#10b981' }}>
                {stats?.completed_tasks || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {completionRate}% completion rate
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  OVERDUE TASKS
                </Typography>
                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }}>
                  <WarningAmberIcon fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 800, color: stats?.overdue_tasks > 0 ? '#ef4444' : 'text.primary' }}>
                {stats?.overdue_tasks || 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Requires team attention
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Progress & Activity Grid */}
      <Grid container spacing={3}>
        {/* Progress Breakdown */}
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              Task Completion Status
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Overall velocity for current organization tasks
            </Typography>

            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Completion Progress
                </Typography>
                <Typography variant="body2" color="primary.light" sx={{ fontWeight: 700 }}>
                  {completionRate}%
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={completionRate}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  bgcolor: 'rgba(255, 255, 255, 0.08)',
                  '& .MuiLinearProgress-bar': {
                    borderRadius: 5,
                    background: 'linear-gradient(90deg, #6366f1 0%, #10b981 100%)'
                  }
                }}
              />
            </Box>

            <Stack spacing={2} sx={{ pt: 2, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#94a3b8' }} />
                  <Typography variant="body2" color="text.secondary">To Do</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {(stats?.total_tasks || 0) - (stats?.tasks_in_progress || 0) - (stats?.completed_tasks || 0)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#3b82f6' }} />
                  <Typography variant="body2" color="text.secondary">In Progress</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {stats?.tasks_in_progress || 0}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: '#10b981' }} />
                  <Typography variant="body2" color="text.secondary">Completed</Typography>
                </Box>
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {stats?.completed_tasks || 0}
                </Typography>
              </Box>
            </Stack>

            <Button
              variant="outlined"
              fullWidth
              endIcon={<ArrowForwardIcon />}
              onClick={() => navigate('/tasks')}
              sx={{ mt: 3 }}
            >
              View All Tasks
            </Button>
          </Paper>
        </Grid>

        {/* Recent Activity Audit Log */}
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Recent Activity
              </Typography>
              <Chip label="Tenant Audit Log" size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />
            </Box>

            {activities.length === 0 ? (
              <Box sx={{ py: 6, textAlign: 'center' }}>
                <HistoryIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1, opacity: 0.5 }} />
                <Typography variant="body2" color="text.secondary">
                  No activity recorded yet for this organization.
                </Typography>
              </Box>
            ) : (
              <List disablePadding>
                {activities.map((act, index) => (
                  <React.Fragment key={act.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemIcon sx={{ minWidth: 36, color: 'primary.light' }}>
                        <HistoryIcon fontSize="small" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {act.action.replace(/_/g, ' ')}
                            </Typography>
                            <Chip
                              label={act.entity_type}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem' }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            By {act.actor_name || 'System'} • {new Date(act.created_at).toLocaleString()}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < activities.length - 1 && (
                      <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.06)' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
