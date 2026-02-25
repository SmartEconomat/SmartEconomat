import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, IconButton, Typography, Button, TextField, MenuItem, Grid, Stack } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

import DataTable, { Column } from '../../components/ui/DataTable';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import RoleBadge from '../../components/ui/RoleBadge';
import StatusChip from '../../components/ui/StatusChip';
import UserModal from './UserModal';
import SelectField from '../../components/ui/SelectField';
import InputField from '../../components/ui/InputField';

import { usuarioService } from '../../services/usuarioService';
import { Usuario, CrearUsuarioDTO, ActualizarUsuarioDTO } from '../../types/usuario';
import { useToast } from '../../store/ToastContext';

const Usuarios: React.FC = () => {
    // Estados principales
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    // Filtros y Paginación
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [filterRol, setFilterRol] = useState('Todos');

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
            const response = await usuarioService.getUsuarios(page, limit, search, filterRol);
            setUsuarios(response.data);
            setTotalPages(response.totalPages);
            setPage(response.page);
        } catch (error: any) {
            toast.error(error.message || 'Error al obtener usuarios');
            setUsuarios([]); // Clear partial data ideally
        } finally {
            setIsLoading(false);
        }
    }, [page, limit, search, filterRol, toast]);

    useEffect(() => {
        fetchUsuarios();
    }, [fetchUsuarios]);

    // Resets paginación al cambiar filtros
    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearch(e.target.value);
        setPage(1);
    };

    const handleRolFilterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilterRol(e.target.value);
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

    const handleSaveUsuario = async (data: CrearUsuarioDTO | ActualizarUsuarioDTO) => {
        setIsSaving(true);
        try {
            if (userToEdit) {
                await usuarioService.actualizarUsuario(Number(userToEdit.id), data as ActualizarUsuarioDTO);
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
        if (userToDelete.rol === 'Administrador' && userToDelete.estado === 'Activo') {
            const adminCount = usuarios.filter(u => u.rol === 'Administrador' && u.estado === 'Activo').length;
            if (adminCount <= 1) {
                toast.error('Operación denegada. No puedes eliminar al último Administrador activo.');
                setIsDeleting(false);
                setUserToDelete(null);
                return;
            }
        }

        setIsDeleting(true);
        try {
            await usuarioService.eliminarUsuario(Number(userToDelete.id));
            toast.success('Usuario eliminado exitosamente');
            // Verificar si debe ir a pág anterior por borrar registro único de pág actual
            if (usuarios.length === 1 && page > 1) {
                setPage(p => p - 1);
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
        { id: 'id', label: 'ID', align: 'center', hiddenOnMobile: true },
        { id: 'nombre', label: 'Nombre' },
        { id: 'email', label: 'Correo', hiddenOnMobile: true },
        {
            id: 'rol',
            label: 'Rol',
            render: (row) => <RoleBadge rol={row.rol} />
        },
        {
            id: 'estado',
            label: 'Estado',
            render: (row) => <StatusChip status={row.estado === 'Activo' ? 'success' : 'default'} label={row.estado} />
        }
    ];

    const renderActions = (row: Usuario) => (
        <>
            <IconButton color="secondary" onClick={() => handleEditUsuarioClick(row)} size="small" aria-label="Editar">
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color="error" onClick={() => setUserToDelete(row)} size="small" aria-label="Borrar">
                <DeleteIcon fontSize="small" />
            </IconButton>
        </>
    );

    return (
        <Box>
            <Paper elevation={0} sx={{ p: 4, mb: 3 }}>
                <Box display="flex" flexWrap="wrap" alignItems="center" justifyContent="space-between" gap={2}>
                    <Box>
                        <Typography variant="h5" component="h1" fontWeight="bold">
                            Gestión de Usuarios
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Mostrando página {page} de {totalPages}
                        </Typography>
                    </Box>
                    <Stack direction="row" spacing={2} flexWrap="wrap">
                        <Button
                            variant="outlined"
                            color="secondary"
                            startIcon={<RefreshIcon />}
                            onClick={fetchUsuarios}
                            aria-label="Refrescar datos"
                        >
                            Refrescar
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            startIcon={<AddIcon />}
                            onClick={handleAddUsuarioClick}
                        >
                            Nuevo Usuario
                        </Button>
                    </Stack>
                </Box>
            </Paper>

            <Paper elevation={0} sx={{ p: 4 }}>
                {/* Filtros */}
                <Box display="flex" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
                    <Box flex={1} minWidth="250px">
                        <InputField
                            id="search-usuarios"
                            fullWidth
                            label="Buscar por nombre o correo..."
                            variant="outlined"
                            size="small"
                            value={search}
                            onChange={handleSearchChange}
                        />
                    </Box>
                    <Box minWidth="200px">
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
                                { value: 'Alumno', label: 'Alumno' }
                            ]}
                        />
                    </Box>
                </Box>

                {/* Tabla */}
                <DataTable
                    columns={columns}
                    data={usuarios}
                    isLoading={isLoading}
                    pagination={{
                        currentPage: page,
                        totalPages: totalPages,
                        onPageChange: (_, newPage) => setPage(newPage)
                    }}
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
                onClose={() => { if (!isDeleting) setUserToDelete(null) }}
                onConfirm={handleDeleteConfirm}
                title="Eliminar usuario"
                message={
                    <>
                        ¿Estás seguro de que deseas eliminar a <strong>{userToDelete?.nombre}</strong> del sistema?<br /><br />
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
