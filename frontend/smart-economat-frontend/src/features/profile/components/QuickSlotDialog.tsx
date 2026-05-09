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
import { useToast } from '../../../store/toast.hooks';
import { useAuth } from '../../../store/auth.hooks';
import { normalizeNumericInput } from '../../../utils/numberUtils';

interface QuickSlotDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (newSlot: AlumnoSlot) => void;
  profesores: ProfesorInfo[];
}

const QuickSlotDialog: React.FC<QuickSlotDialogProps> = ({
  open,
  onClose,
  onSuccess,
  profesores,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const [formData, setFormData] = useState({
    aula: '',
    numeroClase: '1',
    capacidad: '30',
    profesorId: '',
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
      toast.error(t('perfil.slot.errors.camposObligatorios'));
      return;
    }

    setIsSaving(true);
    try {
      const res = await profesorService.adminCreateSlot({
        aula: formData.aula.trim(),
        numeroClase: Number(formData.numeroClase),
        capacidad: Number(formData.capacidad),
        profesorId: formData.profesorId,
      });

      if (res.success) {
        toast.success(t('perfil.slot.toast.creado'));
        onSuccess(res.data);
        onClose();
        setFormData({
          aula: '',
          numeroClase: '1',
          capacidad: '30',
          profesorId: '',
        });
      } else {
        toast.error(res.message || t('perfil.slot.errors.crear'));
      }
    } catch (error) {
      console.error('Error creating slot', error);
      toast.error(t('perfil.slot.errors.crearAcademico'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('perfil.slot.titulo')}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ pt: 1 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                label={t('perfil.nombreAulaGrupo')}
                name="aula"
                placeholder={t('perfil.aulaPlaceholder')}
                value={formData.aula}
                onChange={handleChange}
                required
                disabled={isSaving}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label={t('perfil.campoNumeroClase')}
                name="numeroClase"
                type="text"
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                }}
                value={formData.numeroClase}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    numeroClase: normalizeNumericInput(e.target.value),
                  }));
                }}
                required
                disabled={isSaving}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <TextField
                fullWidth
                label={t('perfil.capacidadAlumnos')}
                name="capacidad"
                type="text"
                inputProps={{
                  inputMode: 'numeric',
                  pattern: '[0-9]*',
                }}
                value={formData.capacidad}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    capacidad: normalizeNumericInput(e.target.value),
                  }));
                }}
                required
                disabled={isSaving}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <FormControl fullWidth required>
                <InputLabel id="quick-slot-profesor-label">
                  {t('perfil.profesorResponsable')}
                </InputLabel>
                <Select
                  labelId="quick-slot-profesor-label"
                  label={t('perfil.profesorResponsable')}
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
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          {t('comun.cancelar')}
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving}
          startIcon={isSaving ? <CircularProgress size={20} /> : null}
        >
          {t('perfil.slot.crearAula')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuickSlotDialog;
