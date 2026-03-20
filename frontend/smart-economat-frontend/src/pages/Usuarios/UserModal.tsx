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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Grid,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  Usuario,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
  RolOption,
  Permiso,
} from '../../types/usuario';
import { useToast } from '../../store/toast.hooks';
import SelectField from '../../components/ui/SelectField';
import InputField from '../../components/ui/InputField';
import { usuarioService } from '../../services/usuarioService';

export interface UserModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: CrearUsuarioDTO | ActualizarUsuarioDTO) => Promise<void>;
  userToEdit?: Usuario | null;
  isSaving?: boolean;
  usuariosList: Usuario[];
  roleOptions: RolOption[];
}

// Ya no se requiere getRoleLabel puesto que usamos los nombres de la base de datos directamente.

const UserModal: React.FC<UserModalProps> = ({
  open,
  onClose,
  onSave,
  userToEdit,
  isSaving = false,
  usuariosList,
  roleOptions,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    rol: 'Alumno',
    estado: 'Inactivo',
    roleId: '',
  });

  const [availablePermissions, setAvailablePermissions] = useState<Permiso[]>(
    []
  );
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const toast = useToast();

  useEffect(() => {
    const fetchPerms = async () => {
      try {
        const resp = await usuarioService.getPermissions();
        setAvailablePermissions(resp.data);
      } catch (err) {
        console.error('Error fetching permissions', err);
      }
    };
    if (open) fetchPerms();
  }, [open]);

  useEffect(() => {
    if (open) {
      if (userToEdit) {
        setFormData({
          username: userToEdit.username,
          email: userToEdit.email,
          rol: userToEdit.rol,
          estado: userToEdit.estado,
          roleId: userToEdit.roleId || '',
        });

        const rolePerms =
          roleOptions.find((r) => r.id === userToEdit.roleId)?.permisos || [];
        const rolePermIds = rolePerms.map((p) => p.id);
        const additionalIds =
          userToEdit.permisosAdicionales?.map((p) => p.id) || [];
        const excludedIds =
          userToEdit.permisosExcluidos?.map((p) => p.id) || [];

        // Total = (Role + Adicionales) - Excluidos
        const totalIds = Array.from(
          new Set([...rolePermIds, ...additionalIds])
        ).filter((id) => !excludedIds.includes(id));
        setSelectedPermissions(totalIds);
      } else {
        const defaultRole = roleOptions[0];
        setFormData({
          username: '',
          email: '',
          rol: defaultRole?.nombre || 'ALUMNO',
          estado: 'Inactivo',
          roleId: defaultRole?.id || '',
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
      setFormData((prev) => {
        if (field === 'roleId') {
          const selectedRole = roleOptions.find(
            (role) => role.id === nextValue
          );
          // Al cambiar de rol, marcamos por defecto los permisos de ese rol
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
    const normalized = role?.toUpperCase() || '';
    return (
      normalized === 'ADMIN' ||
      normalized === 'ADMINISTRADOR' ||
      normalized === 'SUPER_ADMIN'
    );
  };

  const isLastAdmin = () => {
    if (!userToEdit || !isAdminRole(userToEdit.rol)) return false;

    // Count how many administrators currently exist
    const adminCount = usuariosList.filter(
      (u) => isAdminRole(u.rol) && u.estado === 'Activo'
    ).length;

    // If we only have 1 active admin (this one), they cannot change their role or status to Inactive
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
        toast.error(
          'Operación denegada. El sistema debe retener al menos un Administrador activo.'
        );
      }
      if (formData.estado === 'Inactivo') {
        newErrors.estado = 'No puedes desactivar el último administrador.';
        if (!newErrors.rol)
          toast.error(
            'Operación denegada. El sistema debe retener al menos un Administrador activo.'
          );
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validate()) {
      const currentRole = roleOptions.find((r) => r.id === formData.roleId);
      const rolePermIds = currentRole?.permisos?.map((p) => p.id) || [];

      // Adicionales: Están en selected pero NO en el rol base
      const adicionales = selectedPermissions.filter(
        (id) => !rolePermIds.includes(id)
      );

      // Excluidos: Están en el rol base pero NO en selected
      const excluidos = rolePermIds.filter(
        (id) => !selectedPermissions.includes(id)
      );

      onSave({
        ...formData,
        permisosAdicionalesIds: adicionales,
        permisosExcluidosIds: excluidos,
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
        {isEditMode ? 'Editar Usuario' : 'Nuevo Usuario'}
      </DialogTitle>
      <DialogContent dividers>
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
                helperText={errors.roleId || errors.rol}
                disabled={isSaving}
                options={roleOptions.map((role) => ({
                  value: role.id,
                  label: role.nombre,
                }))}
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
                {errors.estado && (
                  <Typography variant="caption" color="error">
                    {errors.estado}
                  </Typography>
                )}
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
                  error={!!errors.estado}
                  helperText={errors.estado}
                  disabled={isSaving}
                  options={[
                    { value: 'Activo', label: 'Activo' },
                    { value: 'Inactivo', label: 'Inactivo' },
                  ]}
                />
              </Box>
            )}
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
                      {perms.map((p) => (
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
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={isSaving}>
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          color="primary"
          disabled={isSaving}
          sx={{ px: 4, borderRadius: 2 }}
          startIcon={
            isSaving ? <CircularProgress size={20} color="inherit" /> : null
          }
        >
          {isSaving ? 'Guardando Cambios' : 'Guardar'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserModal;
