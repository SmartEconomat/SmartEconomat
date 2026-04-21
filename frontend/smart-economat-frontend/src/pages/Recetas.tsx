import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DetailModal, { DetailSection } from '../components/ui/DetailModal';
import RecetaFormModal from '../features/recetas/RecetaFormModal';
import {
  buildRecetaPayload,
  mapRecetaToFormData,
} from '../features/recetas/recetaForm.helpers';
import RecetaAlergenos from '../components/ui/RecetaAlergenos';
import {
  Receta,
  RecetaIngrediente,
  RecetaPayload,
} from '../services/receta.types';
import {
  fetchRecetas,
  createReceta,
  updateReceta,
  exportRecipesPdf,
} from '../services/receta.service';
import { deleteResource, resolveStoredFileUrl } from '../services/api.service';
import {
  ejecutarProduccion,
  validarStock,
  StockValidationResult,
} from '../services/produccion.service';
import {
  createPedidoUsuarioFromMissingStock,
  createPedidoUsuarioFromRecetas,
} from '../services/pedido.service';
import { UbicacionService } from '../services/ubicacion.service';
import { Ubicacion } from '../services/ubicacion.types';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  TextField as MuiTextField,
  MenuItem,
  Grid,
} from '@mui/material';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import { useToast } from '../store/toast.hooks';
import StatusChip from '../components/ui/StatusChip';
import { usePermission } from '../store/auth.hooks';
import { PERMISSIONS } from '../sherlock-auth/permissions.constants';
import RecipeCarousel from '../components/ui/RecipeCarousel';
import PageToolbar from '../components/ui/PageToolbar';

import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import ShoppingCartCheckoutOutlinedIcon from '@mui/icons-material/ShoppingCartCheckoutOutlined';
import { parseLocalizedNumber } from '../utils/numberUtils';
import { DownloadService } from '../services/download.service';

