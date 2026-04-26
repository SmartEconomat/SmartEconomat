import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  CircularProgress,
} from '@mui/material';
import { UbicacionService } from '../../services/ubicacion.service';
import type { Ubicacion } from '../../services/ubicacion.types';
import { useToast } from '../../store/toast.hooks';
import { useTranslation } from 'react-i18next';

/**
 * Documentación en español.
 */
interface QuickLocationDialogProps {
  open: boolean;
  onClose: () => void;
        /**
     * Documentación en español.
     */
  onSuccess: (newLocation: Ubicacion) => void;
}

/**
 * Documentación en español.
 */
const QuickLocationDialog: React.FC<QuickLocationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const [nombre, setNombre] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const { t } = useTranslation();

        /**
     * Documentación en español.
     */
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      toast.error(t('inventario.nuevaUbicacion.nombreObligatorio'));
      return;
    }

    setIsSaving(true);
    try {
      const newLoc = await UbicacionService.create({ nombre: trimmedNombre });
      toast.success(t('inventario.nuevaUbicacion.creada'));
      onSuccess(newLoc);
      setNombre('');
      onClose();
    } catch (error: unknown) {
      console.error('Error creating location', error);
      const msg = error instanceof Error ? error.message : '';
      if (
        msg.includes('ya existe') ||
        msg.includes('already exists') ||
        msg.includes('400')
      ) {
        toast.error(t('inventario.nuevaUbicacion.yaExiste'));
      } else {
        toast.error(t('inventario.nuevaUbicacion.error'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('inventario.nuevaUbicacion.titulo')}</DialogTitle>
      <form onSubmit={handleSave}>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label={t('inventario.nuevaUbicacion.nombre')}
              placeholder={t('inventario.nuevaUbicacion.placeholder')}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isSaving}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>
            {t('comun.cancelar')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving || !nombre.trim()}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {t('comun.guardar')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default QuickLocationDialog;
