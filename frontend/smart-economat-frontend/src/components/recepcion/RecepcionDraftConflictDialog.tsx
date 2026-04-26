import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { RecepcionDraftEnvelope } from '../../services/recepcion.types';
import { formatLocalizedDateTime } from '../../utils/intlFormat';

interface RecepcionDraftConflictDialogProps {
  open: boolean;
  remoteDraft?: RecepcionDraftEnvelope | null;
  onKeepLocal: () => void | Promise<void>;
  onUseRemote: () => void;
}

const RecepcionDraftConflictDialog: React.FC<
  RecepcionDraftConflictDialogProps
> = ({ open, remoteDraft, onKeepLocal, onUseRemote }) => {
  const { t } = useTranslation();

  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>{t('recepcion.conflicto.titulo')}</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          {t('recepcion.conflicto.descripcion')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('recepcion.conflicto.ultimaVersion')}{' '}
          {remoteDraft?.updatedAt
            ? formatLocalizedDateTime(remoteDraft.updatedAt)
            : t('recepcion.conflicto.desconocida')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('recepcion.conflicto.instruccion')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onUseRemote}>
          {t('recepcion.conflicto.usarRemota')}
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => void onKeepLocal()}
        >
          {t('recepcion.conflicto.sobrescribir')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecepcionDraftConflictDialog;
