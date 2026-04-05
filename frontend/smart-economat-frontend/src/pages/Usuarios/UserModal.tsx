import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Box,
  Typography,
  Skeleton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Divider,
  IconButton,
  Tooltip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AddCircleIcon from '@mui/icons-material/AddCircleOutline';
import {
  Usuario,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
  RolOption,
  Permiso,
} from '../../types/usuario';
import SelectField from '../../components/ui/SelectField';
import InputField from '../../components/ui/InputField';
import { usuarioService } from '../../services/usuarioService';
import {
  profesorService,
  AlumnoSlot,
  ProfesorInfo,
} from '../../services/profesor.service';
import { UbicacionService } from '../../services/ubicacion.service';
import { Ubicacion } from '../../services/ubicacion.types';
import QuickLocationDialog from '../../components/inventario/QuickLocationDialog';
import QuickSlotDialog from '../../features/profile/components/QuickSlotDialog';
import { isElevatedRole } from '../../sherlock-auth/permissions';

export interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CrearUsuarioDTO | ActualizarUsuarioDTO) => Promise<void>;
  userToEdit?: Usuario | null;
  isSaving?: boolean;
  isLoadingRoles?: boolean;
  isLoadingContent?: boolean;
  usuariosList: Usuario[];
  roleOptions: RolOption[];
}

