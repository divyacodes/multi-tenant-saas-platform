import React from 'react';
import { Box, Skeleton, Stack } from '@mui/material';

export default function LoadingState({ rows = 4 }) {
  return (
    <Stack spacing={2} sx={{ width: '100%', py: 2 }}>
      <Skeleton variant="rectangular" height={52} sx={{ borderRadius: 2 }} />
      {Array.from({ length: rows }).map((_, idx) => (
        <Skeleton key={idx} variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
      ))}
    </Stack>
  );
}
