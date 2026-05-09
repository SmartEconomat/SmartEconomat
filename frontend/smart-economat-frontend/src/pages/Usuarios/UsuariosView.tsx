import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { UserStatusEnum } from '../../enums/user-status.enum';
import {
  mapUserStatusBackendToEnum,
  getUserStatusColor,
  getUserStatusLabel,
} from '../../utils/usuario-status.utils';
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
import {
  useDataTable,
  DataTablePaginationProps,
  SortConfig,
  type FilterValue,
} from '../../hooks/useDataTable';

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
import { isElevatedRole } from '../../sherlock-auth/permissions';
import { SYSTEM_ROLES } from '../../sherlock-auth/system-roles.constants';
import { PERMISSIONS } from '../../sherlock-auth/permissions.constants';

// Eliminada función isAdminRole en favor de hasPermission

const UserAccordion = React.memo(
  ({
    title,
    icon,
    data,
    color,
    columns,
    renderActions,
    canEdit,
    handleEditUser,
    paginationProps,
    onSort,
    sortConfig,
    filters,
    onFilter,
  }: {
    title: string;
    icon: React.ReactNode;
    data: Usuario[];
    color: string;
    columns: Column<Usuario>[];
    renderActions: (row: Usuario) => React.ReactNode;
    canEdit: boolean;
    handleEditUser: (row: Usuario) => void;
    paginationProps: DataTablePaginationProps;
    onSort: (key: string) => void;
    sortConfig?: SortConfig;
    filters: Record<string, FilterValue>;
    onFilter: (key: string, value: FilterValue) => void;
  }) => {
    const { t } = useTranslation();
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
              {t(title)} ({paginationProps.totalItems || 0})
            </Typography>
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 0 }}>
          <DataTable
            columns={columns}
            data={data}
            isLoading={false}
            renderActions={renderActions}
            onRowClick={canEdit ? handleEditUser : undefined}
            pagination={paginationProps}
            onSort={onSort}
            sortConfig={sortConfig}
            filters={filters}
            onFilter={onFilter}
            getRowAriaLabel={(row: Usuario) =>
              t('usuarios.aria.filaUsuario', {
                nombre: row.nombre || row.username,
              })
            }
          />
        </AccordionDetails>
      </Accordion>
    );
  }
);

UserAccordion.displayName = 'UserAccordion';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "UsuariosView" en smart-economat-frontend (SPA).
 * @undefined {import("/home/psych/projects/SmartEconomat/frontend/smart-economat-frontend/node_modules/@types/react/jsx-runtime").JSX.Element} Datos efectivos después de ejecutar la operación.
 */
