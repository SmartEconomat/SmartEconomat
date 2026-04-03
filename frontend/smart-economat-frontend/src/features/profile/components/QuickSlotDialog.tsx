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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  profesorService,
  ProfesorInfo,
  AlumnoSlot,
} from '../../../services/profesor.service';
import type { Ubicacion } from '../../../services/ubicacion.types';
import { useToast } from '../../../store/toast.hooks';
import { useAuth } from '../../../store/auth.hooks';

interface QuickSlotDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newSlot: AlumnoSlot) => void;
  profesores: ProfesorInfo[];
  ubicaciones: Ubicacion[];
}

const QuickSlotDialog: React.FC<QuickSlotDialogProps> = ({
  open,
  onClose,
  onSuccess,
  profesores,
  ubicaciones,
}) => {
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    aula: '',
    numeroClase: '1',
    capacidad: '30',
    profesorId: '',
    ubicacionId: '',
  });

  // Intentar pre-seleccionar el profesor si el usuario actual es uno
  React.useEffect(() => {
    if (open && !formData.profesorId && profesores.length > 0) {
      const myProfile = profesores.find((p) => p.userId === user?.id);
      if (myProfile) {
        setFormData((prev) => ({ ...prev, profesorId: myProfile.id }));
      }
    }
  }, [open, profesores, user?.id, formData.profesorId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async () => {
    if (
      !formData.aula.trim() ||
      !formData.numeroClase ||
      !formData.capacidad ||
      !formData.profesorId
    ) {
      toast.error('Todos los campos marcados son obligatorios');
      return;
    }

    setIsSaving(true);
    try {
      const res = await profesorService.adminCreateSlot({
        aula: formData.aula.trim(),
        numeroClase: Number(formData.numeroClase),
        capacidad: Number(formData.capacidad),
        profesorId: formData.profesorId,
        ubicacionId: formData.ubicacionId || undefined,
      });

      if (res.success) {
        toast.success('Aula/Slot creado con éxito');
        onSuccess(res.data);
        onClose();
        setFormData({
          aula: '',
          numeroClase: '1',
          capacidad: '30',
          profesorId: '',
          ubicacionId: '',
        });
      } else {
        toast.error(res.message || 'Error al crear el slot');
      }
    } catch (error) {
      console.error('Error creating slot', error);
      toast.error('Error al crear el slot académico');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Nueva Aula / Clase (Slot)</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label="Nombre del Aula/Grupo"
                name="aula"
                placeholder="Ej: Cocina Básica, Aula 101..."
                value={formData.aula}
                onChange={handleChange}
                required
                disabled={isSaving}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Nº Clase"
                name="numeroClase"
                type="number"
                value={formData.numeroClase}
                onChange={handleChange}
                required
                disabled={isSaving}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label="Capacidad (Alumnos)"
                name="capacidad"
                type="number"
                value={formData.capacidad}
                onChange={handleChange}
                required
                disabled={isSaving}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel id="quick-slot-profesor-label">
                  Profesor Responsable
                </InputLabel>
                <Select
                  labelId="quick-slot-profesor-label"
                  label="Profesor Responsable"
                  name="profesorId"
                  value={formData.profesorId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      profesorId: e.target.value as string,
                    }))
                  }
                  disabled={isSaving}
                >
                  {profesores.map((p) => (
                    <MenuItem key={p.id} value={p.id}>
                      {p.nombre || p.username || p.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth>
                <InputLabel id="quick-slot-ubicacion-label">
                  Ubicación Warehouse (Opcional)
                </InputLabel>
                <Select
                  labelId="quick-slot-ubicacion-label"
                  label="Ubicación Warehouse (Opcional)"
                  name="ubicacionId"
                  value={formData.ubicacionId}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      ubicacionId: e.target.value as string,
                    }))
                  }
                  disabled={isSaving}
                >
                  <MenuItem value="">
                    <em>Sin ubicación física</em>
                  </MenuItem>
                  {ubicaciones.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nombre}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          Crear Aula
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickSlotDialog;
