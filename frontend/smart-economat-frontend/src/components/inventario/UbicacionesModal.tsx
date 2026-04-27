import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Box,
  Typography,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { UbicacionService } from '../../services/ubicacion.service';
import type { Ubicacion } from '../../services/ubicacion.types';
import { useToast } from '../../store/toast.hooks';
import { useTranslation } from 'react-i18next';

/**
 * Documentación en español.
 */
interface Props {
  open: boolean;
  onClose: () => void;
  /**
   * Documentación en español.
   */
  onChanged: () => void;
}

/**
 * Documentación en español.
 */
const UbicacionesModal: React.FC<Props> = ({ open, onClose, onChanged }) => {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [newNombre, setNewNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { t } = useTranslation();

  /**
   * Documentación en español.
   */
  const loadUbicaciones = async () => {
    setLoading(true);
    try {
      const data = await UbicacionService.findAll();
      setUbicaciones(Array.isArray(data) ? data : []);
    } catch (err) {
      const error = err as Error;
      toast.error(
        error.message || t('inventario.toast.errorCargarUbicaciones')
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadUbicaciones();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /**
   * Documentación en español.
   */
  const handleAdd = async () => {
    if (!newNombre.trim()) return;
    try {
      await UbicacionService.create({ nombre: newNombre.trim() });
      setNewNombre('');
      toast.success(t('inventario.ubicaciones.toast.creada'));
      onChanged();
      loadUbicaciones();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || t('inventario.ubicaciones.errors.crear'));
    }
  };

  /**
   * Documentación en español.
   */
  const handleDelete = async (id: string) => {
    try {
      await UbicacionService.remove(id);
      toast.success(t('inventario.ubicaciones.toast.eliminada'));
      onChanged();
      loadUbicaciones();
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || t('inventario.ubicaciones.errors.eliminar'));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t('inventario.ubicaciones.titulo')}</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" gap={1} mb={3}>
          <TextField
            label={t('inventario.ubicaciones.nueva')}
            size="small"
            value={newNombre}
            onChange={(e) => setNewNombre(e.target.value)}
            fullWidth
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAdd();
              }
            }}
          />
          <Button
            variant="contained"
            onClick={handleAdd}
            disabled={!newNombre.trim()}
          >
            {t('comun.anadir')}
          </Button>
        </Box>

        {loading ? (
          <Typography>{t('comun.cargando')}</Typography>
        ) : ubicaciones.length === 0 ? (
          <Typography color="text.secondary">
            {t('inventario.ubicaciones.sinUbicaciones')}
          </Typography>
        ) : (
          <List>
            {ubicaciones.map((u) => (
              <ListItem
                key={u.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label={t('comun.eliminar')}
                    onClick={() => handleDelete(u.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                }
                sx={{
                  border: 1,
                  borderColor: 'divider',
                  mb: 1,
                  borderRadius: 1,
                }}
              >
                <ListItemText primary={u.nombre} secondary={u.descripcion} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('comun.cerrar')}</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UbicacionesModal;
