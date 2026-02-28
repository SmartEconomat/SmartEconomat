import React, { ReactNode } from 'react';
import { Button, Box, Typography } from '@mui/material';
import Modal from './Modal';
import Spinner from './Spinner';

type ButtonColor =
    | 'inherit'
    | 'primary'
    | 'secondary'
    | 'success'
    | 'error'
    | 'info'
    | 'warning';

export interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: ButtonColor;
    confirmVariant?: 'contained' | 'outlined' | 'text';
    isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = 'Confirmar acción',
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    confirmColor = 'error',
    confirmVariant = 'contained',
    isLoading = false,
}) => {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
            <Box sx={{ pb: 3 }}>
                {typeof message === 'string' ? (
                    <Typography variant="body1" color="text.secondary">
                        {message}
                    </Typography>
                ) : (
                    message
                )}
            </Box>

            {/* Acciones */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button onClick={onClose} color="inherit" variant="text">
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    color={confirmColor}
                    variant={confirmVariant}
                    disableElevation
                    disabled={isLoading}
                    startIcon={isLoading ? <Spinner size="sm" color="inherit" /> : undefined}
                >
                    {confirmText}
                </Button>
            </Box>
        </Modal>
    );
};

export default ConfirmDialog;
