import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { RecepcionDraftEnvelope } from '../../services/recepcion.types';

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
      <DialogTitle>{t('recepcionConflict.title')}</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          {t('recepcionConflict.description')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('recepcionConflict.serverVersion')}{' '}
          {remoteDraft?.updatedAt
            ? new Date(remoteDraft.updatedAt).toLocaleString('es-ES')
            : t('recepcionConflict.unknown')}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {t('recepcionConflict.hint')}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onUseRemote}>
          {t('recepcionConflict.useRemote')}
        </Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => void onKeepLocal()}
        >
          {t('recepcionConflict.overwrite')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecepcionDraftConflictDialog;
