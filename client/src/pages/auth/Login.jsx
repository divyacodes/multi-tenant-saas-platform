import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Divider,
  Stack,
  Container
} from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAuth } from '../../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoFill = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: '#0b0f19',
        p: 2,
        backgroundImage: 'radial-gradient(circle at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 60%)'
      }}
    >
      <Container maxWidth="xs">
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box
            sx={{
              display: 'inline-flex',
              p: 1.5,
              borderRadius: 3,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              color: '#fff',
              mb: 1.5,
              boxShadow: '0 8px 24px rgba(99, 102, 241, 0.4)'
            }}
          >
            <RocketLaunchIcon sx={{ fontSize: 32 }} />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 800, letterSpacing: -0.5 }}>
            Welcome back
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sign in to access your organization workspace
          </Typography>
        </Box>

        <Card sx={{ bgcolor: '#111827', borderRadius: 3, border: '1px solid rgba(255, 255, 255, 0.1)' }}>
          <CardContent sx={{ p: 3.5 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                <TextField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                  autoFocus
                  placeholder="name@company.com"
                />

                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                  placeholder="••••••••"
                />

                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  disabled={loading}
                  sx={{ py: 1.25, fontWeight: 700 }}
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </Stack>
            </form>

            <Divider sx={{ my: 3, borderColor: 'rgba(255, 255, 255, 0.08)' }}>
              <Typography variant="caption" color="text.secondary">
                TEST DEMO USERS
              </Typography>
            </Divider>

            <Stack direction="row" spacing={1.5}>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => handleDemoFill('alice@tenanttest.com', 'Password123!')}
                sx={{ fontSize: '0.75rem', borderColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                Acme Admin
              </Button>
              <Button
                variant="outlined"
                size="small"
                fullWidth
                onClick={() => handleDemoFill('bob@tenanttest.com', 'Password123!')}
                sx={{ fontSize: '0.75rem', borderColor: 'rgba(255, 255, 255, 0.15)' }}
              >
                Bright Admin
              </Button>
            </Stack>

            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an organization?{' '}
                <RouterLink
                  to="/register"
                  style={{ color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}
                >
                  Create one now
                </RouterLink>
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
