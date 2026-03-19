import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Button,
  Stack,
  Avatar,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  CircularProgress,
  TextField,
  InputAdornment,
  SelectChangeEvent,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';
import SchoolIcon from '@mui/icons-material/School';
import SearchIcon from '@mui/icons-material/Search';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNavigate } from 'react-router-dom';

import DataTable, { Column } from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import StatusChip from '../../components/ui/StatusChip';
import UserModal from './UserModal';

import { usuarioService } from '../../services/usuarioService';
import {
  Usuario,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
  RolOption,
} from '../../types/usuario';
import { ROLE_COLORS } from '../../utils/theme/roleColors';
import { useToast } from '../../store/toast.hooks';
import { useAuth } from '../../store/auth.hooks';

const isAdminRole = (role?: string) => {
  const normalized = role?.toUpperCase() || '';
  return normalized === 'ADMIN' || normalized === 'ADMINISTRADOR';
};

const updatePaginationTotal = (
  current: { total: number; page: number; limit: number },
  nextTotal: number
) => {
  if (current.total === nextTotal) {
    return current;
  }

  return { ...current, total: nextTotal };
};

const UsuariosView: React.FC = () => {
  const navigate = useNavigate();
  // Estados para datos por rol
  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [professors, setProfessors] = useState<Usuario[]>([]);
  const [students, setStudents] = useState<Usuario[]>([]);
  const [roleOptions, setRoleOptions] = useState<RolOption[]>([]);

  // Metadatos de paginación para cada rol
  const [pagination, setPagination] = useState({
    admin: { total: 0, page: 1, limit: 10 },
    professor: { total: 0, page: 1, limit: 10 },
    student: { total: 0, page: 1, limit: 10 },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Estados para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Usuario | null>(null);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [userToReset, setUserToReset] = useState<Usuario | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  );

  const toast = useToast();
  const { user: currentUser, refreshUser } = useAuth();

  useEffect(() => {
    if (currentUser && !isAdminRole(currentUser.rol)) {
      navigate('/');
    }
  }, [currentUser, navigate]);

  // Debounce para el buscador
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      // Resetear páginas al buscar
      setPagination((prev) => ({
        admin: { ...prev.admin, page: 1 },
        professor: { ...prev.professor, page: 1 },
        student: { ...prev.student, page: 1 },
      }));
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  // Ref to read pagination without adding it as a dependency to fetchRoleData
  const paginationRef = React.useRef(pagination);
  paginationRef.current = pagination;

  const loadRoles = useCallback(async () => {
    try {
      const response = await usuarioService.getRoles();
      setRoleOptions((prev) => {
        const nextSerialized = JSON.stringify(response.data);
        const prevSerialized = JSON.stringify(prev);
        return prevSerialized === nextSerialized ? prev : response.data;
      });
    } catch {
      toast.error('Error al cargar los roles disponibles');
    }
  }, [toast]);

  const fetchRoleData = useCallback(
    async (
      role: 'Administrador' | 'Profesor' | 'Alumno'
    ) => {
      const roleKey =
        role === 'Administrador'
          ? 'admin'
          : role === 'Profesor'
            ? 'professor'
            : 'student';
      const { page, limit } = paginationRef.current[roleKey];

      try {
        const res = await usuarioService.getUsuarios(
          page,
          limit,
          debouncedSearch,
          role
        );

        if (role === 'Administrador') setAdmins(res.data);
        if (role === 'Profesor') setProfessors(res.data);
        if (role === 'Alumno') setStudents(res.data);

        setPagination((prev) => ({
          ...prev,
          [roleKey]: updatePaginationTotal(prev[roleKey], res.total),
        }));
      } catch {
        toast.error(`Error al cargar ${role.toLowerCase()}s`);
      }
    },
    [debouncedSearch, toast]
  );

  const fetchAllData = useCallback(async () => {
    setIsLoading(true);
    await Promise.all([
      loadRoles(),
      fetchRoleData('Administrador'),
      fetchRoleData('Profesor'),
      fetchRoleData('Alumno'),
    ]);
    setIsLoading(false);
  }, [
    fetchRoleData,
    loadRoles,
    pagination.admin.limit,
    pagination.admin.page,
    pagination.professor.limit,
    pagination.professor.page,
    pagination.student.limit,
    pagination.student.page,
  ]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  // Efectos por rol para paginación individual – depend on primitive values, not the callback
  useEffect(() => {
    fetchRoleData('Administrador');
  }, [
    pagination.admin.page,
    pagination.admin.limit,
    debouncedSearch,
    fetchRoleData,
  ]);

  useEffect(() => {
    fetchRoleData('Profesor');
  }, [
    pagination.professor.page,
    pagination.professor.limit,
    debouncedSearch,
    fetchRoleData,
  ]);

  useEffect(() => {
    fetchRoleData('Alumno');
  }, [
    pagination.student.page,
    pagination.student.limit,
    debouncedSearch,
    fetchRoleData,
  ]);

  const handleSaveUsuario = async (
    data: CrearUsuarioDTO | ActualizarUsuarioDTO
  ) => {
    setIsSaving(true);
    try {
      if (userToEdit) {
        const payload = data as ActualizarUsuarioDTO;
        const previousRoleId = userToEdit.roleId || '';
        const previousStatus = userToEdit.estado;

        await usuarioService.actualizarUsuario(userToEdit.id, payload);

        if (payload.roleId && payload.roleId !== previousRoleId) {
          await usuarioService.updateUserRole(userToEdit.id, payload.roleId);
        }

        if (payload.estado && payload.estado !== previousStatus) {
          await usuarioService.setUserActivation(
            userToEdit.id,
            payload.estado === 'Activo'
          );
        }

        if (
          currentUser &&
          userToEdit.id.toString() === currentUser.id.toString()
        ) {
          const refreshed = await refreshUser();
          if (!refreshed || !isAdminRole(refreshed.rol)) {
            navigate('/');
          }
        }

        toast.success('Usuario actualizado');
      } else {
        await usuarioService.crearUsuario(data as CrearUsuarioDTO);
        toast.success('Usuario creado');
      }
      setIsModalOpen(false);
      fetchAllData();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Error al guardar';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await usuarioService.eliminarUsuario(userToDelete.id);
      toast.success('Usuario eliminado');
      fetchAllData();
    } catch {
      toast.error('Error al eliminar');
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  const handlePasswordReset = async () => {
    if (!userToReset) return;
    setIsResetting(true);
    try {
      const res = await usuarioService.resetPassword(userToReset.id);
      setGeneratedPassword(res.data);
    } catch {
      toast.error('Error al resetear contraseña');
      setUserToReset(null);
    } finally {
      setIsResetting(false);
    }
  };

  const canResetTemporaryPassword = (targetUser: Usuario): boolean => {
    if (!currentUser) return false;
    const currentRol = currentUser.rol.toUpperCase();
    if (targetUser.id.toString() === currentUser.id.toString()) return false;
    if (currentRol === 'ADMIN' || currentRol === 'ADMINISTRADOR') return true;
    if (currentRol === 'PROFESOR') return targetUser.rol === 'Alumno';
    return false;
  };

  const columns: Column<Usuario>[] = [
    { id: 'username', label: 'Usuario', sortable: true },
    { id: 'email', label: 'Email', sortable: true, hideOnMobile: true },
    {
      id: 'estado',
      label: 'Estado',
      align: 'center',
      render: (row) => (
        <StatusChip
          status={row.estado === 'Activo' ? 'success' : 'default'}
          label={row.estado}
        />
      ),
    },
  ];

  const renderActions = (row: Usuario) => (
    <Stack direction="row" spacing={0.5} justifyContent="center">
      {row.id.toString() !== currentUser?.id.toString() && (
        <IconButton
          color={row.estado === 'Activo' ? 'warning' : 'success'}
          onClick={async () => {
            try {
              const shouldActivate = row.estado !== 'Activo';
              await usuarioService.setUserActivation(row.id, shouldActivate);
              toast.success(
                shouldActivate
                  ? 'Usuario activado correctamente'
                  : 'Usuario suspendido correctamente'
              );
              fetchAllData();
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : 'Error al actualizar el estado del usuario';
              toast.error(message);
            }
          }}
          size="small"
          title={row.estado === 'Activo' ? 'Suspender' : 'Activar'}
        >
          {row.estado === 'Activo' ? (
            <BlockIcon fontSize="small" />
          ) : (
            <CheckCircleOutlineIcon fontSize="small" />
          )}
        </IconButton>
      )}
      {canResetTemporaryPassword(row) && (
        <IconButton
          color="primary"
          onClick={() => setUserToReset(row)}
          size="small"
          title="Reset Password"
        >
          <VpnKeyIcon fontSize="small" />
        </IconButton>
      )}
      <IconButton
        color="secondary"
        onClick={() => {
          setUserToEdit(row);
          setIsModalOpen(true);
        }}
        size="small"
        title="Editar"
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        color="error"
        onClick={() => setUserToDelete(row)}
        size="small"
        title="Eliminar"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Stack>
  );

  const UserAccordion = ({
    title,
    icon,
    data,
    role,
    color,
  }: {
    title: string;
    icon: React.ReactNode;
    data: Usuario[];
    role: 'admin' | 'professor' | 'student';
    color: string;
  }) => {
    const rolePagination = pagination[role];

    return (
      <Accordion
        defaultExpanded={data.length > 0}
        sx={{
          mb: 2,
          borderRadius: '8px !important',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          sx={{ bgcolor: 'action.hover' }}
        >
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: color, width: 32, height: 32 }}>
              {icon}
            </Avatar>
            <Typography fontWeight={700}>
              {title} ({rolePagination.total})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          {rolePagination.total === 0 ? (
            <Typography
              variant="body2"
              sx={{
                p: 3,
                textAlign: 'center',
                fontStyle: 'italic',
                color: 'text.secondary',
              }}
            >
              No hay usuarios encontrados para este rol y búsqueda.
            </Typography>
          ) : (
            <DataTable
              columns={columns}
              data={data}
              isLoading={false}
              renderActions={renderActions}
              pagination={{
                currentPage: rolePagination.page,
                totalPages: Math.ceil(
                  rolePagination.total / rolePagination.limit
                ),
                onPageChange: (_, newPage) => {
                  setPagination((prev) => ({
                    ...prev,
                    [role]: { ...prev[role], page: newPage },
                  }));
                },
                pageSize: rolePagination.limit,
                pageSizeOptions: [5, 10, 15, 20],
                onPageSizeChange: (e: SelectChangeEvent<number>) => {
                  setPagination((prev) => ({
                    ...prev,
                    [role]: {
                      ...prev[role],
                      limit: Number(e.target.value),
                      page: 1,
                    },
                  }));
                },
              }}
            />
          )}
        </AccordionDetails>
      </Accordion>
    );
  };

  return (
    <Box>
      <Paper
        elevation={0}
        sx={{
          p: 3,
          mb: 3,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Box
          display="flex"
          flexWrap="wrap"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
        >
          <Box display="flex" alignItems="center" gap={2} flex={1}>
            <TextField
              placeholder="Buscar por nombre o email..."
              size="small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              sx={{ maxWidth: 400, flex: 1 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" color="action" />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={fetchAllData}
              disabled={isLoading}
              sx={{ borderRadius: 2 }}
            >
              Refrescar
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setUserToEdit(null);
                setIsModalOpen(true);
              }}
              sx={{ px: 3, borderRadius: 2 }}
            >
              Nuevo Usuario
            </Button>
          </Stack>
        </Box>
      </Paper>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={10}>
          <CircularProgress />
        </Box>
      ) : (
        <Box>
          <UserAccordion
            title="Administradores"
            icon={<AdminPanelSettingsIcon sx={{ fontSize: 20 }} />}
            data={admins}
            role="admin"
            color={ROLE_COLORS.Administrador}
          />
          <UserAccordion
            title="Profesores"
            icon={<SupervisorAccountIcon sx={{ fontSize: 20 }} />}
            data={professors}
            role="professor"
            color={ROLE_COLORS.Profesor}
          />
          <UserAccordion
            title="Alumnos"
            icon={<SchoolIcon sx={{ fontSize: 20 }} />}
            data={students}
            role="student"
            color={ROLE_COLORS.Alumno}
          />
        </Box>
      )}

      <UserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        onSave={handleSaveUsuario}
        isSaving={isSaving}
        usuariosList={[...admins, ...professors, ...students]}
        roleOptions={roleOptions}
      />

      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Eliminar usuario"
        message={
          <>
            ¿Seguro que quieres eliminar a{' '}
            <strong>{userToDelete?.username}</strong>?
          </>
        }
        confirmText={isDeleting ? 'Eliminando...' : 'Eliminar'}
        isLoading={isDeleting}
      />

      <ConfirmDialog
        isOpen={!!userToReset}
        onClose={() => {
          setUserToReset(null);
          setGeneratedPassword(null);
        }}
        onConfirm={
          generatedPassword
            ? () => {
                setUserToReset(null);
                setGeneratedPassword(null);
              }
            : handlePasswordReset
        }
        title={
          generatedPassword ? 'Contraseña Generada' : 'Resetear Contraseña'
        }
        message={
          generatedPassword ? (
            <Box
              sx={{
                mt: 2,
                p: 2,
                bgcolor: 'action.hover',
                borderRadius: 1,
                textAlign: 'center',
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 'bold',
                  color: 'primary.main',
                  fontFamily: 'monospace',
                }}
              >
                {generatedPassword}
              </Typography>
            </Box>
          ) : (
            <>
              ¿Deseas resetear la contraseña de{' '}
              <strong>{userToReset?.username}</strong>?
            </>
          )
        }
        confirmText={generatedPassword ? 'Cerrar' : 'Confirmar'}
        isLoading={isResetting}
      />
    </Box>
  );
};

export default UsuariosView;
