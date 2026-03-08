import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Alert, Button, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, { DynamicField } from '../components/ui/DynamicFormModal';
import DetailModal from '../components/ui/DetailModal';
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
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<string | undefined>('nombre');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
    const [data, setData] = useState<Proveedor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Proveedor | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Record<string, any> | null>(null);
    const [itemToView, setItemToView] = useState<Proveedor | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const proveedoresData = await fetchProveedores(page, pageSize, searchTerm, sortBy, sortOrder);
            setData(proveedoresData.data);
            setTotalPages(proveedoresData.totalPages);
            setTotalItems(proveedoresData.total || proveedoresData.data.length);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar proveedores.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, pageSize, searchTerm, sortBy, sortOrder]);

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

    const handleViewClick = (row: Proveedor) => {
        setItemToView(row);
    };

    const handleSort = (key: string | keyof Proveedor) => {
        const isAsc = sortBy === key && sortOrder === 'asc';
        setSortOrder(isAsc ? 'desc' : 'asc');
        setSortBy(key as string);
    };

    const columns: Column<Proveedor>[] = [
        { id: 'nombre', label: 'Nombre', sortable: true },
        {
            id: 'nif',
            label: 'NIF',
            render: (row) => row.nif ?? '—',
            sortable: true,
            responsiveDisplay: { xs: 'none', md: 'table-cell' }
        },
        {
            id: 'contacto',
            label: 'Contacto',
            render: (row) => row.contacto ?? '—',
            responsiveDisplay: { xs: 'none', md: 'table-cell' },
            sortable: true,
        },
        {
            id: 'telefono',
            label: 'Teléfono',
            render: (row) => row.telefono ?? '—',
            sortable: true,
            responsiveDisplay: { xs: 'none', sm: 'table-cell' }
        },
        {
            id: 'email',
            label: 'Email',
            render: (row) => row.email ?? '—',
            sortable: true,
            responsiveDisplay: { xs: 'none', lg: 'table-cell' }
        },
    ];

    const renderActions = (row: Proveedor) => (
        <>
            <Tooltip title="Ver detalle">
                <IconButton onClick={() => handleViewClick(row)} size="small" aria-label="Ver detalle" sx={{ color: 'text.secondary' }}>
                    <VisibilityIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Editar">
                <IconButton color="secondary" onClick={() => handleEditClick(row)} size="small" aria-label="Editar">
                    <EditIcon fontSize="small" />
                </IconButton>
            </Tooltip>
            <Tooltip title="Eliminar">
                <IconButton color="error" onClick={() => setItemToDelete(row)} size="small" aria-label="Borrar">
                    <DeleteIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </>
    );

    return (
        <Box>
            <PageToolbar
                title="Gestión de Proveedores"
                searchValue={searchTerm}
                onSearchChange={(v) => { setSearchTerm(v); setPage(1); }}
                searchPlaceholder="Buscar por nombre, NIF, contacto, email..."
                searchId="search-proveedores"
                totalItems={totalItems}
                totalItemsLabel="proveedores"
                primaryAction={{
                    label: 'Nuevo Proveedor',
                    onClick: () => setItemToEdit({}),
                    id: 'btn-nuevo-proveedor',
                }}
                pageSize={pageSize}
                onPageSizeChange={(e: any) => {
                    setPageSize(Number(e.target.value));
                    setPage(1);
                }}
            />

            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2 }}>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}

                <DataTable
                    columns={columns}
                    data={data}
                    isLoading={isLoading}
                    hideTopBar
                    onSort={handleSort}
                    sortConfig={{ key: sortBy || '', direction: sortOrder }}
                    defaultViewMode="list"
                    emptyStateMessage={
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <StorefrontOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                {searchTerm.trim()
                                    ? 'No hay proveedores que coincidan con tu búsqueda'
                                    : 'No se encontraron proveedores'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                {searchTerm.trim()
                                    ? 'Prueba con otros términos o limpia el filtro.'
                                    : 'Empieza añadiendo el primer proveedor a tu catálogo.'}
                            </Typography>
                            {!searchTerm.trim() && (
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => setItemToEdit({})}
                                >
                                    Añadir Proveedor
                                </Button>
                            )}
                        </Box>
                    }
                    pagination={{
                        currentPage: page,
                        totalPages: totalPages,
                        onPageChange: (_, newPage) => setPage(newPage),
                        pageSize: pageSize,
                        pageSizeOptions: [5, 10, 25, 50],
                        onPageSizeChange: (e: any) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                        },
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
                    confirmText="Sí, eliminar"
                    cancelText="Cancelar"
                    isLoading={isDeleting}
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
                    requireConfirmation={true}
                    confirmationMessage={
                        itemToEdit?.id
                            ? "¿Estás seguro de que deseas guardar los cambios realizados en este proveedor?"
                            : "¿Estás seguro de que deseas añadir este nuevo proveedor al sistema?"
                    }
                />

                <DetailModal
                    isOpen={!!itemToView}
                    onClose={() => setItemToView(null)}
                    title={itemToView?.nombre || ''}
                    subtitle={itemToView?.nif || undefined}
                    size="md"
                    editLabel="Editar proveedor"
                    onEdit={() => {
                        if (itemToView) {
                            handleEditClick(itemToView);
                            setItemToView(null);
                        }
                    }}
                    sections={[
                        {
                            title: 'Información Fiscal',
                            fields: [
                                { label: 'Razón Social', value: itemToView?.nombre },
                                { label: 'NIF / CUIT', value: itemToView?.nif },
                            ]
                        },
                        {
                            title: 'Contacto',
                            fields: [
                                { label: 'Persona de Contacto', value: itemToView?.contacto },
                                { label: 'Teléfono', value: itemToView?.telefono },
                                { label: 'Email', value: itemToView?.email, fullWidth: true },
                            ]
                        },
                        {
                            title: 'Ubicación',
                            fields: [
                                { label: 'Dirección', value: itemToView?.direccion, fullWidth: true },
                            ]
                        }
                    ]}
                />
            </Paper>
        </Box>
    );
};

export default Proveedores;