const RecetaIngredientesView: React.FC<{
  ingredientes?: RecetaIngrediente[];
}> = ({ ingredientes = [] }) => {
  const { t } = useTranslation();
  if (ingredientes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('recetas.detail.noIngredients')}
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>
              {t('recetas.table.ingredient')}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 100 }}>
              {t('recetas.table.quantity')}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 80 }}>
              {t('common.unit')}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>
              {t('recetas.table.favProvider')}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {ingredientes.map((ing, i) => (
            <TableRow key={`ing-view-${ing.id || i}`}>
              <TableCell>{ing.producto?.nombre ?? '—'}</TableCell>
              <TableCell>{ing.cantidad}</TableCell>
              <TableCell>{ing.unidad}</TableCell>
              <TableCell>
                {ing.proveedorFavorito?.nombre ? (
                  <Box
                    component="span"
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.75,
                      fontWeight: 700,
                      color: 'success.dark',
                    }}
                  >
                    <span>{ing.proveedorFavorito.nombre}</span>
                    <Box
                      component="span"
                      sx={{
                        fontSize: '0.68rem',
                        textTransform: 'uppercase',
                        letterSpacing: 0.4,
                        fontWeight: 700,
                      }}
                    >
                      Auto
                    </Box>
                  </Box>
                ) : (
                  <span
                    style={{
                      opacity: 0.5,
                      fontStyle: 'italic',
                      fontSize: '0.8rem',
                    }}
                  >
                    {t('common.automatic')}
                  </span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

const getRecipeImageUrl = (receta?: Receta | null): string =>
  resolveStoredFileUrl(receta?.pathImgOptimized || receta?.pathImg || '');

const TIEMPO_FRANJAS_MINUTOS = [10, 20, 30, 45, 60] as const;

function extractRecetaMinutes(receta?: Receta | null): number | null {
  const rawMinutes = receta?.tiempoEstimadoMinutos;
  if (
    typeof rawMinutes === 'number' &&
    Number.isFinite(rawMinutes) &&
    rawMinutes > 0
  ) {
    return rawMinutes;
  }

  return null;
}

function getTiempoPreparacionLabel(receta?: Receta | null): string | undefined {
  const minutes = extractRecetaMinutes(receta);
  return typeof minutes === 'number' ? `${minutes} min` : undefined;
}

function getFranjaTiempoLabel(receta?: Receta | null): string | undefined {
  const minutes = extractRecetaMinutes(receta);
  if (typeof minutes !== 'number') {
    return undefined;
  }

  const closest = TIEMPO_FRANJAS_MINUTOS.reduce((prev, current) =>
    Math.abs(current - minutes) < Math.abs(prev - minutes) ? current : prev
  );

  return `${closest} min`;
}

function getCosteUnitarioEstimadoLabel(
  coste: Receta['costeUnitarioEstimado']
): string | undefined {
  if (coste == null) {
    return undefined;
  }

  const parsed = Number(coste);
  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return `${parsed.toFixed(4)}€`;
}

const RecipeImagePreview: React.FC<{
  receta?: Receta | null;
  height?: number;
  width?: number | string;
  borderRadius?: number | string;
  iconSize?: number;
}> = ({
  receta,
  height = 160,
  width = '100%',
  borderRadius = 2,
  iconSize = 42,
}) => {
  const imageUrl = getRecipeImageUrl(receta);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [imageUrl]);

  if (imageUrl && !imageLoadFailed) {
    return (
      <Box
        component="img"
        src={imageUrl}
        alt={receta?.nombre || 'Receta'}
        onError={() => setImageLoadFailed(true)}
        sx={{
          width,
          height,
          flexShrink: 0,
          objectFit: 'cover',
          display: 'block',
          borderRadius,
          overflow: 'hidden',
        }}
      />
    );
  }

  return (
    <Box
      sx={{
        width,
        height,
        borderRadius,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        bgcolor: 'action.hover',
        color: 'text.secondary',
        border: '1px solid',
        borderColor: 'divider',
      }}
    >
      <MenuBookOutlinedIcon sx={{ fontSize: iconSize, opacity: 0.7 }} />
    </Box>
  );
};

const Recetas: React.FC = () => {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string | undefined>('nombre');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [data, setData] = useState<Receta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Receta | null>(null);
  const [itemToEdit, setItemToEdit] = useState<Record<string, unknown> | null>(
    null
  );
  const [itemToView, setItemToView] = useState<Receta | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [exportIds, setExportIds] = useState<string[]>([]);
  const [includeImageInPdf, setIncludeImageInPdf] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isCookModalOpen, setIsCookModalOpen] = useState(false);
  const [cookData, setCookData] = useState<{
    items: { receta: Receta; cantidad: number; raciones: number }[];
    ubicacionId: string;
    fechaCaducidadManual?: string;
  }>({
    items: [],
    ubicacionId: '',
  });
  const [ubicaciones, setUbicaciones] = useState<Ubicacion[]>([]);
  const [isCooking, setIsCooking] = useState(false);
  const [stockValidation, setStockValidation] =
    useState<StockValidationResult | null>(null);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const toast = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const recetasData = await fetchRecetas(
        page,
        pageSize,
        searchTerm,
        sortBy,
        sortOrder
      );
      setData(recetasData.data);
      setTotalPages(recetasData.totalPages);
      setTotalItems(recetasData.total || recetasData.data.length);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('recetas.feedback.loadError');
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, sortBy, sortOrder, t]);

  useEffect(() => {
    loadData();
    // Cargar ubicaciones para el modal de preparación
    UbicacionService.findAll().then(setUbicaciones).catch(console.error);
  }, [loadData]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(`/recetas/${itemToDelete.id}`);
      setData((prev) => prev.filter((r) => r.id !== itemToDelete.id));
      toast.success(
        t('recetas.feedback.deleted', { name: itemToDelete.nombre })
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('recetas.feedback.deleteError');
      toast.error(message);
    } finally {
      setIsDeleting(false);
      setItemToDelete(null);
    }
  };

  const handleSave = async (formData: Record<string, unknown>) => {
    setIsSaving(true);
    try {
      const payload = await buildRecetaPayload(formData);

      if (formData.id) {
        await updateReceta(String(formData.id), payload as RecetaPayload);
        toast.success(t('recetas.feedback.updated'));
      } else {
        await createReceta(payload as RecetaPayload);
        toast.success(t('recetas.feedback.created'));
      }
      await loadData();
      setItemToEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('recetas.feedback.saveError');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (row: Receta) => {
    setItemToEdit(mapRecetaToFormData(row));
  };

  const openExportDialog = (ids: string[]) => {
    if (ids.length === 0) {
      toast.error('Selecciona al menos una receta para exportar a PDF.');
      return;
    }

    setExportIds(ids);
    setIncludeImageInPdf(true);
    setIsExportDialogOpen(true);
  };

  const handleExportPdf = async () => {
    if (exportIds.length === 0) {
      toast.error('Selecciona al menos una receta para exportar a PDF.');
      return;
    }

    setIsExportingPdf(true);
    try {
      await exportRecipesPdf(exportIds, {
        includeImage: includeImageInPdf,
        toast,
      });
      setIsExportDialogOpen(false);
    } catch {
      // Handled
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      // Si hay seleccionados exportamos solo esos, si no, todo lo filtrado (searchTerm)
      const ids = selectedIds.length > 0 ? selectedIds.join(',') : '';
      const query = new URLSearchParams({ searchTerm });
      if (ids) query.append('ids', ids);

      await DownloadService.downloadFile(
        `/export/recetas/xlsx?${query.toString()}`,
        {
          filename: 'recetas.xlsx',
          toast,
        }
      );
    } catch {
      // Manejado
    }
  };

  const handleCookClick = (recetas: Receta[]) => {
    setCookData({
      items: recetas.map((r) => {
        const cantidad = Number(r.rendimiento) || 1;
        const raciones = Number(r.raciones) || 1;
        return {
          receta: r,
          cantidad,
          raciones,
        };
      }),
      ubicacionId: ubicaciones[0]?.id || '',
    });
    setIsCookModalOpen(true);
  };

  const handleUpdateItemQuantity = (
    index: number,
    value: number,
    field: 'cantidad' | 'raciones'
  ) => {
    setCookData((prev) => {
      const newItems = [...prev.items];
      const item = newItems[index];
      const { receta } = item;

      if (field === 'cantidad') {
        const cantidad = value;
        let raciones = 0;
        if (receta.tamanioRacion && receta.tamanioRacion > 0) {
          raciones = Number((cantidad / receta.tamanioRacion).toFixed(1));
        } else if (receta.rendimiento && receta.rendimiento > 0) {
          raciones = Number(
            ((cantidad / receta.rendimiento) * (receta.raciones || 1)).toFixed(
              1
            )
          );
        }
        newItems[index] = { ...item, cantidad, raciones };
      } else {
        const raciones = value;
        let cantidad = 0;
        if (receta.tamanioRacion && receta.tamanioRacion > 0) {
          cantidad = Number((raciones * receta.tamanioRacion).toFixed(3));
        } else if (receta.rendimiento && receta.rendimiento > 0) {
          cantidad = Number(
            ((raciones / (receta.raciones || 1)) * receta.rendimiento).toFixed(
              3
            )
          );
        } else {
          cantidad = raciones;
        }
        newItems[index] = { ...item, cantidad, raciones };
      }
      return { ...prev, items: newItems };
    });
  };

  useEffect(() => {
    if (!isCookModalOpen || cookData.items.length === 0) {
      setStockValidation(null);
      return;
    }

    const timer = setTimeout(async () => {
      setIsValidatingStock(true);
      try {
        const result = await validarStock({
          items: cookData.items.map((it) => ({
            recetaId: it.receta.id,
            cantidad: it.cantidad,
          })),
        });
        setStockValidation(result);
      } catch (err) {
        console.error('Error al validar stock:', err);
      } finally {
        setIsValidatingStock(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [cookData.items, isCookModalOpen]);

  const missingIngredients =
    stockValidation?.ingredients.filter((ing) => !ing.isEnough) ?? [];
  const hasMissingIngredients = missingIngredients.length > 0;

  const handleCreateMissingOrder = async () => {
    if (!stockValidation) return;

    if (!hasMissingIngredients) {
      toast.error(
        'No se encontraron proveedores válidos para los ingredientes faltantes.'
      );
      return;
    }

    setIsCooking(true);
    try {
      const pedidoUsuario = await createPedidoUsuarioFromMissingStock({
        observaciones: `Pedido automático por falta de stock para: ${cookData.items.map((it) => it.receta.nombre).join(', ')}`,
        items: cookData.items.map((item) => ({
          recetaId: item.receta.id,
          cantidad: item.cantidad,
        })),
      });

      const totalPedidos = pedidoUsuario.pedidos?.length ?? 0;
      toast.success(
        totalPedidos > 0
          ? `Se ha generado el pedido #${pedidoUsuario.numeroGlobal} con ${totalPedidos} pedido${totalPedidos === 1 ? '' : 's'} interno${totalPedidos === 1 ? '' : 's'} para cubrir los faltantes.`
          : `Se ha generado el pedido #${pedidoUsuario.numeroGlobal} para cubrir los faltantes.`
      );
      setIsCookModalOpen(false);
    } catch (err: unknown) {
      toast.error(
        'Error al generar pedidos: ' +
          (err instanceof Error ? err.message : String(err))
      );
    } finally {
      setIsCooking(false);
    }
  };

  const handleConfirmCook = async () => {
    if (cookData.items.length === 0 || !cookData.ubicacionId) {
      toast.error('Debes seleccionar una ubicación de destino.');
      return;
    }

    setIsCooking(true);
    try {
      const results = await Promise.all(
        cookData.items.map(async (item) => {
          try {
            return await ejecutarProduccion({
              recetaId: item.receta.id,
              cantidadProducida: item.cantidad,
              ubicacionDestinoId: cookData.ubicacionId || undefined,
              fechaCaducidadManual: cookData.fechaCaducidadManual || undefined,
            });
          } catch (e: unknown) {
            const axiosLike = e as {
              response?: { data?: { message?: string } };
              message?: string;
            };
            const recipeError =
              axiosLike.response?.data?.message ||
              axiosLike.message ||
              'Error en esta receta';
            toast.error(`${item.receta.nombre}: ${recipeError}`);
            return null;
          }
        })
      );

      const successful = results.filter((r) => r !== null).length;
      if (successful > 0) {
        toast.success(
          successful === cookData.items.length
            ? 'Producciones lanzadas con éxito'
            : `Se procesaron ${successful} de ${cookData.items.length} producciones.`
        );
      }
      setIsCookModalOpen(false);
      setSelectedIds([]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al iniciar la preparación.';
      toast.error(message);
    } finally {
      setIsCooking(false);
    }
  };

  const columns: Column<Receta>[] = [
    {
      id: 'nombre',
      label: t('recetas.table.name'),
      sortable: true,
      minWidth: 380,
      cellSx: { py: 2, pr: 4 },
      render: (row) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            minWidth: 0,
            overflow: 'hidden',
          }}
        >
          <RecipeImagePreview
            receta={row}
            width={56}
            height={56}
            borderRadius={1.5}
            iconSize={24}
          />
          <Box sx={{ minWidth: 0, overflow: 'hidden' }}>
            <Typography
              variant="inherit"
              sx={{
                fontWeight: 400,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
              noWrap
            >
              {row.nombre}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
              sx={{
                display: 'block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {row.unidadResultado
                ? `${row.rendimiento ?? '—'} ${row.unidadResultado}`
                : t('recetas.table.ingredientsCount', {
                    count: row.ingredientes?.length ?? 0,
                  })}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'dificultad',
      label: t('recetas.table.difficulty'),
      render: (row) =>
        row.dificultad ? (
          <StatusChip status={row.dificultad} size="small" variant="outlined" />
        ) : (
          <span>—</span>
        ),
      width: 200,
      headerSx: { px: 4 },
      cellSx: { whiteSpace: 'nowrap', px: 4 },
      hideOnMobile: true,
      sortable: true,
    },
    {
      id: 'tiempoPreparacion',
      label: t('recetas.table.time'),
      width: 200,
      headerSx: { px: 4 },
      sortable: true,
      render: (row) => {
        const tiempoLabel = getTiempoPreparacionLabel(row);

        return tiempoLabel ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              whiteSpace: 'nowrap',
            }}
          >
            <AccessTimeOutlinedIcon fontSize="inherit" sx={{ opacity: 0.6 }} />
            {tiempoLabel}
          </Box>
        ) : (
          <span>—</span>
        );
      },
      cellSx: { px: 4 },
    },
    {
      id: 'ingredientes',
      label: t('recetas.table.ingredients'),
      align: 'right',
      width: 170,
      render: (row) => row.ingredientes?.length ?? 0,
      headerSx: { px: 4 },
      cellSx: { whiteSpace: 'nowrap', px: 4 },
      hideOnMobile: true,
    },
  ];

  const handleSort = (key: string | keyof Receta) => {
    const isAsc = sortBy === key && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortBy(key as string);
  };

  const canEdit = usePermission(PERMISSIONS.recetas.editar);
  const canDelete = usePermission(PERMISSIONS.recetas.eliminar);
  const canCreate = usePermission(PERMISSIONS.recetas.crear);
  const canCook = usePermission(PERMISSIONS.recetas.cocinar);
  const canExportPdf = usePermission(PERMISSIONS.recetas.ver);
  const canCreateOrders = usePermission(PERMISSIONS.pedidos.crear);

  const handleCreateOrderFromRecipes = useCallback(
    async (recetas: Receta[]) => {
      const recetaIds = Array.from(
        new Set(recetas.map((receta) => receta.id).filter(Boolean))
      );

      if (recetaIds.length === 0) {
        toast.error('Debes seleccionar al menos una receta.');
        return;
      }

      setIsCooking(true);
      try {
        const pedidoUsuario = await createPedidoUsuarioFromRecetas({
          recetaIds,
          observaciones: `Pedido generado desde recetas: ${recetas
            .map((receta) => receta.nombre)
            .join(', ')}`,
        });

        toast.success(
          `Pedido #${pedidoUsuario.numeroGlobal} generado correctamente desde ${recetaIds.length} receta${recetaIds.length === 1 ? '' : 's'}.`
        );
        setItemToView(null);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : 'Error al generar el pedido desde recetas.';
        toast.error(message);
      } finally {
        setIsCooking(false);
      }
    },
    [toast]
  );

  const renderActions = (row: Receta) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title={t('common.viewDetails')}>
        <IconButton
          color="primary"
          onClick={() => {
            setItemToView(row);
          }}
          size="small"
          aria-label="Ver detalles"
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {canCook && (
        <Tooltip title={t('recetas.actions.cookNow')}>
          <IconButton
            color="success"
            onClick={() => {
              handleCookClick([row]);
            }}
            size="small"
            aria-label="Preparar"
          >
            <PlayCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canCreateOrders && (
        <Tooltip title="Crear pedido">
          <IconButton
            color="warning"
            onClick={() => {
              void handleCreateOrderFromRecipes([row]);
            }}
            size="small"
            aria-label="Crear pedido"
            disabled={isCooking}
          >
            <ShoppingCartCheckoutOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canExportPdf && (
        <Tooltip title="Exportar PDF">
          <IconButton
            color="error"
            onClick={() => {
              openExportDialog([row.id]);
            }}
            size="small"
            aria-label="Exportar PDF"
            disabled={isExportingPdf}
          >
            <PictureAsPdfOutlinedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canEdit && (
        <IconButton
          color="secondary"
          onClick={() => {
            handleEditClick(row);
          }}
          size="small"
          aria-label="Editar"
        >
          <EditIcon fontSize="small" />
        </IconButton>
      )}
      {canDelete && (
        <IconButton
          color="error"
          onClick={() => {
            setItemToDelete(row);
          }}
          size="small"
          aria-label="Borrar"
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );

  const viewSections: DetailSection[] = itemToView
    ? [
        {
          title: t('recetas.detail.sections.basicInfo'),
          columns: 3,
          fields: [
            {
              label: t('recetas.table.difficulty'),
              value: itemToView.dificultad ? (
                <StatusChip
                  status={itemToView.dificultad}
                  size="small"
                  variant="outlined"
                />
              ) : undefined,
            },
            {
              label: t('recetas.detail.fields.timeRange'),
              value: getFranjaTiempoLabel(itemToView),
            },
            {
              label: t('recetas.table.time'),
              value: getTiempoPreparacionLabel(itemToView),
            },
          ],
        },
        {
          title: t('recetas.detail.sections.instructions'),
          fields: [
            {
              label: t('recetas.detail.fields.steps'),
              value: itemToView.instrucciones,
              fullWidth: true,
            },
          ],
        },
        {
          title: t('recetas.detail.sections.production'),
          columns: 3,
          fields: [
            {
              label: t('recetas.detail.fields.yield'),
              value: itemToView.rendimiento
                ? `${itemToView.rendimiento} ${itemToView.unidadResultado}`
                : undefined,
            },
            {
              label: t('recetas.detail.fields.expiryDays'),
              value: itemToView.diasCaducidad,
            },
            {
              label: t('recetas.detail.fields.estimatedCost'),
              value: getCosteUnitarioEstimadoLabel(
                itemToView.costeUnitarioEstimado
              ),
            },
            {
              label: t('recetas.detail.fields.servings'),
              value: itemToView.raciones,
            },
            {
              label: t('recetas.detail.fields.servingSize'),
              value: itemToView.tamanioRacion
                ? `${itemToView.tamanioRacion} ${itemToView.unidadResultado}`
                : undefined,
            },
          ],
        },
        {
          title: t('recetas.detail.sections.ingredients'),
          content: (
            <RecetaIngredientesView ingredientes={itemToView.ingredientes} />
          ),
        },
        {
          title: t('recetas.detail.sections.allergens'),
          content: <RecetaAlergenos ingredientes={itemToView.ingredientes} />,
        },
      ]
    : [];

  return (
    <Box>
      <RecipeCarousel />

      <PageToolbar
        title={t('recetas.title')}
        searchValue={searchTerm}
        onSearchChange={(v) => {
          setSearchTerm(v);
          setPage(1);
        }}
        searchPlaceholder={t('recetas.searchPlaceholder')}
        searchId="search-recetas"
        totalItems={totalItems}
        totalItemsLabel={t('recetas.totalItemsLabel')}
        viewMode={viewMode}
        primaryAction={
          canCreate
            ? {
                label: t('recetas.actions.newRecipe'),
                onClick: () => setItemToEdit({}),
                id: 'btn-nueva-receta',
              }
            : undefined
        }
        extraActions={[
          ...(canCook
            ? [
                {
                  label:
                    selectedIds.length > 0
                      ? t('recetas.actions.prepareSelected', {
                          count: selectedIds.length,
                        })
                      : t('recetas.actions.prepareRecipes'),
                  icon: <RestaurantIcon />,
                  onClick: () => {
                    const items = data.filter((r) =>
                      selectedIds.includes(r.id)
                    );
                    handleCookClick(items);
                  },
                  id: 'btn-preparar-lote',
                  disabled: selectedIds.length === 0,
                  color: 'success' as const,
                  variant: 'outlined' as const,
                },
              ]
            : []),
          ...(canExportPdf
            ? [
                {
                  label:
                    selectedIds.length > 0
                      ? t('recetas.actions.exportSelected', {
                          count: selectedIds.length,
                        })
                      : t('common.exportPdf'),
                  icon: <PictureAsPdfOutlinedIcon />,
                  onClick: () => {
                    const ids =
                      selectedIds.length > 0
                        ? selectedIds
                        : data.map((r) => r.id);
                    openExportDialog(ids);
                  },
                  id: 'btn-exportar-pdf-recetas',
                  disabled: selectedIds.length === 0,
                  color: 'error' as const,
                  variant: 'outlined' as const,
                },
              ]
            : []),
          ...(canExportPdf
            ? [
                {
                  label: t('common.exportExcel'),
                  icon: <FileDownloadOutlinedIcon />,
                  onClick: () => {
                    void handleExportExcel();
                  },
                  id: 'btn-exportar-excel-recetas',
                  color: 'success' as const,
                  variant: 'outlined' as const,
                },
              ]
            : []),
          ...(canCreateOrders
            ? [
                {
                  label:
                    selectedIds.length > 0
                      ? t('recetas.actions.createOrderSelected', {
                          count: selectedIds.length,
                        })
                      : t('recetas.actions.createOrder'),
                  icon: <ShoppingCartCheckoutOutlinedIcon />,
                  onClick: () => {
                    const items = data.filter((r) =>
                      selectedIds.includes(r.id)
                    );
                    void handleCreateOrderFromRecipes(items);
                  },
                  id: 'btn-crear-pedido-recetas',
                  disabled: selectedIds.length === 0 || isCooking,
                  isLoading: isCooking,
                  color: 'warning' as const,
                  variant: 'outlined' as const,
                },
              ]
            : []),
        ]}
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
          actionsWidth={300}
          hideTopBar={true}
          actionsAlign="center"
          viewMode={viewMode}
          defaultViewMode={viewMode}
          onSort={handleSort}
          sortConfig={{ key: sortBy || '', direction: sortOrder }}
          selectable={canCook || canExportPdf || canCreateOrders}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          emptyStateMessage={
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <MenuBookOutlinedIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {searchTerm.trim()
                  ? t('recetas.empty.search')
                  : t('recetas.empty.title')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {searchTerm.trim()
                  ? t('recetas.empty.searchSubtitle')
                  : t('recetas.empty.subtitle')}
              </Typography>
              {!searchTerm.trim() && canCreate && (
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => setItemToEdit({})}
                >
                  {t('recetas.actions.addRecipe')}
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
                overflow: 'hidden',
              }}
            >
              <RecipeImagePreview
                receta={receta}
                height={180}
                width="100%"
                borderRadius={0}
                iconSize={56}
              />
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
                  {getTiempoPreparacionLabel(receta) && (
                    <Chip
                      icon={<AccessTimeOutlinedIcon />}
                      label={getTiempoPreparacionLabel(receta)}
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
                  {t('recetas.table.ingredientsCount', {
                    count: receta.ingredientes?.length ?? 0,
                  })}
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
          title={t('recetas.dialogs.deleteTitle')}
          message={
            <Box>
              {t('recetas.dialogs.deleteMessage', {
                name: itemToDelete?.nombre,
              })}
            </Box>
          }
          confirmText={t('common.confirmDelete')}
          cancelText={t('common.cancel')}
          isLoading={isDeleting}
        />

        <RecetaFormModal
          isOpen={!!itemToEdit}
          onClose={() => setItemToEdit(null)}
          initialData={itemToEdit || {}}
          onSubmit={handleSave}
          isSubmitting={isSaving}
        />

        <DetailModal
          isOpen={!!itemToView}
          onClose={() => setItemToView(null)}
          title={itemToView?.nombre ?? ''}
          subtitle={t('recetas.table.ingredientsCount', {
            count: itemToView?.ingredientes?.length ?? 0,
          })}
          size="lg"
          headerMedia={
            itemToView ? (
              <RecipeImagePreview
                receta={itemToView}
                height={220}
                width="100%"
                borderRadius={2}
                iconSize={72}
              />
            ) : undefined
          }
          sections={viewSections}
          actions={
            itemToView && (
              <Box display="flex" gap={1}>
                {canCook && (
                  <Button
                    variant="contained"
                    color="success"
                    startIcon={<PlayCircleOutlineIcon />}
                    onClick={() => {
                      handleCookClick([itemToView!]);
                      setItemToView(null);
                    }}
                  >
                    {t('recetas.actions.cookNow')}
                  </Button>
                )}
                {canCreateOrders && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<ShoppingCartCheckoutOutlinedIcon />}
                    onClick={() => {
                      void handleCreateOrderFromRecipes([itemToView!]);
                      setItemToView(null);
                    }}
                  >
                    {t('recetas.actions.createOrder')}
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<PictureAsPdfOutlinedIcon />}
                  onClick={() => openExportDialog([itemToView!.id])}
                >
                  {t('recetas.actions.exportPdf')}
                </Button>
              </Box>
            )
          }
          onEdit={
            canEdit
              ? () => {
                  const receta = itemToView;
                  setItemToView(null);
                  if (receta) handleEditClick(receta);
                }
              : undefined
          }
          editLabel={t('common.edit')}
        />

        <Dialog
          open={isExportDialogOpen}
          onClose={() => !isExportingPdf && setIsExportDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{t('recetas.dialogs.exportTitle')}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('recetas.dialogs.exportMessage', { count: exportIds.length })}
            </Typography>

            <FormControlLabel
              control={
                <Switch
                  checked={includeImageInPdf}
                  onChange={(event) =>
                    setIncludeImageInPdf(event.target.checked)
                  }
                  color="primary"
                />
              }
              label={t('recetas.dialogs.includeImages')}
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              {t('recetas.dialogs.imageNote')}
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExportingPdf}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              color="error"
              startIcon={<PictureAsPdfOutlinedIcon />}
              onClick={() => {
                void handleExportPdf();
              }}
              disabled={isExportingPdf}
            >
              {isExportingPdf ? t('common.exporting') : t('common.exportPdf')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Modal para Ejecutar Preparación */}
        <Dialog
          open={isCookModalOpen}
          onClose={() => !isCooking && setIsCookModalOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: { borderRadius: 3, p: 1 },
          }}
        >
          <DialogTitle
            component="div"
            sx={{
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              pb: 1,
              color: 'primary.main',
            }}
          >
            <PlayCircleOutlineIcon sx={{ fontSize: 32 }} />
            <Box>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 800 }}>
                {cookData.items.length > 1
                  ? t('recetas.dialogs.batchProduction', {
                      count: cookData.items.length,
                    })
                  : t('recetas.dialogs.cookRecipe', {
                      name: cookData.items[0]?.receta.nombre,
                    })}
              </Typography>
              <Typography
                variant="caption"
                component="span"
                sx={{
                  display: 'block',
                  color: 'text.secondary',
                  fontWeight: 500,
                }}
              >
                {t('recetas.dialogs.cookSubtitle')}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={3} sx={{ mt: 0 }}>
              {/* Columna Izquierda: Tabla de Recetas */}
              <Grid size={{ xs: 12, md: 7 }}>
                <Typography
                  variant="subtitle2"
                  sx={{
                    mb: 1.5,
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <MenuBookOutlinedIcon fontSize="small" />{' '}
                  {t('recetas.dialogs.recipesToCook')}
                </Typography>
                <TableContainer
                  component={Paper}
                  variant="outlined"
                  sx={{
                    maxHeight: 400,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'action.hover',
                  }}
                >
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{ fontWeight: 700, bgcolor: 'background.paper' }}
                        >
                          {t('recetas.table.recipe')}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            width: 100,
                            bgcolor: 'background.paper',
                          }}
                          align="right"
                        >
                          {t('recetas.table.quantity')}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            width: 100,
                            bgcolor: 'background.paper',
                          }}
                          align="right"
                        >
                          {t('recetas.table.servings')}
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            width: 60,
                            bgcolor: 'background.paper',
                          }}
                        >
                          {t('recetas.table.unit')}
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cookData.items.map((item, idx) => (
                        <TableRow
                          key={item.receta.id}
                          sx={{
                            '&:last-child td, &:last-child th': { border: 0 },
                            bgcolor: 'background.paper',
                          }}
                        >
                          <TableCell sx={{ py: 2 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {item.receta.nombre}
                            </Typography>
                            {item.receta.rendimiento ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {t('recetas.dialogs.baseYield', {
                                  yield: item.receta.rendimiento,
                                  unit: item.receta.unidadResultado || '',
                                })}
                              </Typography>
                            ) : null}
                          </TableCell>
                          <TableCell align="right">
                            <MuiTextField
                              type="number"
                              size="small"
                              variant="outlined"
                              value={item.cantidad}
                              onChange={(e) =>
                                handleUpdateItemQuantity(
                                  idx,
                                  parseLocalizedNumber(e.target.value) ?? 0,
                                  'cantidad'
                                )
                              }
                              autoComplete="off"
                              sx={{ width: 80 }}
                              slotProps={{
                                input: {
                                  inputProps: {
                                    min: 0.01,
                                    step: 'any',
                                    inputMode: 'decimal',
                                  },
                                  sx: { fontSize: '0.85rem', fontWeight: 600 },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <MuiTextField
                              type="number"
                              size="small"
                              variant="outlined"
                              value={item.raciones || 0}
                              onChange={(e) =>
                                handleUpdateItemQuantity(
                                  idx,
                                  parseLocalizedNumber(e.target.value) ?? 0,
                                  'raciones'
                                )
                              }
                              autoComplete="off"
                              sx={{ width: 80 }}
                              slotProps={{
                                input: {
                                  inputProps: {
                                    min: 0.001,
                                    step: 'any',
                                    inputMode: 'decimal',
                                  },
                                  sx: { fontSize: '0.85rem', fontWeight: 600 },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            <Box
                              sx={{
                                display: 'inline-flex',
                                px: 1,
                                py: 0.5,
                                borderRadius: 1,
                                bgcolor: 'action.selected',
                                fontSize: '0.7rem',
                                fontWeight: 800,
                                color: 'text.secondary',
                                textTransform: 'uppercase',
                              }}
                            >
                              {item.receta.unidadResultado}
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>

              {/* Columna Derecha: Configuración y Stock */}
              <Grid size={{ xs: 12, md: 5 }}>
                <Stack spacing={2.5}>
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{ mb: 1.5, fontWeight: 700 }}
                    >
                      {t('recetas.dialogs.batchConfig')}
                    </Typography>
                    <Stack spacing={2}>
                      <MuiTextField
                        select
                        label={t('recetas.dialogs.destinationLocation')}
                        fullWidth
                        value={cookData.ubicacionId}
                        onChange={(e) =>
                          setCookData({
                            ...cookData,
                            ubicacionId: e.target.value,
                          })
                        }
                        sx={{ bgcolor: 'background.paper' }}
                        required
                      >
                        {ubicaciones.map((u) => (
                          <MenuItem key={u.id} value={u.id}>
                            {u.nombre}
                          </MenuItem>
                        ))}
                      </MuiTextField>

                      <MuiTextField
                        label={t('recetas.dialogs.expiryDate')}
                        type="date"
                        fullWidth
                        value={cookData.fechaCaducidadManual || ''}
                        onChange={(e) =>
                          setCookData({
                            ...cookData,
                            fechaCaducidadManual: e.target.value,
                          })
                        }
                        sx={{ bgcolor: 'background.paper' }}
                        slotProps={{
                          inputLabel: { shrink: true },
                        }}
                      />
                    </Stack>
                  </Box>

                  <Divider />

                  {/* Sección de Validación de Stock */}
                  <Box>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                        {t('recetas.dialogs.stockValidation')}
                      </Typography>
                      {isValidatingStock && (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <CircularProgress size={14} thickness={6} />
                          <Typography variant="caption" color="text.secondary">
                            {t('common.validating')}
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {hasMissingIngredients ? (
                      <Alert
                        severity="error"
                        variant="standard"
                        sx={{
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'error.main',
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{ fontWeight: 800, display: 'block', mb: 0.5 }}
                        >
                          {t('recetas.dialogs.insufficientStock')}
                        </Typography>
                        <Box
                          component="ul"
                          sx={{ m: 0, pl: 2, fontSize: '0.75rem', mb: 1.5 }}
                        >
                          {missingIngredients.map((ing) => (
                            <li key={ing.productoId}>
                              <b>{ing.nombre}</b>:{' '}
                              {t('recetas.dialogs.missingAmount', {
                                amount: Number(
                                  (ing.requerido - ing.disponible).toFixed(3)
                                ),
                                unit: ing.unidad,
                              })}
                              {ing.cheapestProveedorNombre && (
                                <Typography
                                  variant="caption"
                                  sx={{
                                    display: 'block',
                                    fontStyle: 'italic',
                                    opacity: 0.7,
                                  }}
                                >
                                  (
                                  {t('recetas.dialogs.provider', {
                                    name: ing.cheapestProveedorNombre,
                                  })}
                                  )
                                </Typography>
                              )}
                            </li>
                          ))}
                        </Box>
                        <Button
                          variant="contained"
                          color="error"
                          size="small"
                          fullWidth
                          onClick={() => void handleCreateMissingOrder()}
                          disabled={isCooking}
                          sx={{ fontWeight: 800, borderRadius: 2 }}
                        >
                          {t('recetas.dialogs.createMissingOrder')}
                        </Button>
                      </Alert>
                    ) : (
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          {t('recetas.dialogs.stockOk')}
                        </Typography>
                      </Alert>
                    )}
                  </Box>
                </Stack>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions
            sx={{
              p: 3,
              gap: 1.5,
              borderTop: '1px solid',
              borderColor: 'divider',
              mt: 1,
            }}
          >
            <Button
              onClick={() => setIsCookModalOpen(false)}
              disabled={isCooking}
              variant="text"
              sx={{ px: 4, borderRadius: 2 }}
            >
              {t('common.cancel')}
            </Button>
            <Button
              variant="contained"
              color={hasMissingIngredients ? 'error' : 'success'}
              onClick={() => void handleConfirmCook()}
              disabled={
                isCooking ||
                !cookData.ubicacionId ||
                cookData.items.some((i) => i.cantidad <= 0) ||
                hasMissingIngredients
              }
              size="large"
              sx={{
                px: 5,
                py: 1.2,
                fontWeight: 800,
                borderRadius: 2,
                boxShadow: 3,
              }}
              startIcon={
                isCooking ? (
                  <CircularProgress size={20} color="inherit" />
                ) : (
                  <PlayCircleOutlineIcon />
                )
              }
            >
              {cookData.items.length > 1
                ? t('recetas.dialogs.startBatchProduction')
                : t('recetas.dialogs.startPreparation')}
            </Button>
            {hasMissingIngredients && (
              <Button
                variant="contained"
                color="warning"
                onClick={() => void handleCreateMissingOrder()}
                disabled={isCooking}
                size="large"
                sx={{
                  px: 5,
                  py: 1.2,
                  fontWeight: 800,
                  borderRadius: 2,
                }}
              >
                Crear pedido de faltantes
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Recetas;
