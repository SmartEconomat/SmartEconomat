import React from 'react';
import { Snackbar, Alert, Stack, Box, Typography } from '@mui/material';
import { useToastList } from '../../../store/ToastContext';
import { getCategoryIconFilled } from '../../../features/productos/utils/getCategoryIconFilled';

const TOAST_WIDTH = 360;

export default function ToastContainer() {
    const { toasts, removeToast } = useToastList();

    return (
        <Stack
            spacing={2}
            sx={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 9999,
                width: { xs: 'calc(100% - 48px)', sm: TOAST_WIDTH },
                maxWidth: TOAST_WIDTH,
                alignItems: 'center',
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
                        sx={{
                            width: '100%',
                            boxShadow: 3,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            textAlign: 'center',
                            '& .MuiAlert-message': {
                                width: '100%',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: 1.5,
                            },
                        }}
                    >
                        {toast.productCategory != null ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5 }}>
                                <Box component="span" sx={{ display: 'flex', color: 'inherit' }}>
                                    {getCategoryIconFilled(toast.productCategory)}
                                </Box>
                                <Typography component="span" variant="body2" sx={{ color: 'inherit' }}>
                                    {toast.message}
                                </Typography>
                            </Box>
                        ) : (
                            toast.message
                        )}
                    </Alert>
                </Snackbar>
            ))}
        </Stack>
    );
}
