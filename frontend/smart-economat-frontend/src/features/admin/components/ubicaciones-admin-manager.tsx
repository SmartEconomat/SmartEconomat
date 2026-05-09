import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Stack,
  Tooltip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import {
  UbicacionService,
  invalidateUbicacionesCache,
} from '../../../services/ubicacion.service';
import type {
  Ubicacion,
  CreateUbicacionDto,
} from '../../../services/ubicacion.types';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../store/toast.hooks';

/**
 * CRUD de ubicaciones operativas (cocina, cámara, aula, almacén físico como tipo de ubicación).
 */
const UbicacionesAdminManager: React.FC = () => {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUbicacion, setEditingUbicacion] = useState<Ubicacion | null>(
    null
  );
  const [formData, setFormData] = useState<CreateUbicacionDto>({
    nombre: '',
    descripcion: '',
  });

  const toast = useToast();

  const loadUbicaciones = useCallback(async () => {
    setIsLoading(true);
    try {
      invalidateUbicacionesCache();
      const data = await UbicacionService.findAll({ forceRefresh: true });
      setUbicaciones(data);
    } catch {
      toast.error('Error al cargar ubicaciones');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadUbicaciones();
  }, [loadUbicaciones]);

  const handleOpenCreate = () => {
    setEditingUbicacion(null);
    setFormData({ nombre: '', descripcion: '' });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ubicacion: Ubicacion) => {
    setEditingUbicacion(ubicacion);
    setFormData({
      nombre: ubicacion.nombre,
      descripcion: ubicacion.descripcion || '',
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSave = async () => {
    if (!formData.nombre.trim()) {
      toast.error('El nombre es obligatorio');
      return;
    }

    setIsSaving(true);
    try {
      if (editingUbicacion) {
        await UbicacionService.update(editingUbicacion.id, formData);
        toast.success('Ubicación actualizada correctamente');
      } else {
        await UbicacionService.create(formData);
        toast.success('Ubicación creada correctamente');
      }
      handleCloseModal();
      await loadUbicaciones();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al guardar la ubicación';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !window.confirm(
        '¿Eliminar esta ubicación? No podrás hacerlo si tiene inventario u operaciones vinculadas.'
      )
    ) {
      return;
    }

    try {
      await UbicacionService.remove(id);
      toast.success('Ubicación eliminada correctamente');
      await loadUbicaciones();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : 'Error al eliminar la ubicación';
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h6" component="h2" fontWeight={600}>
          Gestión de ubicaciones
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          sx={{ mt: 0, mb: 0, py: 1, px: 2.5, width: 'auto', minWidth: 180 }}
        >
          Nueva ubicación
        </Button>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}
      >
        <Table>
          <TableHead sx={{ bgcolor: 'action.hover' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 600 }}>Descripción</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>
                Acciones
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {ubicaciones.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                  No hay ubicaciones registradas.
                </TableCell>
              </TableRow>
            ) : (
              ubicaciones.map((ubicacion) => (
                <TableRow key={ubicacion.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>
                    {ubicacion.nombre}
                  </TableCell>
                  <TableCell sx={{ color: 'text.secondary' }}>
                    {ubicacion.descripcion || '-'}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar ubicación">
                      <IconButton
                        onClick={() => handleOpenEdit(ubicacion)}
                        size="small"
                        color="primary"
                        aria-label="Editar ubicación"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Eliminar ubicación">
                      <IconButton
                        onClick={() => handleDelete(ubicacion.id)}
                        size="small"
                        color="error"
                        aria-label="Eliminar ubicación"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={isModalOpen}
        onClose={handleCloseModal}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingUbicacion ? 'Editar ubicación' : 'Nueva ubicación'}
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3} sx={{ mt: 1 }}>
            <TextField
              label="Nombre"
              fullWidth
              required
              inputProps={{ 'aria-label': 'Nombre de la ubicación' }}
              value={formData.nombre}
              onChange={(e) =>
                setFormData({ ...formData, nombre: e.target.value })
              }
            />
            <TextField
              label="Descripción"
              fullWidth
              multiline
              rows={3}
              inputProps={{ 'aria-label': 'Descripción de la ubicación' }}
              value={formData.descripcion}
              onChange={(e) =>
                setFormData({ ...formData, descripcion: e.target.value })
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={handleCloseModal}
            startIcon={<CancelIcon />}
          >
            Cancelar
          </Button>
          <Button
            onClick={() => void handleSave()}
            isLoading={isSaving}
            startIcon={<SaveIcon />}
          >
            Guardar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UbicacionesAdminManager;
