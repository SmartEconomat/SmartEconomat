import React from 'react';
import { Box, Skeleton, Paper, Stack, Divider } from '@mui/material';

interface ListSkeletonProps {
  count?: number;
  hasHeader?: boolean;
  type?: 'list' | 'accordion' | 'table';
}

const ListSkeleton: React.FC<ListSkeletonProps> = ({
  count = 3,
  hasHeader = true,
  type = 'list',
}) => {
  const renderItem = (index: number) => (
    <Box key={index} sx={{ py: 2, px: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="circular" width={40} height={40} />
        <Box sx={{ flex: 1 }}>
          <Skeleton variant="text" width="60%" height={24} />
          <Skeleton variant="text" width="40%" height={16} sx={{ mt: 0.5 }} />
        </Box>
        <Skeleton
          variant="rectangular"
          width={80}
          height={32}
          sx={{ borderRadius: 1 }}
        />
      </Stack>
    </Box>
  );

  const renderAccordion = (index: number) => (
    <Paper
      key={index}
      elevation={0}
      sx={{
        mb: 2,
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          bgcolor: 'action.hover',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Stack direction="row" spacing={2} alignItems="center">
          <Skeleton variant="circular" width={32} height={32} />
          <Skeleton variant="text" width={150} height={24} />
        </Stack>
        <Skeleton variant="circular" width={24} height={24} />
      </Box>
    </Paper>
  );

  if (type === 'accordion') {
    return (
      <Box>
        {Array.from({ length: count }).map((_, i) => renderAccordion(i))}
      </Box>
    );
  }

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 2,
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
      }}
    >
      {hasHeader && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Skeleton variant="text" width="30%" height={32} />
        </Box>
      )}
      <Box>
        {Array.from({ length: count }).map((_, i) => (
          <React.Fragment key={i}>
            {renderItem(i)}
            {i < count - 1 && <Divider />}
          </React.Fragment>
        ))}
      </Box>
    </Paper>
  );
};

export default ListSkeleton;
