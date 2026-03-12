import React, { useState, useEffect } from 'react';
import { Box, Paper, IconButton, Typography, Alert, Button, Tooltip, Chip, Card, CardContent, CardActions, Divider } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
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
import PageToolbar from '../components/ui/PageToolbar';
import RecipeCard from '../features/recetas/RecipeCard';
import DetailModal from '../components/ui/DetailModal';

import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import { recetaSchema } from '../utils/schemas';

const Recetas: React.FC = () => {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [data, setData] = useState<Receta[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [itemToDelete, setItemToDelete] = useState<Receta | null>(null);
    const [itemToEdit, setItemToEdit] = useState<Record<string, any> | null>(null);
    const [itemToView, setItemToView] = useState<Receta | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const toast = useToast();

    const loadData = async () => {
        setIsLoading(true);
        setError(null);
        try {
            const recetasData = await fetchRecetas(page, pageSize, searchTerm);
            setData(recetasData.data);
            setTotalPages(recetasData.totalPages);
            setTotalItems(recetasData.total || recetasData.data.length);
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Error desconocido al cargar recetas.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, pageSize, searchTerm]);

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
            <Tooltip title="Ver detalle">
                <IconButton color="primary" onClick={() => setItemToView(row)} size="small" aria-label="Ver">
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
            <RecipeCarousel />

            <PageToolbar
                title="Gestión de Recetas"
                searchValue={searchTerm}
                onSearchChange={(v) => { setSearchTerm(v); setPage(1); }}
                searchPlaceholder="Buscar por nombre, instrucciones, ingredientes..."
                searchId="search-recetas"
                totalItems={totalItems}
                totalItemsLabel="recetas"
                primaryAction={{
                    label: 'Nueva Receta',
                    onClick: () => setItemToEdit({}),
                    id: 'btn-nueva-receta',
                }}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
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
                    viewMode={viewMode}
                    defaultViewMode={viewMode}
                    emptyStateMessage={
                        <Box sx={{ py: 4, textAlign: 'center' }}>
                            <MenuBookOutlinedIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography variant="h6" color="text.secondary" gutterBottom>
                                {searchTerm.trim()
                                    ? 'No hay recetas que coincidan con tu búsqueda'
                                    : 'No hay recetas registradas'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                {searchTerm.trim()
                                    ? 'Prueba con otros términos o limpia el filtro.'
                                    : 'Crea la primera receta del economato para comenzar.'}
                            </Typography>
                            {!searchTerm.trim() && (
                                <Button
                                    variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={() => setItemToEdit({})}
                                >
                                    Añadir Receta
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
                    renderGridItem={(receta) => (
                        <RecipeCard
                            receta={receta}
                            onEdit={handleEditClick}
                            onDelete={setItemToDelete}
                            onView={setItemToView}
                        />
                    )}
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

                <DetailModal
                    isOpen={!!itemToView}
                    onClose={() => setItemToView(null)}
                    title={itemToView?.nombre || ''}
                    size="md"
                    editLabel="Editar receta"
                    onEdit={() => {
                        if (itemToView) {
                            handleEditClick(itemToView);
                            setItemToView(null);
                        }
                    }}
                    headerMedia={
                        <Box sx={{ p: 4, display: 'flex', justifyContent: 'center', bgcolor: 'action.hover' }}>
                            <MenuBookOutlinedIcon sx={{ fontSize: 80, color: 'text.secondary', opacity: 0.6 }} />
                        </Box>
                    }
                    sections={[
                        {
                            title: 'Información general',
                            columns: 2,
                            fields: [
                                {
                                    label: 'Dificultad',
                                    value: itemToView?.dificultad ? (
                                        <StatusChip status={itemToView.dificultad as any} size="small" variant="outlined" />
                                    ) : '—',
                                },
                                {
                                    label: 'Preparación',
                                    value: itemToView?.tiempoPreparacion || '—',
                                },
                                {
                                    label: 'Franja Horaria',
                                    value: itemToView?.tiempo || '—',
                                },
                            ],
                        },
                        {
                            title: 'Ingredientes',
                            content: (
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                    {itemToView?.ingredientes && itemToView.ingredientes.length > 0 ? (
                                        itemToView.ingredientes.map((ing, idx) => (
                                            <Paper
                                                key={ing.id || idx}
                                                variant="outlined"
                                                sx={{ p: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 1 }}
                                            >
                                                <Typography variant="body2" fontWeight={600}>
                                                    {ing.producto?.nombre || 'Producto desconocido'}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {ing.cantidad} {ing.unidad}
                                                </Typography>
                                            </Paper>
                                        ))
                                    ) : (
                                        <Typography variant="body2" color="text.secondary">No hay ingredientes registrados.</Typography>
                                    )}
                                </Box>
                            ),
                        },
                        {
                            title: 'Instrucciones',
                            content: (
                                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>
                                    {itemToView?.instrucciones || 'Sin instrucciones detalladas.'}
                                </Typography>
                            ),
                        },
                    ]}
                />
            </Paper>
        </Box>
    );
};

export default Recetas;
