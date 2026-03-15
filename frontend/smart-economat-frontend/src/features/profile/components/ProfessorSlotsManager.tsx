import React from 'react';
import {
  Box,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TablePagination,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
} from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import { AlumnoSlot, ProfesorInfo } from '../../../services/profesor.service';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface ProfessorSlotsManagerProps {
  isEditing: boolean;
  slots: AlumnoSlot[];
  allSlots?: AlumnoSlot[];
  allProfesores?: ProfesorInfo[];
  isLoading: boolean;
  isSaving: boolean;
  newSlot: { aula: string; numeroClase: string; capacidad: string };
  onNewSlotChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateSlot: (e: React.FormEvent) => void;
  onDeleteSlot: (id: string) => void;
  onUpdateSlot: (
    id: string,
    data: Partial<Omit<AlumnoSlot, 'id' | 'codigoSlot'>>
  ) => Promise<void>;
  onAdminUpdateSlot?: (
    id: string,
    data: Partial<Omit<AlumnoSlot, 'id' | 'codigoSlot'>> & {
      profesorId?: string;
    }
  ) => Promise<void>;
}

const ProfessorSlotsManager: React.FC<ProfessorSlotsManagerProps> = ({
  isEditing,
  slots,
  allSlots = [],
  allProfesores = [],
  isLoading,
  isSaving,
  newSlot,
  onNewSlotChange,
  onCreateSlot,
  onDeleteSlot,
  onUpdateSlot,
  onAdminUpdateSlot,
}) => {
  const [editingSlotId, setEditingSlotId] = React.useState<string | null>(null);
  const [editData, setEditData] = React.useState({
    aula: '',
    numeroClase: '',
    capacidad: '',
    profesorId: '',
  });

  // Paginación "Mis Aulas"
  const [myPage, setMyPage] = React.useState(0);
  const [myRowsPerPage, setMyRowsPerPage] = React.useState(5);

  // Paginación "Todas las Aulas"
  const [allPage, setAllPage] = React.useState(0);
  const [allRowsPerPage, setAllRowsPerPage] = React.useState(10);

  const handleStartEdit = (slot: AlumnoSlot, isAdminView = false) => {
    setEditingSlotId(slot.id);
    setEditData({
      aula: slot.aula,
      numeroClase: String(slot.numeroClase),
      capacidad: String(slot.capacidad),
      profesorId: isAdminView ? (slot.profesor?.id ?? '') : '',
    });
  };

  const handleCancelEdit = () => {
    setEditingSlotId(null);
  };

  const handleSaveEdit = async (id: string, isAdminView = false) => {
    if (isAdminView && onAdminUpdateSlot) {
      await onAdminUpdateSlot(id, {
        aula: editData.aula,
        numeroClase: Number(editData.numeroClase),
        capacidad: Number(editData.capacidad),
        profesorId: editData.profesorId || undefined,
      });
    } else {
      await onUpdateSlot(id, {
        aula: editData.aula,
        numeroClase: Number(editData.numeroClase),
        capacidad: Number(editData.capacidad),
      });
    }
    setEditingSlotId(null);
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const paginate = (items: AlumnoSlot[], page: number, rowsPerPage: number) =>
    items.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const renderSlotList = (
    items: AlumnoSlot[],
    showOwner: boolean,
    page: number,
    rowsPerPage: number,
    onPageChange: (newPage: number) => void,
    onRowsPerPageChange: (newRows: number) => void
  ) => {
    if (isLoading) {
      return (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress size={24} />
        </Box>
      );
    }

    if (items.length === 0) {
      return (
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ py: 3, fontStyle: 'italic' }}
        >
          No hay clases configuradas para mostrar.
        </Typography>
      );
    }

    const pageItems = paginate(items, page, rowsPerPage);

    return (
      <>
        <List sx={{ pt: 0, bgcolor: 'background.paper', borderRadius: 1 }}>
          {pageItems.map((slot) => {
            const isEditingThis = editingSlotId === slot.id;
            const ownerName =
              slot.profesor?.user?.nombre ||
              slot.profesor?.user?.username ||
              'Desconocido';

            return (
              <ListItem
                key={slot.id}
                divider
                secondaryAction={
                  <Box display="flex" alignItems="center" gap={1}>
                    {isEditingThis ? (
                      <>
                        <IconButton
                          edge="end"
                          aria-label="save"
                          onClick={() => handleSaveEdit(slot.id, showOwner)}
                          color="success"
                          size="small"
                          disabled={isSaving}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="cancel"
                          onClick={handleCancelEdit}
                          color="inherit"
                          size="small"
                          disabled={isSaving}
                        >
                          <CancelIcon />
                        </IconButton>
                      </>
                    ) : (
                      <>
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
                            '&:hover': { bgcolor: 'primary.main' },
                          }}
                          title="Haga clic para copiar el código de clase"
                          onClick={() => {
                            if (slot.codigoSlot) {
                              navigator.clipboard.writeText(slot.codigoSlot);
                            }
                          }}
                        >
                          CÓDIGO: {slot.codigoSlot || 'PENDIENTE'}
                        </Box>

                        <IconButton
                          edge="end"
                          aria-label="edit"
                          onClick={() => handleStartEdit(slot, showOwner)}
                          color="success"
                          size="small"
                          disabled={isSaving}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label="delete"
                          onClick={() => onDeleteSlot(slot.id)}
                          color="error"
                          size="small"
                          disabled={isSaving}
                        >
                          <DeleteOutlineIcon />
                        </IconButton>
                      </>
                    )}
                  </Box>
                }
                sx={{ px: { xs: 1, sm: 2 }, py: 1.5 }}
              >
                {isEditingThis ? (
                  <Box
                    display="flex"
                    gap={1.5}
                    alignItems="center"
                    width="calc(100% - 120px)"
                    flexWrap="wrap"
                  >
                    <TextField
                      label="Aula/Grupo"
                      name="aula"
                      size="small"
                      value={editData.aula}
                      onChange={handleEditChange}
                      disabled={isSaving}
                      sx={{ flex: '1 1 80px', minWidth: 80 }}
                    />
                    <TextField
                      label="Nº Clase"
                      name="numeroClase"
                      size="small"
                      type="number"
                      value={editData.numeroClase}
                      onChange={handleEditChange}
                      disabled={isSaving}
                      sx={{ flex: '1 1 70px', minWidth: 70 }}
                    />
                    <TextField
                      label="Capacidad"
                      name="capacidad"
                      size="small"
                      type="number"
                      value={editData.capacidad}
                      onChange={handleEditChange}
                      disabled={isSaving}
                      sx={{ flex: '1 1 80px', minWidth: 80 }}
                    />
                    {/* Selector de profesor: solo en vista admin (showOwner=true) */}
                    {showOwner && onAdminUpdateSlot && (
                      <FormControl
                        size="small"
                        sx={{ flex: '2 1 140px', minWidth: 140 }}
                      >
                        <InputLabel id={`profesor-select-${slot.id}`}>
                          Profesor
                        </InputLabel>
                        <Select
                          labelId={`profesor-select-${slot.id}`}
                          label="Profesor"
                          value={editData.profesorId}
                          onChange={(e) =>
                            setEditData((prev) => ({
                              ...prev,
                              profesorId: e.target.value as string,
                            }))
                          }
                          disabled={isSaving}
                        >
                          {allProfesores.map((p) => (
                            <MenuItem key={p.id} value={p.id}>
                              {p.nombre || p.username || p.email || p.id}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  </Box>
                ) : (
                  <ListItemText
                    primary={`Curso: ${slot.aula} — Clase ${slot.numeroClase}`}
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ display: 'block' }}
                        >
                          Capacidad máx: {slot.capacidad} alumnos
                        </Typography>
                        {showOwner && (
                          <Box
                            component="span"
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              mt: 0.5,
                              color: 'primary.main',
                            }}
                          >
                            <PersonIcon sx={{ fontSize: 14 }} />
                            <Typography
                              component="span"
                              variant="caption"
                              fontWeight={600}
                            >
                              Profesor: {ownerName}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    }
                    primaryTypographyProps={{
                      fontWeight: 600,
                      variant: 'body2',
                      sx: { fontSize: { xs: '0.9rem', sm: '1rem' } },
                    }}
                    secondaryTypographyProps={{ component: 'span' }}
                  />
                )}
              </ListItem>
            );
          })}
        </List>

        {/* Paginación */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          <TablePagination
            component="div"
            count={items.length}
            page={page}
            onPageChange={(_e, newPage) => {
              onPageChange(newPage);
            }}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              onRowsPerPageChange(Number(e.target.value));
              onPageChange(0);
            }}
            rowsPerPageOptions={[5, 10, 15, 20]}
            labelRowsPerPage="Por página:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} de ${count}`
            }
          />
        </Box>
      </>
    );
  };

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={{ xs: 2, md: 3 }}>
        <MeetingRoomIcon
          color="primary"
          sx={{ fontSize: { xs: 28, md: 32 }, mr: 1.5 }}
        />
        <Typography
          variant="h5"
          fontWeight={600}
          sx={{ fontSize: { xs: '1.25rem', md: '1.5rem' } }}
        >
          Gestión de Aulas y Clases
        </Typography>
      </Box>
      <Divider sx={{ mb: { xs: 3, md: 4 } }} />

      {isEditing && (
        <Box
          component="form"
          onSubmit={onCreateSlot}
          sx={{ mb: 4, p: 2, bgcolor: 'action.hover', borderRadius: 2 }}
        >
          <Typography variant="subtitle2" gutterBottom color="text.secondary">
            Configurar nueva clase:
          </Typography>
          <Box
            display="flex"
            gap={2}
            alignItems="center"
            flexDirection={{ xs: 'column', md: 'row' }}
          >
            <Box flex={1} width="100%">
              <Input
                label="Curso/Grupo (ej: A01)"
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
              sx={{ py: 1.5, minWidth: 120, width: { xs: '100%', md: 'auto' } }}
              startIcon={<AddCircleOutlineIcon />}
            >
              Añadir
            </Button>
          </Box>
        </Box>
      )}

      {/* Acordeón Mis Aulas */}
      <Accordion
        defaultExpanded
        sx={{
          mb: 1,
          borderRadius: '8px !important',
          '&:before': { display: 'none' },
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ bgcolor: 'action.hover' }}
        >
          <Typography variant="subtitle1" fontWeight={700}>
            MIS AULAS
            <Chip
              label={slots.length}
              size="small"
              sx={{ ml: 1, fontWeight: 700 }}
            />
          </Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          {renderSlotList(
            slots,
            false,
            myPage,
            myRowsPerPage,
            setMyPage,
            setMyRowsPerPage
          )}
        </AccordionDetails>
      </Accordion>

      {/* Acordeón Todas las Aulas (Solo Administradores) */}
      {allSlots.length > 0 && (
        <Accordion
          sx={{
            mb: 1,
            borderRadius: '8px !important',
            '&:before': { display: 'none' },
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon />}
            sx={{ bgcolor: 'action.hover' }}
          >
            <Typography variant="subtitle1" fontWeight={700}>
              TODAS LAS AULAS
              <Chip
                label={allSlots.length}
                size="small"
                color="primary"
                sx={{ ml: 1, fontWeight: 700 }}
              />
            </Typography>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            {renderSlotList(
              allSlots,
              true,
              allPage,
              allRowsPerPage,
              setAllPage,
              setAllRowsPerPage
            )}
          </AccordionDetails>
        </Accordion>
      )}
    </Box>
  );
};

export default ProfessorSlotsManager;