export const UsuariosView: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  // Estados para datos por rol
  const [admins, setAdmins] = useState<Usuario[]>([]);
  const [professors, setProfessors] = useState<Usuario[]>([]);
  const [students, setStudents] = useState<Usuario[]>([]);
  const [roleOptions, setRoleOptions] = useState<RolOption[]>([]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);

  const adminTable = useDataTable({ sortBy: 'username' });
  const professorTable = useDataTable({ sortBy: 'username' });
  const studentTable = useDataTable({ sortBy: 'username' });

  const [isLoading, setIsLoading] = useState(false);

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

  const canList = usePermission(PERMISSIONS.usuarios.listar);
  const canEdit = usePermission(PERMISSIONS.usuarios.editar);
  const canActivate = usePermission(PERMISSIONS.usuarios.activar_desactivar);
  const canDelete = usePermission(PERMISSIONS.usuarios.eliminar);
  const canCreate = usePermission(PERMISSIONS.usuarios.crear);

  useEffect(() => {
    if (canList === false) {
      navigate('/');
    }
  }, [canList, navigate]);

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
      toast.error(t('usuarios.toast.errorCargarRoles'));
    } finally {
      setIsLoadingRoles(false);
    }
  }, [t, toast]);

  const loadUsersByRole = useCallback(
    async () => {
      setIsLoading(true);

      try {
        const [adminRes, professorRes, studentRes] = await Promise.all([
          usuarioService.getUsuarios({
            ...adminTable.queryParams,
            rol: 'ADMIN',
            status: statusFilter || undefined,
          }),
          usuarioService.getUsuarios({
            ...professorTable.queryParams,
            rol: 'PROFESOR',
            status: statusFilter || undefined,
          }),
          usuarioService.getUsuarios({
            ...studentTable.queryParams,
            rol: 'ALUMNO',
            status: statusFilter || undefined,
          }),
        ]);

        setAdmins(adminRes.data);
        setProfessors(professorRes.data);
        setStudents(studentRes.data);

        adminTable.onTotalItemsChange(adminRes.total);
        professorTable.onTotalItemsChange(professorRes.total);
        studentTable.onTotalItemsChange(studentRes.total);
      } catch {
        toast.error(t('usuarios.toast.errorCargar'));
      } finally {
        setIsLoading(false);
      }
    },
    // useDataTable devuelve un objeto nuevo en cada render: queryParams/handlers memo son suficientes
    // eslint-disable-next-line react-hooks/exhaustive-deps -- ver comentario previo
    [
      adminTable.queryParams,
      professorTable.queryParams,
      studentTable.queryParams,
      statusFilter,
      t,
      toast,
    ]
  );

  const fetchAllData = useCallback(async () => {
    await loadUsersByRole();
  }, [loadUsersByRole]);

  useEffect(
    () => {
      // Resetear páginas al cambiar el filtro de estado (handlers estables de useDataTable)
      adminTable.onPageChange(null, 1);
      professorTable.onPageChange(null, 1);
      studentTable.onPageChange(null, 1);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onTotalItems/onPageChange estable; identidad objeto tabla cambia cada render
    [
      statusFilter,
      adminTable.onPageChange,
      professorTable.onPageChange,
      studentTable.onPageChange,
    ]
  );

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
  }, [loadUsersByRole]);

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
          ubicacionesIds: payload.ubicacionesIds ?? [],
          ubicacionId: payload.ubicacionId ?? null,
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
          JSON.stringify(updatePayload.ubicacionesIds ?? []) !==
            JSON.stringify(userToEdit.ubicacionesIds ?? []) ||
          (updatePayload.ubicacionId ?? null) !==
            (userToEdit.ubicacionId ?? null);

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
          if (!canActivate) {
            throw new Error(t('auth.forbidden'));
          }
          const currentStatus = mapUserStatusBackendToEnum(payload.estado);
          const shouldActivate = currentStatus !== UserStatusEnum.ACTIVE;
          await usuarioService.setUserActivation(userToEdit.id, shouldActivate);
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

        toast.success(t('usuarios.toast.actualizado'));
      } else {
        await usuarioService.crearUsuario(data as CrearUsuarioDTO);
        toast.success(t('usuarios.toast.creado'));
      }
      setIsModalOpen(false);
      fetchAllData();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : t('usuarios.toast.errorGuardar');
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
      toast.success(t('usuarios.toast.eliminado'));
      fetchAllData();
    } catch {
      toast.error(t('usuarios.toast.errorEliminar'));
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
      toast.error(t('usuarios.toast.errorReset'));
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
      if (isElevatedRole(currentRol)) {
        return true;
      }
      if (currentRol === SYSTEM_ROLES.PROFESOR)
        return targetUser.rol.toUpperCase() === SYSTEM_ROLES.ALUMNO;
      return false;
    },
    [currentUser]
  );

  const columns = useMemo<Column<Usuario>[]>(
    () => [
      {
        id: 'username',
        label: t('usuarios.columns.usuario'),
        sortable: true,
        sortType: 'string',
        filterable: true,
      },
      {
        id: 'email',
        label: t('usuarios.columns.email'),
        sortable: true,
        sortType: 'string',
        filterable: true,
        hideOnMobile: true,
      },
      {
        id: 'estado',
        label: t('usuarios.columns.estado'),
        align: 'center',
        filterable: true,
        filterType: 'enum',
        filterOptions: [
          { label: t('usuario.status.activo'), value: 'ACTIVE' },
          { label: t('usuario.status.inactivo'), value: 'INACTIVE' },
          { label: t('usuario.status.bloqueado'), value: 'BLOCKED' },
        ],
        render: (row) => (
          <StatusChip
            status={getUserStatusColor(row.estado)}
            label={getUserStatusLabel(t, row.estado)}
          />
        ),
      },
    ],
    [t]
  );

  const renderActions = useCallback(
    (row: Usuario) => (
      <Stack direction="row" spacing={0.5} justifyContent="center">
        {row.id.toString() !== currentUser?.id.toString() && canActivate && (
          <IconButton
            color={
              getUserStatusColor(row.estado) === 'success'
                ? 'warning'
                : 'success'
            }
            onClick={async (e) => {
              e.stopPropagation();
              try {
                const currentStatus = mapUserStatusBackendToEnum(row.estado);
                const shouldActivate = currentStatus !== UserStatusEnum.ACTIVE;
                await usuarioService.setUserActivation(row.id, shouldActivate);
                toast.success(
                  shouldActivate
                    ? t('usuarios.toast.activado')
                    : t('usuarios.toast.suspendido')
                );
                fetchAllData();
              } catch (error) {
                const message =
                  error instanceof Error
                    ? error.message
                    : t('usuarios.toast.errorActualizarEstado');
                toast.error(message);
              }
            }}
            size="small"
            title={
              mapUserStatusBackendToEnum(row.estado) === UserStatusEnum.ACTIVE
                ? t('usuarios.actions.suspender')
                : t('usuarios.actions.activar')
            }
          >
            {mapUserStatusBackendToEnum(row.estado) ===
            UserStatusEnum.ACTIVE ? (
              <BlockIcon fontSize="small" />
            ) : (
              <CheckCircleOutlineIcon fontSize="small" />
            )}
          </IconButton>
        )}
        {canResetTemporaryPassword(row) && canEdit && (
          <IconButton
            color="primary"
            onClick={(e) => {
              e.stopPropagation();
              setUserToReset(row);
            }}
            size="small"
            title={t('usuarios.resetPassword')}
          >
            <VpnKeyIcon fontSize="small" />
          </IconButton>
        )}
        {canEdit && (
          <IconButton
            color="secondary"
            onClick={(e) => {
              e.stopPropagation();
              void handleEditUser(row);
            }}
            disabled={isLoadingUserDetail}
            size="small"
            title={t('comun.editar')}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        )}
        {canDelete && (
          <IconButton
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              setUserToDelete(row);
            }}
            size="small"
            title={t('comun.eliminar')}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        )}
      </Stack>
    ),
    [
      canDelete,
      canEdit,
      canActivate,
      canResetTemporaryPassword,
      currentUser?.id,
      fetchAllData,
      handleEditUser,
      isLoadingUserDetail,
      t,
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
                {t('usuarios.filters.quitar')}
              </Button>
            }
          >
            {focus === 'pending-activation'
              ? t('usuarios.filters.pendientesInfo')
              : t('usuarios.filters.estadoActivo', {
                  estado: getUserStatusLabel(t, statusFilter),
                })}
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
              placeholder={t('usuarios.buscarPlaceholder')}
              size="small"
              value={adminTable.searchTerm}
              onChange={(e) => {
                const val = e.target.value;
                adminTable.onSearchChange(val);
                professorTable.onSearchChange(val);
                studentTable.onSearchChange(val);
              }}
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
              {t('usuarios.actions.refrescar')}
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
                {t('usuarios.actions.nuevoUsuario')}
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
            title="usuarios.roles.administradores"
            icon={<AdminPanelSettingsIcon sx={{ fontSize: 20 }} />}
            data={admins}
            color={ROLE_COLORS.Administrador}
            columns={columns}
            renderActions={renderActions}
            canEdit={canEdit}
            handleEditUser={handleEditUser}
            paginationProps={adminTable.paginationProps}
            onSort={adminTable.onSort}
            sortConfig={adminTable.sortConfig}
            filters={adminTable.filters}
            onFilter={adminTable.onFilter}
          />
          <UserAccordion
            title="usuarios.roles.profesores"
            icon={<SupervisorAccountIcon sx={{ fontSize: 20 }} />}
            data={professors}
            color={ROLE_COLORS.Profesor}
            columns={columns}
            renderActions={renderActions}
            canEdit={canEdit}
            handleEditUser={handleEditUser}
            paginationProps={professorTable.paginationProps}
            onSort={professorTable.onSort}
            sortConfig={professorTable.sortConfig}
            filters={professorTable.filters}
            onFilter={professorTable.onFilter}
          />
          <UserAccordion
            title="usuarios.roles.alumnos"
            icon={<SchoolIcon sx={{ fontSize: 20 }} />}
            data={students}
            color={ROLE_COLORS.Alumno}
            columns={columns}
            renderActions={renderActions}
            canEdit={canEdit}
            handleEditUser={handleEditUser}
            paginationProps={studentTable.paginationProps}
            onSort={studentTable.onSort}
            sortConfig={studentTable.sortConfig}
            filters={studentTable.filters}
            onFilter={studentTable.onFilter}
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
        title={t('usuarios.eliminarUsuario')}
        message={
          <>
            {t('usuarios.confirm.eliminarPregunta')}{' '}
            <strong>{userToDelete?.username}</strong>?
          </>
        }
        confirmText={
          isDeleting ? t('usuarios.confirm.eliminando') : t('comun.eliminar')
        }
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
          generatedPassword
            ? t('usuarios.confirm.contrasenaGenerada')
            : t('usuarios.confirm.resetearContrasena')
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
              {t('usuarios.confirm.resetearPregunta')}{' '}
              <strong>{userToReset?.username}</strong>?
            </>
          )
        }
        confirmText={
          generatedPassword ? t('comun.cerrar') : t('comun.confirmar')
        }
        isLoading={isResetting}
      />
    </Box>
  );
};

const MemoizedUsuariosView = React.memo(UsuariosView);

export default MemoizedUsuariosView;
