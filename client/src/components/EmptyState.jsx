import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import InboxOutlinedIcon from '@mui/icons-material/InboxOutlined';

export default function EmptyState({
  title = 'No items found',
  description = 'Get started by creating your first record.',
  actionLabel,
  onAction,
  icon: Icon = InboxOutlinedIcon
}) {
  return (
    <Paper
      sx={{
        py: 8,
        px: 3,
        textAlign: 'center',
        borderRadius: 3,
        borderStyle: 'dashed',
        borderColor: 'rgba(255, 255, 255, 0.15)',
        backgroundColor: 'transparent'
      }}
    >
      <Box
        sx={{
          display: 'inline-flex',
          p: 2,
          borderRadius: '50%',
          bgcolor: 'rgba(99, 102, 241, 0.1)',
          color: 'primary.light',
          mb: 2
        }}
      >
        <Icon sx={{ fontSize: 48 }} />
      </Box>
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 450, mx: 'auto', mb: 3 }}>
        {description}
      </Typography>
      {actionLabel && onAction && (
        <Button variant="contained" color="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Paper>
  );
}
