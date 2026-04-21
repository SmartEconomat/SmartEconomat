import React, { ReactNode } from 'react';
import { Button, Box, Typography } from '@mui/material';
import Modal from './Modal';
import Spinner from './Spinner';
import { useTranslation } from 'react-i18next';

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
  cancelColor?: ButtonColor;
  cancelVariant?: 'contained' | 'outlined' | 'text';
  onCancel?: () => void;
  confirmColor?: ButtonColor;
  confirmVariant?: 'contained' | 'outlined' | 'text';
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText,
  cancelText,
  cancelColor = 'inherit',
  cancelVariant = 'text',
  onCancel,
  confirmColor = 'error',
  confirmVariant = 'contained',
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const actualTitle = title || t('common.confirmAction');
  const actualConfirmText = confirmText || t('common.confirm');
  const actualCancelText = cancelText || t('common.cancel');

  const handleCancel = () => {
    (onCancel || onClose)();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={actualTitle} size="sm">
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
        {actualCancelText && (
          <Button
            onClick={handleCancel}
            color={cancelColor}
            variant={cancelVariant}
          >
            {actualCancelText}
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          color={confirmColor}
          variant={confirmVariant}
          disableElevation
          disabled={isLoading}
          startIcon={
            isLoading ? <Spinner size="sm" color="inherit" /> : undefined
          }
        >
          {actualConfirmText}
        </Button>
      </Box>
    </Modal>
  );
};

export default ConfirmDialog;
