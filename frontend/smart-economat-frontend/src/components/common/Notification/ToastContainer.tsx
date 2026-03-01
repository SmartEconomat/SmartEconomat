import React from 'react';
import { Snackbar, Alert, Stack, Box, Typography } from '@mui/material';
import { useToastList } from '../../../store/ToastContext';
import { getCategoryIconFilled } from '../../../features/productos/utils/getCategoryIconFilled';

const TOAST_WIDTH = 360;

export default function ToastContainer() {
    const { toasts, removeToast } = useToastList();

    return (
        <Stack
            spacing={1.5}
            sx={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: { xs: 'calc(100% - 48px)', sm: TOAST_WIDTH },
                maxWidth: TOAST_WIDTH,
                alignItems: 'stretch',
            }}
        >
            {toasts.map((toast) => (
                <Snackbar
                    key={toast.id}
                    open={true}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
                    sx={{ position: 'relative', width: '100%' }}
                >
                    <Alert
                        onClose={() => removeToast(toast.id)}
                        severity={toast.type}
                        variant="filled"
                        icon={false}
                        sx={{
                            width: `${TOAST_WIDTH}px`,
                            maxWidth: '100%',
                            boxShadow: 3,
                            display: 'flex',
                            alignItems: 'center',
                            py: 1,
                            px: 2,
                            '& .MuiAlert-message': {
                                width: '100%',
                                p: 0,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1.5,
                            },
                            '& .MuiAlert-action': {
                                pt: 0,
                                pr: 0,
                                ml: 'auto',
                                alignItems: 'center',
                            },
                        }}
                    >
                        {/* Icono de categoría de producto (siempre visible) */}
                        <Box
                            component="span"
                            sx={{ display: 'flex', alignItems: 'center', color: 'inherit', flexShrink: 0 }}
                        >
                            {getCategoryIconFilled(toast.productCategory, { sx: { fontSize: 20 } })}
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
