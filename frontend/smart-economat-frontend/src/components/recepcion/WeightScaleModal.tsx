import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  CircularProgress,
  Typography,
  Button,
} from '@mui/material';

interface WeightScaleModalProps {
  open: boolean;
  isWeighing: boolean;
  capturedWeight: number | null;
  onClose: () => void;
  onStartWeighing: () => void;
  onConfirmWeight: () => void;
}

const WeightScaleModal: React.FC<WeightScaleModalProps> = ({
  open,
  isWeighing,
  capturedWeight,
  onClose,
  onStartWeighing,
  onConfirmWeight,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, textAlign: 'center', py: 2 } }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        Báscula de Recepción
      </DialogTitle>
      <DialogContent
        sx={{
          minHeight: 150,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {isWeighing ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
            }}
          >
            <CircularProgress size={50} color="primary" />
            <Typography variant="h6" color="text.secondary">
              Comunicando con la báscula...
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: '#000',
              color: '#0f0',
              fontFamily: 'monospace',
              px: 4,
              py: 2,
              borderRadius: 2,
              border: '4px solid #333',
              boxShadow: 'inset 0 0 10px #0f0',
            }}
          >
            <Typography
              variant="h2"
              sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
            >
              {capturedWeight !== null ? capturedWeight.toFixed(2) : '0.00'}
            </Typography>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isWeighing}>
          Cancelar
        </Button>
        <Button
          onClick={onStartWeighing}
          variant="outlined"
          color="secondary"
          disabled={isWeighing}
        >
          Recalcular
        </Button>
        <Button
          onClick={onConfirmWeight}
          variant="contained"
          color="success"
          disabled={isWeighing || capturedWeight === null}
        >
          Confirmar Peso
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WeightScaleModal;
