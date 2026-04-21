import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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

interface QuickLocationDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newLocation: Ubicacion) => void;
}

const QuickLocationDialog: React.FC<QuickLocationDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const [nombre, setNombre] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      toast.error(t('quickLocation.nameRequired'));
      return;
    }

    setIsSaving(true);
    try {
      const newLoc = await UbicacionService.create({ nombre: trimmedNombre });
      toast.success(t('quickLocation.createSuccess'));
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
        toast.error(t('quickLocation.duplicateError'));
      } else {
        toast.error(t('quickLocation.createError'));
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{t('quickLocation.title')}</DialogTitle>
      <form onSubmit={handleSave}>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label={t('quickLocation.nameLabel')}
              placeholder={t('quickLocation.namePlaceholder')}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isSaving}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>
            {t('quickLocation.cancel')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving || !nombre.trim()}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            {t('quickLocation.save')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default QuickLocationDialog;
