import React from 'react';
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

// Mapeamos nuestro ModalSize a los maxWidth de Dialog de MUI
const sizeToPaperMaxWidth: Record<ModalSize, string> = {
  sm: '400px',
  md: '600px',
  lg: '900px',
  xl: '1200px',
  full: '100vw',
};

const Modal = ({
  isOpen,
  onClose,
  title,
  size = 'md',
  children,
}: ModalProps) => {
  return (
    <Dialog
      open={isOpen}
      onClose={(_, reason) => onClose(reason)}
      // Dialog de MUI gestiona el focus trap ANTES de aplicar
      // aria-hidden al resto del DOM, evitando el warning de accesibilidad.
      scroll="paper"
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
      // Transición suave
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
          aria-label="Cerrar modal"
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
