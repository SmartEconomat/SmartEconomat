import React, { ReactNode } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
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

/**
 * Documentación en español.
 */
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

/**
 * Documentación en español.
 */
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
  const resolvedTitle = title ?? t('confirmDialog.title');
  const resolvedConfirmText = confirmText ?? t('confirmDialog.confirm');
  const resolvedCancelText = cancelText ?? t('confirmDialog.cancel');

  const handleCancel = () => {
    (onCancel || onClose)();
  };

  const handleConfirm = () => {
    onConfirm();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={resolvedTitle} size="sm">
      <Box sx={{ pb: 3 }}>
        {typeof message === 'string' ? (
          <Typography variant="body1" color="text.secondary">
            {message}
          </Typography>
        ) : (
          message
        )}
      </Box>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {resolvedCancelText && (
          <Button
            onClick={handleCancel}
            color={cancelColor}
            variant={cancelVariant}
          >
            {resolvedCancelText}
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
          {resolvedConfirmText}
        </Button>
      </Box>
    </Modal>
  );
};

export default ConfirmDialog;
