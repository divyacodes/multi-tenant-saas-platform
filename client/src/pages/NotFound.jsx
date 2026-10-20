import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm" sx={{ py: 12, textAlign: 'center' }}>
      <Box
        sx={{
          display: 'inline-flex',
          p: 2,
          borderRadius: '50%',
          bgcolor: 'rgba(239, 68, 68, 0.1)',
          color: 'error.main',
          mb: 2
        }}
      >
        <ErrorOutlineIcon sx={{ fontSize: 64 }} />
      </Box>
      <Typography variant="h3" sx={{ fontWeight: 800, mb: 1 }}>
        404 - Page Not Found
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        The resource or page you requested does not exist or has been relocated.
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/dashboard')}
      >
        Return to Dashboard
      </Button>
    </Container>
  );
}
