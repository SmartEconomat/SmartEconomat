import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Alert, Button, Tooltip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, { DynamicField } from '../components/ui/DynamicFormModal';
import { Movimiento, TipoMovimiento } from '../services/movimiento.types';
import { fetchMovimientos, createMovimiento, updateMovimiento } from '../services/movimiento.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/ToastContext';
import StatusChip from '../components/ui/StatusChip';

import CompareArrowsOutlinedIcon from '@mui/icons-material/CompareArrowsOutlined';
import AddIcon from '@mui/icons-material/Add';

const movimientoSchema: DynamicField[] = [
    { 
        name: 'tipo', 
        label: 'Tipo de Movimiento', 
        type: 'select', 
        required: true, 
        width: 6,
        options: [
            { value: TipoMovimiento.ENTRADA, label: 'Entrada' },
            { value: TipoMovimiento.SALIDA, label: 'Salida' },
            { value: TipoMovimiento.AJUSTE, label: 'Ajuste' },
            { value: TipoMovimiento.PEDIDO, label: 'Pedido' },
            { value: TipoMovimiento.ENTRADA_COMPRA, label: 'Entrada por Compra' }
        ]
    },
    { name: 'cantidad', label: 'Cantidad', type: 'number', required: true, width: 6 },
    { name: 'fecha', label: 'Fecha del Movimiento', type: 'date', width: 4 },
    { name: 'entidad', label: 'Tipo de Entidad Origen (Ej: Recepcion)', required: true, width: 4 },
    { name: 'entidadId', label: 'ID de Entidad', required: true, width: 4 },
    { name: 'descripcion', label: 'Descripción / Justificación', width: 12 }
];

const Movimientos: React.FC = () => {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Movimiento[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Movimiento | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Record<string, any> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const dataLoad = await fetchMovimientos();
            setData(dataLoad);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar movimientos.';
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
            await deleteResource(`/movimientos/${itemToDelete.id}`);
            setData((prev) => prev.filter((p) => p.id !== itemToDelete.id));
            toast.success(`Movimiento eliminado correctamente.`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al eliminar el movimiento.';
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
                tipo: formData.tipo,
                cantidad: Number(formData.cantidad),
                descripcion: formData.descripcion,
                inventario: typeof formData.inventario === 'object' ? formData.inventario?.id : formData.inventario,
                usuario: typeof formData.usuario === 'object' ? formData.usuario?.id : formData.usuario,
            };

            if (formData.id) {
                await updateMovimiento(formData.id, payload);
                toast.success('Movimiento actualizado correctamente.');
            } else {
                await createMovimiento(payload);
                toast.success('Movimiento registrado correctamente.');
            }
            await loadData();
            setItemToEdit(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al guardar el movimiento.';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (row: Movimiento) => {
        setItemToEdit({ ...row });
    };

    const columns: Column<Movimiento>[] = [
        { 
            id: 'fecha', 
            label: 'Fecha',
            render: (row) => row.fecha ? new Date(row.fecha).toLocaleDateString() : '—',
            hideOnMobile: true,
        },
        {
            id: 'tipo',
            label: 'Tipo',
            render: (row) => <StatusChip status={row.tipo} />,
        },
        {
            id: 'cantidad',
            label: 'Cant.',
            align: 'right',
            render: (row) => `${row.cantidad}`,
        },
        {
            id: 'entidad',
            label: 'Origen',
            render: (row) => row.entidad ?? '—',
            hideOnMobile: true,
        },
        {
            id: 'usuario',
            label: 'Usuario',
            render: (row) => row.usuario?.nombre ?? '—',
            hideOnMobile: true,
        }
    ];

    const renderActions = (row: Movimiento) => (
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
                        Historial de Movimientos
                    </Typography>

                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setItemToEdit({})}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        Registrar Movimiento
                    </Button>

                    <Tooltip title="Registrar Movimiento">
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
                            <CompareArrowsOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No hay movimientos
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Aún no se han registrado alteraciones de inventario en el sistema.
                            </Typography>
                            <Button 
                                variant="outlined" 
                                startIcon={<AddIcon />}
                                onClick={() => setItemToEdit({})}
                            >
                                Registrar Movimiento Manual
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
                    title="Anular movimiento"
                    message={
                        <>
                            ¿Estás seguro de que deseas eliminar este registro de movimiento?{' '}
                            <strong>{itemToDelete?.tipo} - {itemToDelete?.cantidad} unid.</strong>{' '}
                            Esta acción no se puede deshacer y podría desbalancear el inventario estadístico.
                        </>
                    }
                    confirmText={isDeleting ? 'Eliminando…' : 'Sí, eliminar'}
                    cancelText="Cancelar"
                />

                <DynamicFormModal
                    isOpen={!!itemToEdit}
                    onClose={() => setItemToEdit(null)}
                    title={itemToEdit?.id ? `Editar Movimiento` : "Nuevo Movimiento de Ajuste"}
                    size="md"
                    fields={movimientoSchema}
                    initialData={itemToEdit || {}}
                    onSubmit={handleSave}
                    isSubmitting={isSaving}
                />
            </Paper>
        </Box>
    );
};

export default Movimientos;