const UserModal: React.FC<UserModalProps> = ({
  open,
  onClose,
  onSave,
  userToEdit,
  isSaving = false,
  isLoadingRoles = false,
  isLoadingContent = false,
  usuariosList,
  roleOptions,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    nombre: '',
    email: '',
    rol: 'Alumno',
    estado: 'Inactivo',
    roleId: '',
    slotId: '',
    ubicacionId: '',
  });

  const [allSlots, setAllSlots] = useState<AlumnoSlot[]>([]);
  const [allUbicaciones, setAllUbicaciones] = useState<Ubicacion[]>([]);
  const [allProfesores, setAllProfesores] = useState<ProfesorInfo[]>([]);
  const [isLoadingExtras, setIsLoadingExtras] = useState(false);

  const [openSlotDialog, setOpenSlotDialog] = useState(false);
  const [openLocDialog, setOpenLocDialog] = useState(false);

  const [availablePermissions, setAvailablePermissions] = useState<Permiso[]>(
    []
  );
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchPerms = async () => {
      setIsLoadingPermissions(true);
      setIsLoadingExtras(true);
      try {
        const [resp, slotsResp, locsResp, profsResp] = await Promise.all([
          usuarioService.getPermissions(),
          profesorService.getAllSlots(),
          UbicacionService.findAll(),
          profesorService.getAllProfesores(),
        ]);
        setAvailablePermissions(resp.data);
        if (slotsResp.success) setAllSlots(slotsResp.data);
        setAllUbicaciones(locsResp);
        if (profsResp.success) setAllProfesores(profsResp.data);
      } catch (err) {
        console.error('Error fetching data', err);
      } finally {
        setIsLoadingPermissions(false);
        setIsLoadingExtras(false);
      }
    };
    if (open) fetchPerms();
  }, [open]);

  const shouldShowSkeleton =
    isLoadingContent ||
    isLoadingRoles ||
    isLoadingPermissions ||
    isLoadingExtras;

  const renderFieldSkeleton = (width: string = '100%') => (
    <Box width={width}>
      <Skeleton
        variant="text"
        width={140}
        height={20}
        animation="wave"
        sx={{ mb: 0.5 }}
      />
      <Skeleton variant="rounded" height={56} animation="wave" />
    </Box>
  );

  const renderPermissionAccordionSkeleton = (
    index: number,
    expanded = false
  ) => (
    <Box
      key={`permission-skeleton-${index}`}
      sx={{
        mb: 1,
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 1,
        overflow: 'hidden',
        bgcolor: 'background.paper',
      }}
    >
      <Box
        sx={{
          px: 2,
          py: 1.75,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Skeleton variant="text" width="42%" height={28} animation="wave" />
        <Skeleton variant="circular" width={20} height={20} animation="wave" />
      </Box>

      {expanded ? (
        <Box sx={{ px: 2, pb: 2, pt: 0.5 }}>
          <Grid container spacing={1.5}>
            {Array.from({ length: 6 }).map((_, permissionIndex) => (
              <Grid size={{ xs: 12, sm: 6 }} key={permissionIndex}>
                <Box display="flex" alignItems="center" gap={1.25}>
                  <Skeleton
                    variant="rounded"
                    width={18}
                    height={18}
                    animation="wave"
                  />
                  <Skeleton
                    variant="text"
                    width={permissionIndex % 2 === 0 ? '72%' : '58%'}
                    height={22}
                    animation="wave"
                  />
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>
      ) : null}
    </Box>
  );

  useEffect(() => {
    if (open) {
      if (userToEdit) {
        setFormData({
          username: userToEdit.username,
          nombre: userToEdit.nombre || '',
          email: userToEdit.email,
          rol: userToEdit.rol,
          estado: userToEdit.estado,
          roleId: userToEdit.roleId || '',
          slotId: userToEdit.slotId || '',
          ubicacionId: userToEdit.ubicacionId || '',
        });

        const rolePerms =
          roleOptions.find((r) => r.id === userToEdit.roleId)?.permisos || [];
        const rolePermIds = rolePerms.map((p) => p.id);
        const additionalIds =
          userToEdit.permisosAdicionales?.map((p) => p.id) || [];
        const excludedIds =
          userToEdit.permisosExcluidos?.map((p) => p.id) || [];

        const totalIds = Array.from(
          new Set([...rolePermIds, ...additionalIds])
        ).filter((id) => !excludedIds.includes(id));
        setSelectedPermissions(totalIds);
      } else {
        const defaultRole = roleOptions[0];
        setFormData({
          username: '',
          nombre: '',
          email: '',
          rol: defaultRole?.nombre || 'ALUMNO',
          estado: 'Inactivo',
          roleId: defaultRole?.id || '',
          slotId: '',
          ubicacionId: '',
        });
        setSelectedPermissions(defaultRole?.permisos?.map((p) => p.id) || []);
      }
      setErrors({});
    }
  }, [open, userToEdit, roleOptions]);

  const handleChange =
    (field: keyof typeof formData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextValue = e.target.value;
      if (field === 'slotId' && nextValue === 'CREATE_NEW_SLOT') {
        setOpenSlotDialog(true);
        return;
      }
      if (field === 'ubicacionId' && nextValue === 'CREATE_NEW_LOC') {
        setOpenLocDialog(true);
        return;
      }

      setFormData((prev) => {
        if (field === 'roleId') {
          const selectedRole = roleOptions.find(
            (role) => role.id === nextValue
          );
          setSelectedPermissions(
            selectedRole?.permisos?.map((p) => p.id) || []
          );
          return {
            ...prev,
            roleId: nextValue,
            rol: selectedRole?.nombre || 'ALUMNO',
          };
        }
        return { ...prev, [field]: nextValue };
      });
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: '' }));
      }
    };

  const isAdminRole = (role?: string) => {
    return isElevatedRole(role);
  };

  const isLastAdmin = () => {
    if (!userToEdit || !isAdminRole(userToEdit.rol)) return false;
    const adminCount = usuariosList.filter(
      (u) => isAdminRole(u.rol) && u.estado === 'Activo'
    ).length;
    return adminCount <= 1;
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.username.trim())
      newErrors.username = 'El usuario es obligatorio';
    if (!formData.roleId.trim()) newErrors.roleId = 'Debes seleccionar un rol';

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.rol !== 'Alumno') {
      if (!formData.email.trim()) {
        newErrors.email = 'El correo es obligatorio';
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Formato de correo inválido';
      }
    }

    if (isLastAdmin()) {
      if (!isAdminRole(formData.rol)) {
        newErrors.rol = 'No puedes quitar el último administrador activo.';
      }
      if (formData.estado === 'Inactivo') {
        newErrors.estado = 'No puedes desactivar el último administrador.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      const currentRole = roleOptions.find((r) => r.id === formData.roleId);
      const rolePermIds = currentRole?.permisos?.map((p) => p.id) || [];
      const adicionales = selectedPermissions.filter(
        (id) => !rolePermIds.includes(id)
      );
      const excluidos = rolePermIds.filter(
        (id) => !selectedPermissions.includes(id)
      );

      onSave({
        ...formData,
        permisosAdicionalesIds: adicionales,
        permisosExcluidosIds: excluidos,
        slotId: formData.slotId || null,
        ubicacionId: formData.ubicacionId || null,
      } as CrearUsuarioDTO | ActualizarUsuarioDTO);
    }
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  const groupedPermissions = availablePermissions.reduce(
    (acc, p) => {
      const mod = p.modulo || 'Otros';
      if (!acc[mod]) acc[mod] = [];
      acc[mod].push(p);
      return acc;
    },
    {} as Record<string, Permiso[]>
  );

  const handleToggleStatus = () => {
    const nextEstado = formData.estado === 'Activo' ? 'Inactivo' : 'Activo';
    setFormData((prev) => ({ ...prev, estado: nextEstado }));
    if (errors.estado) {
      setErrors((prev) => ({ ...prev, estado: '' }));
    }
  };

  const isEditMode = !!userToEdit;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>
        {isEditMode || isLoadingContent ? 'Editar Usuario' : 'Nuevo Usuario'}
      </DialogTitle>
      <DialogContent dividers>
        {shouldShowSkeleton ? (
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            {renderFieldSkeleton()}
            {renderFieldSkeleton()}
            {renderFieldSkeleton()}
            <Box display="flex" gap={2} flexWrap="wrap">
              <Box flex={1} minWidth="200px">
                {renderFieldSkeleton()}
              </Box>
              <Box
                flex={1}
                minWidth="200px"
                display="flex"
                flexDirection="column"
                alignItems="center"
                justifyContent="center"
                gap={0.75}
                pt={0.5}
              >
                <Skeleton
                  variant="text"
                  width={110}
                  height={18}
                  animation="wave"
                />
                <Skeleton
                  variant="rounded"
                  width={140}
                  height={36}
                  animation="wave"
                  sx={{ borderRadius: 2 }}
                />
              </Box>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Box>
              <Skeleton
                variant="text"
                width={220}
                height={26}
                animation="wave"
              />
            </Box>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
              {renderPermissionAccordionSkeleton(1)}
              {renderPermissionAccordionSkeleton(2, true)}
              {renderPermissionAccordionSkeleton(3)}
            </Box>
          </Box>
        ) : (
          <Box display="flex" flexDirection="column" gap={2} sx={{ mt: 1 }}>
            <InputField
              id="user-username"
              fullWidth
              label="Nombre de Usuario"
              value={formData.username}
              onChange={handleChange('username')}
              error={!!errors.username}
              helperText={errors.username}
              disabled={isSaving}
              required
            />
            <InputField
              id="user-nombre"
              fullWidth
              label="Nombre y Apellidos"
              value={formData.nombre}
              onChange={handleChange('nombre')}
              error={!!errors.nombre}
              helperText={errors.nombre}
              disabled={isSaving}
            />
            {formData.rol !== 'Alumno' && (
              <InputField
                id="user-email"
                fullWidth
                label="Correo Electrónico"
                type="email"
                value={formData.email}
                onChange={handleChange('email')}
                error={!!errors.email}
                helperText={errors.email}
                disabled={isSaving}
                required
              />
            )}
            <Box
              display="flex"
              gap={2}
              flexWrap="wrap"
              alignItems="center"
              justifyContent="space-between"
            >
              <Box flex={1} minWidth="200px">
                <SelectField
                  fullWidth
                  id="user-role-select"
                  label="Rol"
                  value={formData.roleId}
                  onChange={handleChange('roleId')}
                  error={!!errors.roleId || !!errors.rol}
                  helperText={
                    errors.roleId ||
                    errors.rol ||
                    (isLoadingRoles ? 'Cargando roles...' : undefined)
                  }
                  disabled={
                    isSaving || isLoadingRoles || roleOptions.length === 0
                  }
                  options={
                    roleOptions.length > 0
                      ? roleOptions.map((role) => ({
                          value: role.id,
                          label: role.nombre,
                        }))
                      : [
                          {
                            value: '',
                            label: isLoadingRoles
                              ? 'Cargando...'
                              : 'No hay roles disponibles',
                          },
                        ]
                  }
                />
              </Box>
              {isEditMode && (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  gap={0.5}
                >
                  <Typography variant="caption" color="text.secondary">
                    Estado de cuenta
                  </Typography>
                  <Button
                    variant={
                      formData.estado === 'Activo' ? 'contained' : 'outlined'
                    }
                    color={formData.estado === 'Activo' ? 'success' : 'error'}
                    onClick={handleToggleStatus}
                    disabled={isSaving}
                    sx={{
                      borderRadius: 2,
                      minWidth: 140,
                      textTransform: 'none',
                      fontWeight: 'bold',
                    }}
                  >
                    {formData.estado === 'Activo'
                      ? 'CUENTA ACTIVA'
                      : 'CUENTA SUSPENDIDA'}
                  </Button>
                </Box>
              )}
              {!isEditMode && (
                <Box flex={1} minWidth="200px">
                  <SelectField
                    fullWidth
                    id="user-status-select"
                    label="Estado Inicial"
                    value={formData.estado}
                    onChange={handleChange('estado')}
                    disabled={isSaving}
                    options={[
                      { value: 'Activo', label: 'Activo' },
                      { value: 'Inactivo', label: 'Inactivo' },
                    ]}
                  />
                </Box>
              )}
            </Box>

            {/* Asignación de Aula y Ubicación */}
            <Box display="flex" gap={2} flexWrap="wrap" sx={{ mt: 1 }}>
              <Box
                flex={1}
                minWidth="240px"
                display="flex"
                alignItems="flex-start"
                gap={1}
              >
                <Box flex={1}>
                  <SelectField
                    fullWidth
                    id="user-slot-select"
                    label="Aula / Slot Asignado"
                    value={formData.slotId || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        slotId: e.target.value,
                      }))
                    }
                    disabled={isSaving}
                    options={[
                      { value: '', label: 'Sin Aula' },
                      ...allSlots.map((s) => ({
                        value: s.id,
                        label: `${s.aula} - Clase ${s.numeroClase} (${s.profesor?.user?.username || 'Propio'})`,
                      })),
                      {
                        value: 'CREATE_NEW_SLOT',
                        label: (
                          <Typography
                            variant="button"
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          >
                            + CREAR NUEVA AULA
                          </Typography>
                        ),
                      },
                    ]}
                  />
                </Box>
                <Tooltip title="Crear nueva Aula">
                  <IconButton
                    color="primary"
                    sx={{ mt: 1 }}
                    onClick={() => setOpenSlotDialog(true)}
                  >
                    <AddCircleIcon />
                  </IconButton>
                </Tooltip>
              </Box>

              <Box
                flex={1}
                minWidth="240px"
                display="flex"
                alignItems="flex-start"
                gap={1}
              >
                <Box flex={1}>
                  <SelectField
                    fullWidth
                    id="user-ubicacion-select"
                    label="Ubicación Almacén"
                    value={formData.ubicacionId || ''}
                    onChange={handleChange('ubicacionId')}
                    disabled={isSaving}
                    options={[
                      { value: '', label: 'Sin Ubicación' },
                      ...allUbicaciones.map((u) => ({
                        value: u.id,
                        label: u.nombre,
                      })),
                      {
                        value: 'CREATE_NEW_LOC',
                        label: (
                          <Typography
                            variant="button"
                            color="primary"
                            sx={{ fontWeight: 'bold' }}
                          >
                            + CREAR NUEVA UBICACIÓN
                          </Typography>
                        ),
                      },
                    ]}
                  />
                </Box>
                <Tooltip title="Crear nueva Ubicación">
                  <IconButton
                    color="primary"
                    sx={{ mt: 1 }}
                    onClick={() => setOpenLocDialog(true)}
                  >
                    <AddCircleIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>

            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom>
              Permisos Individuales Adicionales
            </Typography>
            <Box sx={{ maxHeight: 300, overflowY: 'auto', pr: 1 }}>
              {Object.entries(groupedPermissions).map(([module, perms]) => (
                <Accordion
                  key={module}
                  elevation={0}
                  variant="outlined"
                  sx={{ mb: 1 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography
                      variant="body2"
                      sx={{ fontWeight: 'bold', textTransform: 'capitalize' }}
                    >
                      Módulo: {module}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ py: 0 }}>
                    <FormGroup>
                      <Grid container spacing={1}>
                        {(perms as Permiso[]).map((p) => (
                          <Grid size={{ xs: 12, sm: 6 }} key={p.id}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  size="small"
                                  checked={selectedPermissions.includes(p.id)}
                                  onChange={() => handleTogglePermission(p.id)}
                                />
                              }
                              label={
                                <Typography variant="caption">
                                  {p.nombre}
                                </Typography>
                              }
                            />
                          </Grid>
                        ))}
                      </Grid>
                    </FormGroup>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          disabled={isSaving || shouldShowSkeleton}
          startIcon={
            isSaving ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isSaving ? 'Guardando...' : 'Guardar'}
        </Button>
      </DialogActions>

      <QuickSlotDialog
        open={openSlotDialog}
        onClose={() => setOpenSlotDialog(false)}
        profesores={allProfesores}
        ubicaciones={allUbicaciones}
        onSuccess={(newSlot) => {
          setAllSlots((prev) => [...prev, newSlot]);
          setFormData((prev) => ({ ...prev, slotId: newSlot.id }));
        }}
      />
      <QuickLocationDialog
        open={openLocDialog}
        onClose={() => setOpenLocDialog(false)}
        onSuccess={(newLoc) => {
          setAllUbicaciones((prev) => [...prev, newLoc]);
          setFormData((prev) => ({ ...prev, ubicacionId: newLoc.id }));
        }}
      />
    </Dialog>
  );
};

export default UserModal;
