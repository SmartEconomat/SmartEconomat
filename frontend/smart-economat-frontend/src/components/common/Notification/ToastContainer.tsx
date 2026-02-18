import React from 'react';
import { Snackbar, Alert, Stack } from '@mui/material';
import { useToastList } from '../../../store/ToastContext';

export default function ToastContainer() {
    const { toasts, removeToast } = useToastList();

    return (
        <Stack
            spacing={2}
            sx={{
                position: 'fixed',
                bottom: 24,
                right: 24,
                zIndex: 9999,
                width: { xs: 'calc(100% - 48px)', sm: '350px' }
            }}
        >
            {toasts.map((toast) => (
                <Snackbar
                    key={toast.id}
                    open={true}
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    sx={{ position: 'relative' }}
                >
                    <Alert
                        onClose={() => removeToast(toast.id)}
                        severity={toast.type}
                        variant="filled"
                        sx={{ width: '100%', boxShadow: 3 }}
                    >
                        {toast.message}
                    </Alert>
                </Snackbar>
            ))}
        </Stack>
    );
}
