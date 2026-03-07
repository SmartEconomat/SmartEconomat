import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Button,
  TextField,
  MenuItem,
  Grid,
  Stack,
  Card,
  CardContent,
  Divider,
  CardActions,
  Avatar,
  Alert,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

import DataTable, { Column } from '../../components/ui/DataTable';
import PageToolbar from '../../components/ui/PageToolbar';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import RoleBadge from '../../components/ui/RoleBadge';
import StatusChip from '../../components/ui/StatusChip';
import UserModal from './UserModal';
import SelectField from '../../components/ui/SelectField';

import { usuarioService } from '../../services/usuarioService';
import {
  Usuario,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
} from '../../types/usuario';
import { useToast } from '../../store/ToastContext';

const Usuarios: React.FC = () => {
  // Estados principales
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filtros y Paginación
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(8);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [search, setSearch] = useState('');
  const [filterRol, setFilterRol] = useState('Todos');
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modales y acciones
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<Usuario | null>(null);
  const [userToDelete, setUserToDelete] = useState<Usuario | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const toast = useToast();

  // Cargar datos
  const fetchUsuarios = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await usuarioService.getUsuarios(
        page,
        limit,
        search,
        filterRol,
        sortBy,
        sortOrder
      );
      setUsuarios(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
      setPage(response.page);
    } catch (error: any) {
      toast.error(error.message || 'Error al obtener usuarios');
      setUsuarios([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, search, filterRol, sortBy, sortOrder, toast]);

  useEffect(() => {
    fetchUsuarios();
  }, [fetchUsuarios]);

  // Resets paginación al cambiar filtros
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleRolFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilterRol(e.target.value);
    setPage(1);
  };

  const handleSort = (key: keyof Usuario | string) => {
    const isAsc = sortBy === key && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(key as string);
    setPage(1);
  };

  // Acciones CRUD
  const handleAddUsuarioClick = () => {
    setUserToEdit(null);
    setIsModalOpen(true);
  };

  const handleEditUsuarioClick = (user: Usuario) => {
    setUserToEdit(user);
    setIsModalOpen(true);
  };

  const handleSaveUsuario = async (
    data: CrearUsuarioDTO | ActualizarUsuarioDTO
  ) => {
    setIsSaving(true);
    try {
      if (userToEdit) {
        await usuarioService.actualizarUsuario(
          userToEdit.id,
          data as ActualizarUsuarioDTO
        );
        toast.success('Usuario actualizado exitosamente');
      } else {
        await usuarioService.crearUsuario(data as CrearUsuarioDTO);
        toast.success('Usuario creado exitosamente');
      }
      setIsModalOpen(false);
      fetchUsuarios(); // Recargar datos locales
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar el usuario');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    // Prevent deleting the last administrator
    if (
      userToDelete.rol === 'Administrador' &&
      userToDelete.estado === 'Activo'
    ) {
      const adminCount = usuarios.filter(
        (u) => u.rol === 'Administrador' && u.estado === 'Activo'
      ).length;
      if (adminCount <= 1) {
        toast.error(
          'Operación denegada. No puedes eliminar al último Administrador activo.'
        );
        setIsDeleting(false);
        setUserToDelete(null);
        return;
      }
    }

    setIsDeleting(true);
    try {
      await usuarioService.eliminarUsuario(userToDelete.id);
      toast.success('Usuario eliminado exitosamente');
      // Verificar si debe ir a pág anterior por borrar registro único de pág actual
      if (usuarios.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        fetchUsuarios();
      }
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar el usuario');
    } finally {
      setIsDeleting(false);
      setUserToDelete(null);
    }
  };

  // Configuración de tabla
  const columns: Column<Usuario>[] = [
    { id: 'id', label: 'ID', hideOnMobile: true, sortable: true },
    { id: 'username', label: 'Usuario', sortable: true },
    { id: 'email', label: 'Correo', hideOnMobile: true, sortable: true },
    {
      id: 'rol',
      label: 'Rol',
      align: 'center',
      sortable: true,
      render: (row) => <RoleBadge rol={row.rol} />,
    },
    {
      id: 'estado',
      label: 'Estado',
      sortable: true,
      render: (row) => (
        <StatusChip
          status={row.estado === 'Activo' ? 'success' : 'default'}
          label={row.estado}
        />
      ),
    },
  ];

  const renderActions = (row: Usuario) => (
    <>
      <IconButton
        color="secondary"
        onClick={() => handleEditUsuarioClick(row)}
        size="small"
        aria-label="Editar"
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        color="error"
        onClick={() => setUserToDelete(row)}
        size="small"
        aria-label="Borrar"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </>
  );

  return (
    <Box>
      <PageToolbar
        title="Gestión de Usuarios"
        searchValue={search}
        onSearchChange={handleSearchChange}
        searchPlaceholder="Buscar por nombre o correo..."
        searchId="search-usuarios"
        totalItems={totalItems}
        totalItemsLabel="usuarios"
        primaryAction={{
          label: 'Nuevo Usuario',
          onClick: handleAddUsuarioClick,
          id: 'btn-nuevo-usuario',
        }}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pageSize={limit}
        pageSizeOptions={[8, 16, 32]}
        onPageSizeChange={(e: any) => {
          setLimit(Number(e.target.value));
          setPage(1);
        }}
        filters={
          <SelectField
            id="filter-rol-select"
            fullWidth
            label="Filtrar por Rol"
            variant="outlined"
            size="small"
            value={filterRol}
            onChange={handleRolFilterChange as any}
            options={[
              { value: 'Todos', label: 'Todos' },
              { value: 'Administrador', label: 'Administrador' },
              { value: 'Profesor', label: 'Profesor' },
              { value: 'Alumno', label: 'Alumno' },
            ]}
            sx={{ minWidth: 200 }}
          />
        }
      />

      <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
        <DataTable
          columns={columns}
          data={usuarios}
          isLoading={isLoading}
          hideTopBar
          viewMode={viewMode}
          defaultViewMode={viewMode}
          sortConfig={
            sortBy ? { key: sortBy, direction: sortOrder } : undefined
          }
          onSort={handleSort}
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            onPageChange: (_, newPage) => setPage(newPage),
            pageSize: limit,
            pageSizeOptions: [8, 16, 32],
            onPageSizeChange: (e: any) => {
              setLimit(Number(e.target.value));
              setPage(1);
            },
          }}
          renderGridItem={(usuario) => (
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
              }}
            >
              <CardContent
                sx={{
                  flexGrow: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  pt: 3,
                }}
              >
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    mb: 2,
                    bgcolor: 'primary.main',
                    fontSize: '1.5rem',
                  }}
                >
                  {usuario.username.substring(0, 2).toUpperCase()}
                </Avatar>
                <Typography
                  gutterBottom
                  variant="h6"
                  component="div"
                  align="center"
                  sx={{ fontWeight: 600 }}
                >
                  {usuario.username}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  gutterBottom
                  align="center"
                >
                  {usuario.email}
                </Typography>
                <Box sx={{ mt: 2, mb: 1 }}>
                  <RoleBadge rol={usuario.rol} />
                </Box>
                <Box sx={{ mt: 'auto', pt: 2 }}>
                  <StatusChip
                    status={usuario.estado === 'Activo' ? 'success' : 'default'}
                    label={usuario.estado}
                    size="small"
                  />
                </Box>
              </CardContent>
              <Divider />
              <CardActions
                sx={{
                  justifyContent: 'center',
                  p: 1.5,
                  bgcolor: 'action.hover',
                }}
              >
                {renderActions(usuario)}
              </CardActions>
            </Card>
          )}
          renderActions={renderActions}
        />
      </Paper>

      {/* Modal para Crear/Establecer Usuario */}
      <UserModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        userToEdit={userToEdit}
        onSave={handleSaveUsuario}
        isSaving={isSaving}
        usuariosList={usuarios}
      />

      {/* Diálogo de Confirmación Borrado */}
      <ConfirmDialog
        isOpen={!!userToDelete}
        onClose={() => {
          if (!isDeleting) setUserToDelete(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Eliminar usuario"
        message={
          <>
            ¿Estás seguro de que deseas eliminar a{' '}
            <strong>{userToDelete?.username}</strong> del sistema?
            <br />
            <br />
            Esta acción no se puede deshacer de forma sencilla.
          </>
        }
        confirmText={isDeleting ? 'Eliminando...' : 'Eliminar Usuario'}
        cancelText="Cancelar"
      />
    </Box>
  );
};

export default Usuarios;
