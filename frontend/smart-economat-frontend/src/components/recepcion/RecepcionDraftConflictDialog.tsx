import React from 'react';
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
  return (
    <Dialog open={open} maxWidth="sm" fullWidth>
      <DialogTitle>Conflicto de borrador detectado</DialogTitle>
      <DialogContent>
        <Typography sx={{ mb: 2 }}>
          Este formulario fue actualizado desde otro dispositivo o pestaña.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Última versión del servidor:{' '}
          {remoteDraft?.updatedAt
            ? new Date(remoteDraft.updatedAt).toLocaleString('es-ES')
            : 'desconocida'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Puedes cargar el borrador remoto o sobrescribirlo con tu versión
          local.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onUseRemote}>Usar versión remota</Button>
        <Button
          variant="contained"
          color="warning"
          onClick={() => void onKeepLocal()}
        >
          Sobrescribir con mi versión
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default RecepcionDraftConflictDialog;
