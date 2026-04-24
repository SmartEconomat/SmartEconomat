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
import { useTranslation } from 'react-i18next';

interface WeightScaleModalProps {
  open: boolean;
  isWeighing: boolean;
  capturedWeight: number | null;
  statusText?: string;
  onClose: () => void;
  onStartWeighing: () => void;
  onConfirmWeight: () => void;
  productName?: string;
}

const WeightScaleModal: React.FC<WeightScaleModalProps> = ({
  open,
  isWeighing,
  capturedWeight,
  statusText,
  onClose,
  onStartWeighing,
  onConfirmWeight,
  productName,
}) => {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, textAlign: 'center', py: 2 } }}
    >
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {t('recepcion.bascula.titulo')}
      </DialogTitle>
      {productName && (
        <Typography variant="subtitle2" color="primary" sx={{ px: 3, mt: -1 }}>
          {t('recepcion.bascula.pesando')}: {productName}
        </Typography>
      )}
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
              {statusText || t('recepcion.bascula.comunicando')}
            </Typography>
          </Box>
        ) : (
          <Box
            sx={{
              bgcolor: 'background.default',
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
        {!isWeighing && statusText && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            {statusText}
          </Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', px: 3, pb: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isWeighing}>
          {t('comun.cancelar')}
        </Button>
        <Button
          onClick={onStartWeighing}
          variant="outlined"
          color="secondary"
          disabled={isWeighing}
        >
          {t('recepcion.bascula.recalcular')}
        </Button>
        <Button
          onClick={onConfirmWeight}
          variant="contained"
          color="success"
          disabled={isWeighing || capturedWeight === null}
        >
          {t('recepcion.bascula.confirmarPeso')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default WeightScaleModal;
