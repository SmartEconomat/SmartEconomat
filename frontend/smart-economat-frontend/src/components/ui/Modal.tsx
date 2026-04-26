import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalCloseReason =
  | 'backdropClick'
  | 'escapeKeyDown'
  | 'closeButton'
  | 'cancelAction';

export interface ModalProps {
  isOpen: boolean;
  onClose: (reason?: ModalCloseReason) => void;
  title?: string | React.ReactNode;
  size?: ModalSize;
  children: React.ReactNode;
}

/**
 * Documentación en español.
 */
const sizeToPaperMaxWidth: Record<ModalSize, string> = {
  sm: '400px',
  md: '600px',
  lg: '900px',
  xl: '1200px',
  full: '100vw',
};

/**
 * Documentación en español.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
}: ModalProps) => {
  const { t } = useTranslation();
  return (
    <Dialog
      open={isOpen}
      onClose={(_, reason) => onClose(reason)}
      scroll="paper"
      closeAfterTransition
      fullScreen={size === 'full'}
      PaperProps={{
        sx: {
          width: '100%',
          maxWidth: sizeToPaperMaxWidth[size],
          maxHeight: size === 'full' ? '100vh' : '90vh',
          m: size === 'full' ? 0 : 2,
          bgcolor: 'background.paper',
          backgroundImage: 'none',
        },
      }}
      aria-labelledby={title ? 'modal-title' : undefined}
      transitionDuration={225}
    >
      {/* Header */}
      <DialogTitle
        id="modal-title"
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 56,
        }}
      >
        {title && (
          <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>
            {title}
          </Typography>
        )}
        <IconButton
          aria-label={t('comun.cerrarModal')}
          onClick={() => onClose('closeButton')}
          size="small"
          sx={{
            ml: 'auto',
            color: 'text.secondary',
            '&:hover': { color: 'text.primary', bgcolor: 'action.hover' },
          }}
        >
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      {/* Content */}
      <DialogContent sx={{ p: 3, overflowY: 'auto' }}>{children}</DialogContent>
    </Dialog>
  );
};

export default Modal;
