import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
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
  TextField,
  InputAdornment,
  SelectChangeEvent,
} from '@mui/material';
import ListSkeleton from '../../components/ui/ListSkeleton';
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
import { useNavigate, useSearchParams } from 'react-router-dom';

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
import { useAuth, usePermission } from '../../store/auth.hooks';

// Eliminada función isAdminRole en favor de hasPermission

const updatePaginationTotal = (
  current: { total: number; page: number; limit: number },
  nextTotal: number
) => {
  if (current.total === nextTotal) {
    return current;
  }

  return { ...current, total: nextTotal };
};

const UserAccordion = React.memo(
  ({
    title,
    icon,
    data,
    role,
    color,
    rolePagination,
    columns,
    renderActions,
    setPagination,
  }: {
    title: string;
    icon: React.ReactNode;
    data: Usuario[];
    role: 'admin' | 'professor' | 'student';
    color: string;
    rolePagination: { total: number; page: number; limit: number };
    columns: Column<Usuario>[];
    renderActions: (row: Usuario) => React.ReactNode;
    setPagination: React.Dispatch<
      React.SetStateAction<{
        admin: { total: number; page: number; limit: number };
        professor: { total: number; page: number; limit: number };
        student: { total: number; page: number; limit: number };
      }>
    >;
  }) => (
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
          <Avatar sx={{ bgcolor: color, width: 32, height: 32 }}>{icon}</Avatar>
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
              pageSizeOptions: [10, 20, 50],
            }}
          />
        )}
      </AccordionDetails>
    </Accordion>
  )
);

UserAccordion.displayName = 'UserAccordion';

