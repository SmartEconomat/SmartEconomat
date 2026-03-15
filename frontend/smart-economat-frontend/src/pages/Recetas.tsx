import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  IconButton,
  Typography,
  Alert,
  Button,
  Chip,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DynamicFormModal, {
  DynamicField,
} from '../components/ui/DynamicFormModal';
import {
  Receta,
  DificultadReceta,
  TiempoReceta,
} from '../services/receta.types';
import {
  fetchRecetas,
  createReceta,
  updateReceta,
} from '../services/receta.service';
import { deleteResource } from '../services/api.service';
import { useToast } from '../store/toast.hooks';
import StatusChip from '../components/ui/StatusChip';
import RecipeCarousel from '../components/ui/RecipeCarousel';
import PageToolbar from '../components/ui/PageToolbar';

import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';

const recetaSchema: DynamicField[] = [
  { name: 'nombre', label: 'Nombre de la Receta', required: true, width: 8 },
  {
    name: 'tiempoPreparacion',
    label: 'Tiempo (ej: 30 min)',
    required: true,
    width: 4,
  },
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
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [data, setData] = useState<Receta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Receta | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Record<string, unknown> | null>(
    null
  );
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const recetasData = await fetchRecetas(page, pageSize, searchTerm);
      setData(recetasData.data);
      setTotalPages(recetasData.totalPages);
      setTotalItems(recetasData.total || recetasData.data.length);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error desconocido al cargar recetas.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(`/recetas/${itemToDelete.id}`);
      setData((prev) => prev.filter((r) => r.id !== itemToDelete.id));
      toast.success(`Receta "${itemToDelete.nombre}" eliminada correctamente.`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al eliminar la receta.';
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const normalizePreparationTime = (value: string) => {
        const trimmed = value.trim();
        const shortMatch = trimmed.match(
          /^(\d+)\s*(min|minuto|minutos|hora|horas|segundo|segundos)$/i
        );
        if (!shortMatch) return trimmed;

        const amount = shortMatch[1];
        const unit = shortMatch[2].toLowerCase();

        if (unit.startsWith('min')) return `${amount} minutos`;
        if (unit.startsWith('hora')) return `${amount} horas`;
        return `${amount} segundos`;
      };

      const ingredientes = Array.isArray(formData.ingredientes)
        ? (formData.ingredientes as Record<string, unknown>[])
            .map((ing) => ({
              productoId: ing.productoId as string,
              cantidad: Number(ing.cantidad),
              unidad: ing.unidad as string,
            }))
            .filter((ing) => ing.productoId && ing.cantidad > 0)
        : [];

      if (ingredientes.length === 0) {
        throw new Error('La receta debe tener al menos un ingrediente válido.');
      }

      const payload = {
        nombre: formData.nombre,
        instrucciones: formData.instrucciones,
        tiempo: formData.tiempo,
        dificultad: formData.dificultad,
        tiempoPreparacion: normalizePreparationTime(
          formData.tiempoPreparacion as string
        ),
        ingredientes,
      };

      if (formData.id) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await updateReceta(String(formData.id), payload as any);
        toast.success('Receta actualizada correctamente.');
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await createReceta(payload as any);
        toast.success('Receta creada correctamente.');
      }
      await loadData();
      setItemToEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al guardar la receta.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (row: Receta) => {
    setItemToEdit({ ...row } as unknown as Record<string, unknown>);
  };

  const columns: Column<Receta>[] = [
    { id: 'nombre', label: 'Nombre' },
    {
      id: 'dificultad',
      label: 'Dificultad',
      render: (row) =>
        row.dificultad ? (
          <StatusChip status={row.dificultad} size="small" variant="outlined" />
        ) : (
          <span>—</span>
        ),
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
      render: (row) =>
        row.tiempoPreparacion ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeOutlinedIcon fontSize="inherit" sx={{ opacity: 0.6 }} />
            {row.tiempoPreparacion}
          </Box>
        ) : (
          <span>—</span>
        ),
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
      <IconButton
        color="secondary"
        onClick={() => handleEditClick(row)}
        size="small"
        aria-label="Editar"
      >
        <EditIcon fontSize="small" />
      </IconButton>
      <IconButton
        color="error"
        onClick={() => setItemToDelete(row)}
        size="small"
        aria-label="Borrar"
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </>
  );

  return (
    <Box>
      <RecipeCarousel />

      <PageToolbar
        title="Gestión de Recetas"
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder="Buscar por nombre, instrucciones, ingredientes..."
        searchId="search-recetas"
        totalItems={totalItems}
        totalItemsLabel="recetas"
        primaryAction={{
          label: 'Nueva Receta',
          onClick: () => setItemToEdit({}),
          id: 'btn-nueva-receta',
        }}
        onViewModeChange={setViewMode}
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
              <MenuBookOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            onPageSizeChange: (e: any) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            },
          }}
          renderGridItem={(receta) => (
            <Card
              variant="outlined"
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography
                  gutterBottom
                  variant="h6"
                  component="div"
                  sx={{ fontWeight: 600 }}
                >
                  {receta.nombre}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap" mb={2} mt={1}>
                  {receta.dificultad && (
                    <StatusChip
                      status={receta.dificultad}
                      size="small"
                      variant="outlined"
                    />
                  )}
                  {receta.tiempoPreparacion && (
                    <Chip
                      icon={<AccessTimeOutlinedIcon />}
                      label={receta.tiempoPreparacion}
                      size="small"
                      variant="outlined"
                    />
                  )}
                </Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {receta.instrucciones}
                </Typography>
              </CardContent>
              <Divider />
              <CardActions
                sx={{
                  justifyContent: 'space-between',
                  px: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="caption" color="text.secondary">
                  {receta.ingredientes?.length || 0} ingredientes
                </Typography>
                <Box>{renderActions(receta)}</Box>
              </CardActions>
            </Card>
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
              <strong>{itemToDelete?.nombre}</strong>? Esta acción no se puede
              deshacer.
            </>
          }
          confirmText="Sí, eliminar"
          cancelText="Cancelar"
          isLoading={isDeleting}
        />

        <DynamicFormModal
          isOpen={!!itemToEdit}
          onClose={() => setItemToEdit(null)}
          title={
            itemToEdit?.id
              ? `Editar: ${itemToEdit.nombre || ''}`
              : 'Nueva Receta'
          }
          size="md"
          fields={recetaSchema}
          initialData={itemToEdit || {}}
          onSubmit={handleSave}
          isSubmitting={isSaving}
          requireConfirmation={true}
          confirmationMessage={
            itemToEdit?.id
              ? '¿Estás seguro de que deseas guardar los cambios realizados en esta receta?'
              : '¿Estás seguro de que deseas añadir esta nueva receta al sistema?'
          }
        />
      </Paper>
    </Box>
  );
};

export default Recetas;
