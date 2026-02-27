import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Alert, Button, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, { DynamicField } from '../components/ui/DynamicFormModal';
import { Pedido, EstadoPedido } from '../services/pedido.types';
import { fetchPedidos, createPedido, updatePedido } from '../services/pedido.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/ToastContext';
import StatusChip from '../components/ui/StatusChip';

import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import AddIcon from '@mui/icons-material/Add';

const pedidoSchema: DynamicField[] = [
    { name: 'costeTotal', label: 'Coste Total (€)', type: 'number', required: true, width: 4 },
    { 
        name: 'estado', 
        label: 'Estado del Pedido', 
        type: 'select', 
        required: true, 
        width: 4,
        options: [
            { value: EstadoPedido.PENDIENTE, label: 'Pendiente' },
            { value: EstadoPedido.EN_PROCESO, label: 'En Proceso' },
            { value: EstadoPedido.RECIBIDO, label: 'Recibido' },
            { value: EstadoPedido.PARCIAL, label: 'Parcial' },
            { value: EstadoPedido.INCIDENCIA, label: 'Incidencia' },
            { value: EstadoPedido.CANCELADO, label: 'Cancelado' }
        ]
    },
    { name: 'fechaEntrega', label: 'Fecha de Entrega', type: 'date', width: 4 },
    { name: 'motivoCancelacion', label: 'Motivo de Cancelación (Si aplica)', type: 'text', width: 12 }
];

const Pedidos: React.FC = () => {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Pedido[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Pedido | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Record<string, any> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const dataLoad = await fetchPedidos();
            setData(dataLoad);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar pedidos.';
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
            await deleteResource(`/pedidos/${itemToDelete.id}`);
            setData((prev) => prev.filter((p) => p.id !== itemToDelete.id));
            toast.success(`Pedido eliminado correctamente.`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al eliminar el pedido.';
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
                costeTotal: formData.costeTotal ? Number(formData.costeTotal) : undefined,
                estado: formData.estado,
                fechaEntrega: formData.fechaEntrega,
                motivoCancelacion: formData.motivoCancelacion,
            };

            if (formData.id) {
                await updatePedido(formData.id, payload);
                toast.success('Pedido actualizado correctamente.');
            } else {
                await createPedido(payload);
                toast.success('Pedido creado correctamente.');
            }
            await loadData();
            setItemToEdit(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al guardar el pedido.';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (row: Pedido) => {
        setItemToEdit({ ...row });
    };

    const columns: Column<Pedido>[] = [
        { 
            id: 'fechaPedido', 
            label: 'Fecha Pedido',
            render: (row) => row.fechaPedido ? new Date(row.fechaPedido).toLocaleDateString() : '—'
        },
        { 
            id: 'fechaEntrega', 
            label: 'Fecha Entrega',
            render: (row) => row.fechaEntrega ? new Date(row.fechaEntrega).toLocaleDateString() : '—',
            hideOnMobile: true,
        },
        {
            id: 'costeTotal',
            label: 'Coste Total',
            align: 'right',
            render: (row) => `${Number(row.costeTotal).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`,
        },
        {
            id: 'estado',
            label: 'Estado',
            render: (row) => <StatusChip status={row.estado} />,
        },
        {
            id: 'usuario',
            label: 'Creado Por',
            render: (row) => row.usuario?.nombre ?? '—',
            hideOnMobile: true,
        }
    ];

    const renderActions = (row: Pedido) => (
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
                        Gestión de Pedidos
                    </Typography>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setItemToEdit({})}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        Nuevo Pedido
                    </Button>

                    <Tooltip title="Nuevo Pedido">
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
                            <LocalShippingOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No se encontraron pedidos
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Empieza registrando un nuevo pedido al catálogo de proveedores.
                            </Typography>
                            <Button 
                                variant="outlined" 
                                startIcon={<AddIcon />}
                                onClick={() => setItemToEdit({})}
                            >
                                Registrar Pedido
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
                    title="Eliminar pedido"
                    message={
                        <>
                            ¿Estás seguro de que deseas eliminar el pedido del {' '}
                            <strong>{itemToDelete?.fechaPedido ? new Date(itemToDelete.fechaPedido).toLocaleDateString() : ''}</strong>?{' '}
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
                    title={itemToEdit?.id ? `Editar Pedido` : "Crear Nuevo Pedido"}
                    size="md"
                    fields={pedidoSchema}
                    initialData={itemToEdit || {}}
                    onSubmit={handleSave}
                    isSubmitting={isSaving}
                    requireConfirmation={true}
                    confirmationMessage={
                        itemToEdit?.id
                            ? "¿Estás seguro de que deseas guardar los cambios en este pedido?"
                            : "¿Estás seguro de que deseas registrar este nuevo pedido?"
                    }
                />
            </Paper>
        </Box>
    );
};

export default Pedidos;
