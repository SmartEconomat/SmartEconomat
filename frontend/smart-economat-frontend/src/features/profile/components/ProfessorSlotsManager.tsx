import React from 'react';
import {
  Box,
  Typography,
  Divider,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import { AlumnoSlot } from '../../../services/profesor.service';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface ProfessorSlotsManagerProps {
  isEditing: boolean;
  slots: AlumnoSlot[];
  isLoading: boolean;
  isSaving: boolean;
  newSlot: { aula: string; numeroClase: string; capacidad: string };
  onNewSlotChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateSlot: (e: React.FormEvent) => void;
  onDeleteSlot: (id: string) => void;
}

/**
 * Sección de Gestión de Aulas para la Ficha de Perfil.
 */
const ProfessorSlotsManager: React.FC<ProfessorSlotsManagerProps> = ({
  isEditing,
  slots,
  isLoading,
  isSaving,
  newSlot,
  onNewSlotChange,
  onCreateSlot,
  onDeleteSlot,
}) => {
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={{ xs: 2, md: 3 }}>
        <MeetingRoomIcon color="primary" sx={{ fontSize: { xs: 28, md: 32 }, mr: 1.5 }} />
        <Typography variant="h5" fontWeight={600} sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}>
          Gestión de Aulas y Clases
        </Typography>
      </Box>
      <Divider sx={{ mb: { xs: 3, md: 4 } }} />

      {/* Formulario para añadir nuevo slot (SOLO EN MODO EDICION) */}
      {isEditing && (
        <Box component="form" onSubmit={onCreateSlot} sx={{ mb: 4, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Crear nueva ubicación disponible:
          </Typography>
          <Box display="flex" gap={2} alignItems="flex-start" flexDirection={{ xs: 'column', md: 'row' }}>
            <Box flex={1} width="100%">
              <Input
                label="Aula (ej: A01)"
                name="aula"
                value={newSlot.aula}
                onChange={onNewSlotChange}
                required
                disabled={isSaving}
              />
            </Box>
            <Box flex={1} width="100%">
              <Input
                label="Nº Clase (ej: 1)"
                name="numeroClase"
                type="number"
                value={newSlot.numeroClase}
                onChange={onNewSlotChange}
                required
                disabled={isSaving}
              />
            </Box>
            <Box flex={1} width="100%">
              <Input
                label="Capacidad (Alumnos)"
                name="capacidad"
                type="number"
                value={newSlot.capacidad}
                onChange={onNewSlotChange}
                required
                disabled={isSaving}
              />
            </Box>
            <Button
              type="submit"
              variant="contained"
              isLoading={isSaving}
              sx={{ py: 1.5, mt: { md: 0.5 }, minWidth: 120, width: { xs: '100%', md: 'auto' } }}
              startIcon={<AddCircleOutlineIcon />}
            >
              Añadir
            </Button>
          </Box>
        </Box>
      )}

      <Typography variant="h6" gutterBottom sx={{ fontSize: '1rem', fontWeight: 600 }}>
        Mis Aulas Configuradas
      </Typography>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress size={24} />
        </Box>
      ) : slots.length === 0 ? (
        <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3, fontStyle: 'italic' }}>
          No has configurado ninguna clase todavía.
        </Typography>
      ) : (
        <List sx={{ pt: 0, bgcolor: 'background.paper', borderRadius: 1 }}>
          {slots.map((slot) => (
            <ListItem
              key={slot.id}
              divider
              secondaryAction={
                <Box display="flex" alignItems="center" gap={1}>
                  {/* Badge del Código de Registro */}
                  <Box 
                    sx={{ 
                      bgcolor: 'primary.light', 
                      color: 'primary.contrastText',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1.5,
                      fontWeight: 700,
                      fontSize: '0.75rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      boxShadow: 1,
                      cursor: 'pointer',
                      '&:hover': { bgcolor: 'primary.main' }
                    }}
                    title="Haga clic para copiar el código"
                    onClick={() => {
                        if (slot.codigoSlot) {
                            navigator.clipboard.writeText(slot.codigoSlot);
                            // Aquí se podría disparar un toast pequeño si fuera necesario
                        }
                    }}
                  >
                    CÓDIGO: {slot.codigoSlot || 'PENDIENTE'}
                  </Box>

                  {isEditing && (
                    <IconButton edge="end" aria-label="delete" onClick={() => onDeleteSlot(slot.id)} color="error" size="small">
                      <DeleteOutlineIcon />
                    </IconButton>
                  )}
                </Box>
              }
              sx={{ px: { xs: 1, sm: 2 }, py: 1.5 }}
            >
              <ListItemText
                primary={`Aula: ${slot.aula} — Clase ${slot.numeroClase}`}
                secondary={`Capacidad máx: ${slot.capacidad} alumnos`}
                primaryTypographyProps={{ 
                  fontWeight: 600,
                  variant: 'body2',
                  sx: { fontSize: { xs: '0.9rem', sm: '1rem' } } 
                }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export default ProfessorSlotsManager;