const UsuariosView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Estados para datos por rol
  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [professors, setProfessors] = useState<Usuario[]>([]);
  const [students, setStudents] = useState<Usuario[]>([]);
  const [roleOptions, setRoleOptions] = useState<RolOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  // Metadatos de paginación para cada rol
  const [pagination, setPagination] = useState({
    admin: { total: 0, page: 1, limit: 20 },
    professor: { total: 0, page: 1, limit: 20 },
    student: { total: 0, page: 1, limit: 20 },
  });

  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Estados para modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Usuario | null>(null);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [userToReset, setUserToReset] = useState<Usuario | null>(null);
  const [isLoadingUserDetail, setIsLoadingUserDetail] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(
    null
  );
  const statusFilter = searchParams.get('estado')?.trim() || '';
  const focus = searchParams.get('focus');

  const toast = useToast();
  const { user: currentUser, refreshUser } = useAuth();

  const canList = usePermission('usuarios:listar');
  const canEdit = usePermission('usuarios:editar');
  const canDelete = usePermission('usuarios:eliminar');
  const canCreate = usePermission('usuarios:crear');

  useEffect(() => {
    if (canList === false) {
      navigate('/');
    }
  }, [canList, navigate]);

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
    setIsLoadingRoles(true);
    try {
      const response = await usuarioService.getRoles();
      setRoleOptions((prev) => {
        const nextSerialized = JSON.stringify(response.data);
        const prevSerialized = JSON.stringify(prev);
        return prevSerialized === nextSerialized ? prev : response.data;
      });
    } catch {
      toast.error('Error al cargar los roles disponibles');
    } finally {
      setIsLoadingRoles(false);
    }
  }, [toast]);

  const loadUsersByRole = useCallback(async () => {
    setIsLoading(true);

    try {
      const currentPagination = paginationRef.current;
      const [adminRes, professorRes, studentRes] = await Promise.all([
        usuarioService.getUsuarios(
          currentPagination.admin.page,
          currentPagination.admin.limit,
          debouncedSearch,
          'ADMIN',
          undefined,
          undefined,
          statusFilter || undefined
        ),
        usuarioService.getUsuarios(
          currentPagination.professor.page,
          currentPagination.professor.limit,
          debouncedSearch,
          'PROFESOR',
          undefined,
          undefined,
          statusFilter || undefined
        ),
        usuarioService.getUsuarios(
          currentPagination.student.page,
          currentPagination.student.limit,
          debouncedSearch,
          'ALUMNO',
          undefined,
          undefined,
          statusFilter || undefined
        ),
      ]);

      setAdmins(adminRes.data);
      setProfessors(professorRes.data);
      setStudents(studentRes.data);
      setPagination((prev) => ({
        admin: updatePaginationTotal(prev.admin, adminRes.total),
        professor: updatePaginationTotal(prev.professor, professorRes.total),
        student: updatePaginationTotal(prev.student, studentRes.total),
      }));
    } catch {
      toast.error('Error al cargar los usuarios');
    } finally {
      setIsLoading(false);
    }
  }, [debouncedSearch, statusFilter, toast]);

  const fetchAllData = useCallback(async () => {
    await loadUsersByRole();
  }, [loadUsersByRole]);

  useEffect(() => {
    setPagination((prev) => ({
      admin: { ...prev.admin, page: 1 },
      professor: { ...prev.professor, page: 1 },
      student: { ...prev.student, page: 1 },
    }));
  }, [statusFilter]);

  const clearNotificationFilters = () => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('estado');
    nextParams.delete('focus');
    setSearchParams(nextParams, { replace: true });
  };

  const ensureRolesLoaded = useCallback(async () => {
    if (roleOptions.length > 0) {
      return;
    }

    await loadRoles();
  }, [roleOptions.length, loadRoles]);

  const handleEditUser = useCallback(
    async (row: Usuario) => {
      setIsLoadingUserDetail(true);
      setUserToEdit(row);
      setIsModalOpen(true);

      try {
        await ensureRolesLoaded();
        const response = await usuarioService.getUsuarioById(row.id);
        setUserToEdit(response.data);
      } catch (error) {
        console.warn(
          'No se pudo cargar el detalle completo del usuario',
          error
        );
      } finally {
        setIsLoadingUserDetail(false);
      }
    },
    [ensureRolesLoaded]
  );

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    void ensureRolesLoaded();
  }, [isModalOpen, ensureRolesLoaded]);

  useEffect(() => {
    void loadUsersByRole();
  }, [
    pagination.admin.page,
    pagination.admin.limit,
    pagination.professor.page,
    pagination.professor.limit,
    pagination.student.page,
    pagination.student.limit,
    loadUsersByRole,
  ]);

  const handleSaveUsuario = async (
    data: CrearUsuarioDTO | ActualizarUsuarioDTO
  ) => {
    setIsSaving(true);
    try {
      if (userToEdit) {
        const payload = data as ActualizarUsuarioDTO;
        const updatePayload: ActualizarUsuarioDTO = {
          username: payload.username,
          email: payload.email,
          nombre: payload.nombre,
          slotId: payload.slotId,
          ubicacionId: payload.ubicacionId,
        };
        const previousRoleId = userToEdit.roleId || '';
        const previousStatus = userToEdit.estado;
        const previousAdicionales = [
          ...(userToEdit.permisosAdicionales?.map((permiso) => permiso.id) ||
            []),
        ].sort();
        const previousExcluidos = [
          ...(userToEdit.permisosExcluidos?.map((permiso) => permiso.id) || []),
        ].sort();
        const nextAdicionales = [
          ...(payload.permisosAdicionalesIds || []),
        ].sort();
        const nextExcluidos = [...(payload.permisosExcluidosIds || [])].sort();
        const roleChanged =
          !!payload.roleId && payload.roleId !== previousRoleId;
        const additionalPermissionsChanged =
          JSON.stringify(previousAdicionales) !==
          JSON.stringify(nextAdicionales);
        const excludedPermissionsChanged =
          JSON.stringify(previousExcluidos) !== JSON.stringify(nextExcluidos);
        const profileChanged =
          updatePayload.username !== userToEdit.username ||
          (updatePayload.email ?? '') !== (userToEdit.email ?? '') ||
          updatePayload.nombre !== userToEdit.nombre ||
          updatePayload.slotId !== userToEdit.slotId ||
          updatePayload.ubicacionId !== userToEdit.ubicacionId;

        if (profileChanged) {
          await usuarioService.actualizarUsuario(userToEdit.id, updatePayload);
        }

        if (
          payload.roleId &&
          (roleChanged ||
            additionalPermissionsChanged ||
            excludedPermissionsChanged)
        ) {
          await usuarioService.updateUserRole(
            userToEdit.id,
            payload.roleId,
            payload.permisosAdicionalesIds,
            payload.permisosExcluidosIds
          );
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
          if (!refreshed || !canList) {
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

  const canResetTemporaryPassword = useCallback(
    (targetUser: Usuario): boolean => {
      if (!currentUser) return false;
      const currentRol = currentUser.rol.toUpperCase();
      if (targetUser.id.toString() === currentUser.id.toString()) return false;
      if (currentRol === 'ADMIN' || currentRol === 'ADMINISTRADOR') {
        return true;
      }
      if (currentRol === 'PROFESOR') return targetUser.rol === 'Alumno';
      return false;
    },
    [currentUser]
  );

  const columns = useMemo<Column<Usuario>[]>(
    () => [
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
    ],
    []
  );

  const renderActions = useCallback(
    (row: Usuario) => (
      <Stack direction="row" spacing={0.5} justifyContent="center">
        {row.id.toString() !== currentUser?.id.toString() && canEdit && (
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
        {canResetTemporaryPassword(row) && canEdit && (
          <IconButton
            color="primary"
            onClick={() => setUserToReset(row)}
            size="small"
            title="Reset Password"
          >
            <VpnKeyIcon fontSize="small" />
          </IconButton>
        )}
        {canEdit && (
          <IconButton
            color="secondary"
            onClick={() => void handleEditUser(row)}
            disabled={isLoadingUserDetail}
            size="small"
            title="Editar"
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {canDelete && (
          <IconButton
            color="error"
            onClick={() => setUserToDelete(row)}
            size="small"
            title="Eliminar"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    ),
    [
      canDelete,
      canEdit,
      canResetTemporaryPassword,
      currentUser?.id,
      fetchAllData,
      handleEditUser,
      isLoadingUserDetail,
      toast,
    ]
  );

  const usuariosList = useMemo(
    () => [...admins, ...professors, ...students],
    [admins, professors, students]
  );

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
        {statusFilter ? (
          <Alert
            severity="info"
            sx={{ mb: 2 }}
            action={
              <Button
                color="inherit"
                size="small"
                onClick={clearNotificationFilters}
              >
                Quitar filtro
              </Button>
            }
          >
            {focus === 'pending-activation'
              ? 'Mostrando usuarios pendientes de activación abiertos desde notificaciones.'
              : `Filtro de estado activo: ${statusFilter}.`}
          </Alert>
        ) : null}

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
            {canCreate && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  void ensureRolesLoaded();
                  setUserToEdit(null);
                  setIsModalOpen(true);
                }}
                sx={{ px: 3, borderRadius: 2 }}
              >
                Nuevo Usuario
              </Button>
            )}
          </Stack>
        </Box>
      </Paper>

      {isLoading ? (
        <Box>
          <ListSkeleton type="accordion" count={3} />
        </Box>
      ) : (
        <Box>
          <UserAccordion
            title="Administradores"
            icon={<AdminPanelSettingsIcon sx={{ fontSize: 20 }} />}
            data={admins}
            role="admin"
            color={ROLE_COLORS.Administrador}
            rolePagination={pagination.admin}
            columns={columns}
            renderActions={renderActions}
            setPagination={setPagination}
          />
          <UserAccordion
            title="Profesores"
            icon={<SupervisorAccountIcon sx={{ fontSize: 20 }} />}
            data={professors}
            role="professor"
            color={ROLE_COLORS.Profesor}
            rolePagination={pagination.professor}
            columns={columns}
            renderActions={renderActions}
            setPagination={setPagination}
          />
          <UserAccordion
            title="Alumnos"
            icon={<SchoolIcon sx={{ fontSize: 20 }} />}
            data={students}
            role="student"
            color={ROLE_COLORS.Alumno}
            rolePagination={pagination.student}
            columns={columns}
            renderActions={renderActions}
            setPagination={setPagination}
          />
        </Box>
      )}

      <UserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        onSave={handleSaveUsuario}
        isSaving={isSaving || isLoadingUserDetail}
        isLoadingContent={isLoadingUserDetail}
        usuariosList={usuariosList}
        roleOptions={roleOptions}
        isLoadingRoles={isLoadingRoles}
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

export default React.memo(UsuariosView);
