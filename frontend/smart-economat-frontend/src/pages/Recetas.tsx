import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Alert, Button, Tooltip, Chip } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, { DynamicField } from '../components/ui/DynamicFormModal';
import { Receta, DificultadReceta, TiempoReceta } from '../services/receta.types';
import { fetchRecetas, createReceta, updateReceta } from '../services/receta.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/ToastContext';
import StatusChip from '../components/ui/StatusChip';
import RecipeCarousel from '../components/ui/RecipeCarousel';

import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';



const recetaSchema: DynamicField[] = [
    { name: 'nombre', label: 'Nombre de la Receta', required: true, width: 8 },
    { name: 'tiempoPreparacion', label: 'Tiempo (ej: 30 min)', required: true, width: 4 },
    {
        name: 'tiempo',
        label: 'Franja de tiempo',
        type: 'select',
        required: true,
        width: 6,
        options: [
            { value: TiempoReceta.MIN_10, label: '10 min' },
            { value: TiempoReceta.MIN_20, label: '20 min' },
            { value: TiempoReceta.MIN_30, label: '30 min' },
            { value: TiempoReceta.MIN_45, label: '45 min' },
            { value: TiempoReceta.MIN_60, label: '60 min' },
        ],
    },
    {
        name: 'dificultad',
        label: 'Dificultad',
        type: 'select',
        required: true,
        width: 6,
        options: [
            { value: DificultadReceta.FACIL, label: 'Fácil' },
            { value: DificultadReceta.MEDIA, label: 'Media' },
            { value: DificultadReceta.DIFICIL, label: 'Difícil' },
        ],
    },
    {
        name: 'instrucciones',
        label: 'Instrucciones de elaboración',
        type: 'textarea',
        required: true,
        width: 12,
    },
    {
        name: 'ingredientes',
        label: 'Ingredientes de la receta',
        type: 'recipeIngredients',
        position: 'bottom',
    },
];

const Recetas: React.FC = () => {
    const [page, setPage] = useState(1);
    const [data, setData] = useState<Receta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Receta | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Record<string, any> | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const recetasData = await fetchRecetas();
            setData(recetasData);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar recetas.';
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
            await deleteResource(`/recetas/${itemToDelete.id}`);
            setData((prev) => prev.filter((r) => r.id !== itemToDelete.id));
            toast.success(`Receta "${itemToDelete.nombre}" eliminada correctamente.`);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al eliminar la receta.';
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
                instrucciones: formData.instrucciones,
                tiempo: formData.tiempo,
                dificultad: formData.dificultad,
                tiempoPreparacion: formData.tiempoPreparacion,
                ingredientes: Array.isArray(formData.ingredientes) ? formData.ingredientes.map((ing: any) => ({
                    productoId: ing.productoId,
                    cantidad: Number(ing.cantidad),
                    unidad: ing.unidad
                })) : [],
            };

            if (formData.id) {
                await updateReceta(formData.id, payload);
                toast.success('Receta actualizada correctamente.');
            } else {
                await createReceta(payload);
                toast.success('Receta creada correctamente.');
            }
            await loadData();
            setItemToEdit(null);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error al guardar la receta.';
            toast.error(message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleEditClick = (row: Receta) => {
        setItemToEdit({ ...row });
    };

    const columns: Column<Receta>[] = [
        { id: 'nombre', label: 'Nombre' },
        {
            id: 'dificultad',
            label: 'Dificultad',
            render: (row) => row.dificultad ? (
                <StatusChip
                    status={row.dificultad}
                    size="small"
                    variant="outlined"
                />
            ) : <span>—</span>,
            hideOnMobile: true,
        },
        {
            id: 'tiempo',
            label: 'Franja',
            render: (row) => row.tiempo ?? '—',
            hideOnMobile: true,
        },
        {
            id: 'tiempoPreparacion',
            label: 'Preparación',
            render: (row) => row.tiempoPreparacion
                ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <AccessTimeOutlinedIcon fontSize="inherit" sx={{ opacity: 0.6 }} />
                        {row.tiempoPreparacion}
                    </Box>
                )
                : <span>—</span>,
        },
        {
            id: 'ingredientes',
            label: 'Ingredientes',
            align: 'right',
            render: (row) => row.ingredientes?.length ?? 0,
            hideOnMobile: true,
        },
    ];

    const renderActions = (row: Receta) => (
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
            <RecipeCarousel />
            <Paper elevation={0} sx={{ p: { xs: 2, sm: 4 } }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                    <Typography variant="h6">
                        Gestión de Recetas
                    </Typography>

                    {/* Desktop Button */}
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => setItemToEdit({})}
                        sx={{ display: { xs: 'none', sm: 'inline-flex' } }}
                    >
                        Nueva Receta
                    </Button>

                    {/* Mobile Button */}
                    <Tooltip title="Nueva Receta">
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
                            <MenuBookOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                No hay recetas registradas
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Crea la primera receta del economato para comenzar.
                            </Typography>
                            <Button
                                variant="outlined"
                                startIcon={<AddIcon />}
                                onClick={() => setItemToEdit({})}
                            >
                                Añadir Receta
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
                    title="Eliminar receta"
                    message={
                        <>
                            ¿Estás seguro de que deseas eliminar la receta{' '}
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
                    title={itemToEdit?.id ? `Editar: ${itemToEdit.nombre || ''}` : 'Nueva Receta'}
                    size="md"
                    fields={recetaSchema}
                    initialData={itemToEdit || {}}
                    onSubmit={handleSave}
                    isSubmitting={isSaving}
                    requireConfirmation={true}
                    confirmationMessage={
                        itemToEdit?.id
                            ? "¿Estás seguro de que deseas guardar los cambios realizados en esta receta?"
                            : "¿Estás seguro de que deseas añadir esta nueva receta al sistema?"
                    }
                />
            </Paper>
        </Box>
    );
};

export default Recetas;
