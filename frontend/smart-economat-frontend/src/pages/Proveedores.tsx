import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Alert, Button, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, { DynamicField } from '../components/ui/DynamicFormModal';
import { Proveedor } from '../services/proveedor.types';
import { fetchProveedores, createProveedor, updateProveedor } from '../services/proveedor.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/ToastContext';

import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import AddIcon from '@mui/icons-material/Add';

const proveedorSchema: DynamicField[] = [
    { name: 'nif', label: 'NIF / CUIT', required: true, width: 4 },
    { name: 'nombre', label: 'Razón Social', required: true, width: 8 },
    { name: 'contacto', label: 'Persona de Contacto' },
    { name: 'telefono', label: 'Teléfono', width: 6 },
    { name: 'email', label: 'Email', type: 'text', width: 6 },
    { name: 'direccion', label: 'Dirección' }
];

const Proveedores: React.FC = () => {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Proveedor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Proveedor | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Record<string, any> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const proveedoresData = await fetchProveedores();
            setData(proveedoresData);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar proveedores.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setIsDeleting(true);
        try {
            await deleteResource(`/proveedor/${itemToDelete.id}`);
            setData((prev) => prev.filter((p) => p.id !== itemToDelete.id));
            toast.success(`Proveedor "${itemToDelete.nombre}" eliminado correctamente.`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al eliminar el proveedor.';
            toast.error(message);
        } finally {
            setIsDeleting(false);
            setItemToDelete(null);
        }
    };

    const handleSave = async (formData: Record<string, any>) => {
        setIsSaving(true);
        try {
            // Limpiar datos para el backend
            const payload = {
                nombre: formData.nombre,
                contacto: formData.contacto,
                telefono: formData.telefono,
                email: formData.email,
                direccion: formData.direccion,
                nif: formData.nif,
            };

            if (formData.id) {
                await updateProveedor(formData.id, payload);
                toast.success('Proveedor actualizado correctamente.');
            } else {
                await createProveedor(payload);
                toast.success('Proveedor creado correctamente.');
            }
            await loadData();
            setItemToEdit(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al guardar el proveedor.';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (row: Proveedor) => {
        setItemToEdit({ ...row });
    };

    const columns: Column<Proveedor>[] = [
        { id: 'nombre', label: 'Nombre' },
        {
            id: 'nif',
            label: 'NIF',
            render: (row) => row.nif ?? '—',
        },
        {
            id: 'contacto',
            label: 'Contacto',
            render: (row) => row.contacto ?? '—',
            hideOnMobile: true,
        },
        {
            id: 'telefono',
            label: 'Teléfono',
            render: (row) => row.telefono ?? '—',
            hideOnMobile: true,
        },
        {
            id: 'email',
            label: 'Email',
            render: (row) => row.email ?? '—',
            hideOnMobile: true,
        },
    ];

    const renderActions = (row: Proveedor) => (
        <>
            <IconButton color="secondary" onClick={() => handleEditClick(row)} size="small" aria-label="Editar">
                <EditIcon fontSize="small" />
            </IconButton>
            <IconButton color="error" onClick={() => setItemToDelete(row)} size="small" aria-label="Borrar">
                <DeleteIcon fontSize="small" />
            </IconButton>
        </>
    );

    return (
        <Box>
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                        Gestión de Proveedores
                    </Typography>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setItemToEdit({})}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        Nuevo Proveedor
                    </Button>

                    <Tooltip title="Nuevo Proveedor">
                        <IconButton
                            color="primary"
                            onClick={() => setItemToEdit({})}
                            sx={{
                                display: { xs: 'inline-flex', sm: 'none' },
                                bgcolor: 'primary.main',
                                color: 'white',
                                '&:hover': { bgcolor: 'primary.dark' }
                            }}
                        >
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <DataTable
                    columns={columns}
                    data={data}
                    isLoading={isLoading}
                    emptyStateMessage={
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <StorefrontOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No se encontraron proveedores
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Empieza añadiendo el primer proveedor a tu catálogo.
                            </Typography>
                            <Button 
                                variant="outlined" 
                                startIcon={<AddIcon />}
                                onClick={() => setItemToEdit({})}
                            >
                                Añadir Proveedor
                            </Button>
                        </Box>
                    }
                    pagination={{
                        currentPage: page,
                        totalPages: 1,
                        onPageChange: (_, newPage) => setPage(newPage),
                    }}
                    renderActions={renderActions}
                />

                <ConfirmDialog
                    isOpen={!!itemToDelete}
                    onClose={() => !isDeleting && setItemToDelete(null)}
                    onConfirm={() => void handleDeleteConfirm()}
                    title="Eliminar proveedor"
                    message={
                        <>
                            ¿Estás seguro de que deseas eliminar el proveedor{' '}
                            <strong>{itemToDelete?.nombre}</strong>?{' '}
                            Esta acción no se puede deshacer.
                        </>
                    }
                    confirmText={isDeleting ? 'Eliminando…' : 'Sí, eliminar'}
                    cancelText="Cancelar"
                />

                <DynamicFormModal
                    isOpen={!!itemToEdit}
                    onClose={() => setItemToEdit(null)}
                    title={itemToEdit?.id ? `Editar: ${itemToEdit.nombre || ''}` : "Crear Nuevo Proveedor"}
                    size="md"
                    fields={proveedorSchema}
                    initialData={itemToEdit || {}}
                    onSubmit={handleSave}
                    isSubmitting={isSaving}
                />
            </Paper>
        </Box>
    );
};

export default Proveedores;