import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemText,
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
  Tooltip,
} from '@mui/material';
import MeetingRoomIcon from '@mui/icons-material/MeetingRoom';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ListSkeleton from '../../../components/ui/ListSkeleton';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import PersonIcon from '@mui/icons-material/Person';
import { AlumnoSlot, ProfesorInfo } from '../../../services/profesor.service';
import type { Ubicacion } from '../../../services/ubicacion.types';
import QuickLocationDialog from '../../../components/inventario/QuickLocationDialog';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';

interface ProfessorSlotsManagerProps {
  isEditing: boolean;
  slots: AlumnoSlot[];
  allSlots?: AlumnoSlot[];
  allProfesores?: ProfesorInfo[];
  ubicaciones?: Ubicacion[];
  isLoading: boolean;
  isSaving: boolean;
  newSlot: {
    aula: string;
    numeroClase: string;
    capacidad: string;
    profesorId?: string;
    ubicacionId?: string;
  };
  onNewSlotChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreateSlot: (e: React.FormEvent) => void;
  onDeleteSlot: (id: string, isAdminView?: boolean) => void;
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
  onRefreshUbicaciones?: () => Promise<void>;
}

/**
 * Documentación en español.
 */
const ProfessorSlotsManager: React.FC<ProfessorSlotsManagerProps> = ({
  isEditing,
  slots,
  allSlots = [],
  allProfesores = [],
  ubicaciones = [],
  isLoading,
  isSaving,
  newSlot,
  onNewSlotChange,
  onCreateSlot,
  onDeleteSlot,
  onUpdateSlot,
  onAdminUpdateSlot,
  onRefreshUbicaciones,
}) => {
  const { t } = useTranslation();
  const [editingSlotId, setEditingSlotId] = React.useState<string | null>(null);
  const [openLocDialog, setOpenLocDialog] = React.useState(false);
  const [editData, setEditData] = React.useState({
    aula: '',
    numeroClase: '',
    capacidad: '',
    profesorId: '',
    ubicacionId: '',
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
      ubicacionId: slot.ubicacionId ?? slot.ubicacion?.id ?? '',
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
        ubicacionId: editData.ubicacionId || undefined,
      });
    } else {
      await onUpdateSlot(id, {
        aula: editData.aula,
        numeroClase: Number(editData.numeroClase),
        capacidad: Number(editData.capacidad),
        ubicacionId: editData.ubicacionId || undefined,
      });
    }
    setEditingSlotId(null);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
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
      return <ListSkeleton hasHeader={false} count={3} />;
    }

    if (items.length === 0) {
      return (
        <Typography
          variant="body2"
          color="text.secondary"
          align="center"
          sx={{ py: 3, fontStyle: 'italic' }}
        >
          {t('perfil.sinClasesConfiguradas')}
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
              t('perfil.propietarioDesconocido');

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
                          aria-label={t('perfil.guardarSlot')}
                          onClick={() => handleSaveEdit(slot.id, showOwner)}
                          color="success"
                          size="small"
                          disabled={isSaving}
                        >
                          <SaveIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label={t('perfil.cancelarEdicion')}
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
                          title={t('perfil.copiarCodigo')}
                          onClick={() => {
                            if (slot.codigoSlot) {
                              navigator.clipboard.writeText(slot.codigoSlot);
                            }
                          }}
                        >
                          {t('perfil.slotCodigoLinea', {
                            codigo:
                              slot.codigoSlot || t('perfil.codigoPendiente'),
                          })}
                        </Box>

                        <IconButton
                          edge="end"
                          aria-label={t('perfil.editarSlot')}
                          onClick={() => handleStartEdit(slot, showOwner)}
                          color="success"
                          size="small"
                          disabled={isSaving}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          edge="end"
                          aria-label={t('perfil.eliminarSlot')}
                          onClick={() => onDeleteSlot(slot.id, showOwner)}
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
                      label={t('perfil.campoAula')}
                      name="aula"
                      size="small"
                      value={editData.aula}
                      onChange={handleEditChange}
                      disabled={isSaving}
                      sx={{ flex: '1 1 80px', minWidth: 80 }}
                    />
                    <TextField
                      label={t('perfil.campoNumeroClase')}
                      name="numeroClase"
                      size="small"
                      type="number"
                      value={editData.numeroClase}
                      onChange={handleEditChange}
                      disabled={isSaving}
                      sx={{ flex: '1 1 70px', minWidth: 70 }}
                    />
                    <TextField
                      label={t('perfil.campoCapacidad')}
                      name="capacidad"
                      size="small"
                      type="number"
                      value={editData.capacidad}
                      onChange={handleEditChange}
                      disabled={isSaving}
                      sx={{ flex: '1 1 80px', minWidth: 80 }}
                    />

                    <Box
                      display="flex"
                      alignItems="center"
                      gap={0.5}
                      sx={{ flex: '2 1 180px', minWidth: 180 }}
                    >
                      <FormControl size="small" fullWidth>
                        <InputLabel id={`ubicacion-select-${slot.id}`}>
                          {t('comun.ubicacion')}
                        </InputLabel>
                        <Select
                          labelId={`ubicacion-select-${slot.id}`}
                          label={t('comun.ubicacion')}
                          value={editData.ubicacionId}
                          onChange={(e) => {
                            const val = e.target.value as string;
                            if (val === 'CREATE_NEW_LOC') {
                              setOpenLocDialog(true);
                            } else {
                              setEditData((prev) => ({
                                ...prev,
                                ubicacionId: val,
                              }));
                            }
                          }}
                          disabled={isSaving}
                        >
                          <MenuItem value="">
                            <em>{t('perfil.sinUbicacion')}</em>
                          </MenuItem>
                          {ubicaciones.map((u) => (
                            <MenuItem key={u.id} value={u.id}>
                              {u.nombre}
                            </MenuItem>
                          ))}
                          <Divider />
                          <MenuItem
                            value="CREATE_NEW_LOC"
                            sx={{ color: 'primary.main', fontWeight: 'bold' }}
                          >
                            {t('perfil.menuCrearNuevaUbicacion')}
                          </MenuItem>
                        </Select>
                      </FormControl>
                      <Tooltip title={t('perfil.crearNuevaUbicacion')}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => setOpenLocDialog(true)}
                        >
                          <AddCircleIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>

                    {showOwner && onAdminUpdateSlot && (
                      <FormControl
                        size="small"
                        sx={{ flex: '2 1 140px', minWidth: 140 }}
                      >
                        <InputLabel id={`profesor-select-${slot.id}`}>
                          {t('perfil.campoProfesor')}
                        </InputLabel>
                        <Select
                          labelId={`profesor-select-${slot.id}`}
                          label={t('perfil.campoProfesor')}
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
                    primary={t('perfil.cursoClaseCabecera', {
                      aula: slot.aula,
                      numeroClase: slot.numeroClase,
                    })}
                    secondary={
                      <Box component="span" sx={{ display: 'block' }}>
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ display: 'block' }}
                        >
                          {t('perfil.capacidadMaxAlumnos', {
                            n: slot.capacidad,
                          })}
                        </Typography>
                        <Typography
                          component="span"
                          variant="caption"
                          sx={{ display: 'block' }}
                        >
                          {t('perfil.ubicacionConNombre', {
                            nombre:
                              slot.ubicacion?.nombre || t('perfil.sinAsignar'),
                          })}
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
                              {t('perfil.profesorConNombre', {
                                nombre: ownerName,
                              })}
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
            labelRowsPerPage={t('comun.porPagina')}
            labelDisplayedRows={({ from, to, count }) =>
              t('table.pagination.displayedRows', { from, to, count })
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
          {t('perfil.gestionAulasTitulo')}
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
            {t('perfil.configurarNuevaClase')}
          </Typography>
          <Box
            display="flex"
            gap={2}
            alignItems="center"
            flexDirection={{ xs: 'column', md: 'row' }}
          >
            <Box flex={1} width="100%">
              <Input
                label={t('perfil.cursoGrupo')}
                name="aula"
                value={newSlot.aula}
                onChange={onNewSlotChange}
                required
                disabled={isSaving}
              />
            </Box>
            <Box flex={1} width="100%">
              <Input
                label={t('perfil.numeroClaseEj')}
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
                label={t('perfil.capacidadAlumnos')}
                name="capacidad"
                type="number"
                value={newSlot.capacidad}
                onChange={onNewSlotChange}
                required
                disabled={isSaving}
              />
            </Box>

            <Box
              flex={2}
              width="100%"
              display="flex"
              alignItems="center"
              gap={0.5}
            >
              <FormControl fullWidth size="small">
                <InputLabel id="new-slot-ubicacion-label">
                  {t('comun.ubicacion')}
                </InputLabel>
                <Select
                  labelId="new-slot-ubicacion-label"
                  label={t('comun.ubicacion')}
                  name="ubicacionId"
                  value={newSlot.ubicacionId || ''}
                  onChange={(e) => {
                    const val = e.target.value as string;
                    if (val === 'CREATE_NEW_LOC') {
                      setOpenLocDialog(true);
                    } else {
                      onNewSlotChange({
                        target: {
                          name: 'ubicacionId',
                          value: val,
                        },
                      } as React.ChangeEvent<HTMLInputElement>);
                    }
                  }}
                  disabled={isSaving}
                  sx={{ bgcolor: 'background.paper' }}
                >
                  <MenuItem value="">
                    <em>{t('perfil.sinUbicacion')}</em>
                  </MenuItem>
                  {ubicaciones.map((u) => (
                    <MenuItem key={u.id} value={u.id}>
                      {u.nombre}
                    </MenuItem>
                  ))}
                  <Divider />
                  <MenuItem
                    value="CREATE_NEW_LOC"
                    sx={{ color: 'primary.main', fontWeight: 'bold' }}
                  >
                    {t('perfil.menuCrearNuevaUbicacion')}
                  </MenuItem>
                </Select>
              </FormControl>
              <Tooltip title={t('perfil.crearNuevaUbicacion')}>
                <IconButton
                  size="small"
                  color="primary"
                  onClick={() => setOpenLocDialog(true)}
                >
                  <AddCircleIcon />
                </IconButton>
              </Tooltip>
            </Box>

            {allProfesores.length > 0 && (
              <Box flex={2} width="100%">
                <FormControl fullWidth size="small">
                  <InputLabel id="new-slot-profesor-label">
                    {t('perfil.campoProfesor')}
                  </InputLabel>
                  <Select
                    labelId="new-slot-profesor-label"
                    label={t('perfil.campoProfesor')}
                    name="profesorId"
                    value={newSlot.profesorId || ''}
                    onChange={(e) =>
                      onNewSlotChange({
                        target: {
                          name: 'profesorId',
                          value: e.target.value as string,
                        },
                      } as React.ChangeEvent<HTMLInputElement>)
                    }
                    disabled={isSaving}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <MenuItem value="">
                      <em>{t('perfil.profesorPropioOpcion')}</em>
                    </MenuItem>
                    {allProfesores.map((p) => (
                      <MenuItem key={p.id} value={p.id}>
                        {p.nombre || p.username || p.email || p.id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              isLoading={isSaving}
              sx={{ py: 1.5, minWidth: 120, width: { xs: '100%', md: 'auto' } }}
              startIcon={<AddCircleIcon />}
            >
              {t('perfil.anadirClase')}
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
            {t('perfil.acordeonMisAulas')}
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
              {t('perfil.acordeonTodasAulas')}
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

      <QuickLocationDialog
        open={openLocDialog}
        onClose={() => setOpenLocDialog(false)}
        onSuccess={async (newLoc) => {
          if (onRefreshUbicaciones) {
            await onRefreshUbicaciones();
          }
          if (editingSlotId) {
            setEditData((prev) => ({ ...prev, ubicacionId: newLoc.id }));
          } else {
            onNewSlotChange({
              target: {
                name: 'ubicacionId',
                value: newLoc.id,
              },
            } as React.ChangeEvent<HTMLInputElement>);
          }
        }}
      />
    </Box>
  );
};

export default React.memo(ProfessorSlotsManager);
