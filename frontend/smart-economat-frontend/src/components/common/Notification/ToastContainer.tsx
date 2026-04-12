import React from 'react';
import { Snackbar, Alert, Stack, Box, Typography } from '@mui/material';
import { useToastList } from '../../../store/toast.hooks';
import { getCategoryIconFilled } from '../../../features/productos/utils/getCategoryIconFilled';
import NearMeIcon from '@mui/icons-material/NearMeOutlined';

const TOAST_WIDTH = 360;

export default function ToastContainer() {
  const { toasts, removeToast } = useToastList();

  return (
    <Stack
      spacing={1.5}
      sx={{
        position: 'fixed',
        top: { xs: 16, sm: 24 },
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        width: { xs: 'calc(100% - 32px)', sm: TOAST_WIDTH },
        maxWidth: TOAST_WIDTH,
        alignItems: 'stretch',
      }}
    >
      {toasts.map((toast) => (
        <Snackbar
          key={toast.id}
          open={true}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{ position: 'relative', width: 'auto' }}
        >
          <Alert
            onClose={() => removeToast(toast.id)}
            severity={toast.type}
            variant="filled"
            icon={false}
            sx={{
              minWidth: { sm: 300 },
              maxWidth: { xs: '90vw', sm: 500 },
              boxShadow: 3,
              display: 'flex',
              alignItems: 'center',
              py: 1.5,
              px: 2,
              borderRadius: 2,
              overflow: 'visible', // Ensure no scrollbars
              '& .MuiAlert-message': {
                width: '100%',
                p: 0,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                overflow: 'visible',
              },
              '& .MuiAlert-action': {
                pt: 0,
                pr: 0,
                ml: 2,
                flexShrink: 0,
                alignItems: 'center',
              },
            }}
          >
            {/* Icono de categoría o navegación */}
            <Box
              component="span"
              sx={{
                display: 'flex',
                alignItems: 'center',
                color: 'inherit',
                flexShrink: 0,
              }}
            >
              {toast.iconType === 'navigation' ? (
                <NearMeIcon sx={{ fontSize: 20 }} />
              ) : (
                getCategoryIconFilled(toast.productCategory, {
                  sx: { fontSize: 20 },
                })
              )}
            </Box>

            {/* Mensaje */}
            <Typography
              component="span"
              variant="body2"
              sx={{ color: 'inherit', lineHeight: 1.4 }}
            >
              {toast.message}
            </Typography>
          </Alert>
        </Snackbar>
      ))}
    </Stack>
  );
}
