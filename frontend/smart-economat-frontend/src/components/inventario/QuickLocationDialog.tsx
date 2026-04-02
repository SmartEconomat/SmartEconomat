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
  const [nombre, setNombre] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const trimmedNombre = nombre.trim();
    if (!trimmedNombre) {
      toast.error('El nombre de la ubicación es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      const newLoc = await UbicacionService.create({ nombre: trimmedNombre });
      toast.success('Ubicación creada con éxito');
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
        toast.error('Ya existe una ubicación con este nombre');
      } else {
        toast.error('Error al crear la ubicación');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Nueva Ubicación de Almacén</DialogTitle>
      <form onSubmit={handleSave}>
        <DialogContent dividers>
          <Box sx={{ pt: 1 }}>
            <TextField
              autoFocus
              fullWidth
              label="Nombre de la Ubicación"
              placeholder="Ej: Estantería A, Almacén Central..."
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              disabled={isSaving}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={isSaving}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isSaving || !nombre.trim()}
            startIcon={isSaving ? <CircularProgress size={20} /> : null}
          >
            Guardar
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default QuickLocationDialog;
