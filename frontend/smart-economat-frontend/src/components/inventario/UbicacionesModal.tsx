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
import { useToast } from '../../store/ToastContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onChanged: () => void; // Triggered whenever a location is added/removed
}

const UbicacionesModal: React.FC<Props> = ({ open, onClose, onChanged }) => {
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [newNombre, setNewNombre] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const loadUbicaciones = async () => {
    setLoading(true);
    try {
      const data = await UbicacionService.findAll();
      setUbicaciones(Array.isArray(data) ? data : []);
    } catch (err: any) {
      toast.error(err.message || 'Error al cargar ubicaciones');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      loadUbicaciones();
    }
  }, [open]);

  const handleAdd = async () => {
    if (!newNombre.trim()) return;
    try {
      await UbicacionService.create({ nombre: newNombre.trim() });
      setNewNombre('');
      toast.success('Ubicación añadida');
      onChanged();
      loadUbicaciones();
    } catch (err: any) {
      toast.error(err.message || 'Error al crear ubicación');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await UbicacionService.remove(id);
      toast.success('Ubicación eliminada');
      onChanged();
      loadUbicaciones();
    } catch (err: any) {
      toast.error(err.message || 'Error al eliminar ubicación');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Gestionar Ubicaciones</DialogTitle>
      <DialogContent dividers>
        <Box display="flex" gap={1} mb={3}>
          <TextField
            label="Nueva ubicación"
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
            Añadir
          </Button>
        </Box>

        {loading ? (
          <Typography>Cargando...</Typography>
        ) : ubicaciones.length === 0 ? (
          <Typography color="text.secondary">
            No hay ubicaciones registradas.
          </Typography>
        ) : (
          <List>
            {ubicaciones.map((u) => (
              <ListItem
                key={u.id}
                secondaryAction={
                  <IconButton
                    edge="end"
                    aria-label="delete"
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
        <Button onClick={onClose}>Cerrar</Button>
      </DialogActions>
    </Dialog>
  );
};

export default UbicacionesModal;
