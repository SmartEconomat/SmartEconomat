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
  title = 'Confirmar acción',
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  cancelColor = 'inherit',
  cancelVariant = 'text',
  onCancel,
  confirmColor = 'error',
  confirmVariant = 'contained',
  isLoading = false,
}) => {
  const handleCancel = () => {
    (onCancel || onClose)();
  };

  const handleConfirm = () => {
    onConfirm();
  };

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

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        {cancelText && (
          <Button
            onClick={handleCancel}
            color={cancelColor}
            variant={cancelVariant}
          >
            {cancelText}
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
          {confirmText}
        </Button>
      </Box>
    </Modal>
  );
};

export default ConfirmDialog;
