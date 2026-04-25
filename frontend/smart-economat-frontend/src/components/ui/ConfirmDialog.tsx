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
 * Props for the {@link ConfirmDialog} component.
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
 * Two-button confirmation dialog (cancel + confirm).
 *
 * Renders a small `Modal` with a title, a message body (string or arbitrary
 * JSX), and two action buttons whose text, colour, and variant are fully
 * configurable. Shows an inline `Spinner` on the confirm button while
 * `isLoading` is `true`.
 *
 * @param props - See {@link ConfirmDialogProps}.
 * @returns A modal confirmation dialog.
 * @example
 * <ConfirmDialog
 *   isOpen={showDelete}
 *   onClose={() => setShowDelete(false)}
 *   onConfirm={handleDelete}
 *   title="Eliminar registro"
 *   message="Esta acción no se puede deshacer."
 *   confirmText="Eliminar"
 * />
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
