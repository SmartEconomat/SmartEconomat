import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import DataTable, { Column } from '../components/ui/DataTable';
import ConfirmDialog from '../components/ui/ConfirmDialog';
import DetailModal, { DetailSection } from '../components/ui/DetailModal';
import RecetaFormModal from '../features/recetas/RecetaFormModal';
import {
  buildRecetaPayload,
  mapRecetaToFormData,
} from '../features/recetas/recetaForm.helpers';
import {
  getRecetaTiempoFilterRange,
  getRecetaTiempoFranjaLabel,
  getRecetaTiempoLabel,
  normalizeRecetaTiempoMinutos,
  type RecetaTiempoFiltro,
} from '../features/recetas/receta-tiempo.utils';
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
  Checkbox,
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
import {
  formatLocalizedNumber,
  normalizeNumericInput,
  parseLocalizedNumber,
} from '../utils/numberUtils';
import { DownloadService } from '../services/download.service';
import { useTranslation } from 'react-i18next';
import { useDataTable } from '../hooks/useDataTable';

const RecetaIngredientesView: React.FC<{
  ingredientes?: RecetaIngrediente[];
}> = ({ ingredientes = [] }) => {
  const { t } = useTranslation();
  if (ingredientes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        {t('recipes.ingredientes.empty')}
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>
              {t('recipes.ingredientes.producto')}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 100 }}>
              {t('recipes.ingredientes.cantidad')}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 80 }}>
              {t('recipes.ingredientes.unidad')}
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>
              {t('recipes.ingredientes.proveedorFav')}
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
                      {t('recipes.ingredientes.auto')}
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
                    {t('recipes.ingredientes.automatico')}
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

function getRecipeImageUrl(receta?: Receta | null): string | undefined {
  if (!receta?.pathImg) return undefined;
  return resolveStoredFileUrl(receta.pathImg);
}

function extractRecetaMinutes(receta?: Receta | null): number | null {
  return normalizeRecetaTiempoMinutos(receta?.tiempoEstimadoMinutos);
}

function getTiempoPreparacionLabel(
  receta: Receta | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
): string | undefined {
  const minutes = extractRecetaMinutes(receta);
  return typeof minutes === 'number'
    ? getRecetaTiempoLabel(minutes, t)
    : undefined;
}

function getFranjaTiempoLabel(
  receta: Receta | null | undefined,
  t: (key: string, options?: Record<string, unknown>) => string
): string | undefined {
  const minutes = extractRecetaMinutes(receta);
  if (typeof minutes !== 'number') {
    return undefined;
  }

  return getRecetaTiempoFranjaLabel(minutes, t);
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

/** Por defecto ≠ rendimiento físico unitario en recetas con una sola ración de referencia. */
function defaultCantidadAProducirParaModal(receta: Receta): number {
  const rac =
    receta.raciones != null &&
    typeof receta.raciones === 'number' &&
    receta.raciones > 0
      ? receta.raciones
      : 1;
  return rac <= 1 ? 0.5 : 1;
}

function isCantidadObjetivoModalValida(val: number): boolean {
  return typeof val === 'number' && Number.isFinite(val) && val >= 0.001;
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
  const { t } = useTranslation();
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
        alt={
          receta?.nombre
            ? t('recipes.imageAlt', { nombre: receta.nombre })
            : t('recipes.altImagenDefecto')
        }
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
  const [tiempoFilter, setTiempoFilter] = useState<RecetaTiempoFiltro>('all');
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
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
    items: { receta: Receta; cantidadAProducir: number }[];
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

  const {
    filters: tableFilters,
    searchTerm,
    onPageChange,
    onSort,
    onFilter,
    onSearchChange,
    queryParams,
    sortConfig,
    paginationProps,
    syncPaginationFromResponse,
  } = useDataTable({
    sortBy: 'nombre',
    order: 'asc',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tiempoRange = getRecetaTiempoFilterRange(tiempoFilter);
      const recetasData = await fetchRecetas(
        queryParams.page,
        queryParams.limit,
        queryParams.searchTerm,
        queryParams.sortBy,
        queryParams.order,
        tiempoRange
      );
      setData(recetasData.data);
      const nextTotal = recetasData.total || recetasData.data.length;
      setTotalItems(nextTotal);
      syncPaginationFromResponse(recetasData);
    } catch (err: unknown) {
      syncPaginationFromResponse({ total: 0, data: [] });
      setError(
        err instanceof Error ? err.message : t('recipes.toast.errorCargar')
      );
    } finally {
      setIsLoading(false);
    }
  }, [queryParams, tiempoFilter, syncPaginationFromResponse, t]);

  useEffect(() => {
    loadData();
    UbicacionService.findAll().then(setUbicaciones).catch(console.error);
  }, [loadData]);

  useEffect(() => {
    if (!isCookModalOpen || ubicaciones.length === 0) return;

    setCookData((prev) => {
      const hasValidLocation = ubicaciones.some(
        (ubicacion) => ubicacion.id === prev.ubicacionId
      );

      if (hasValidLocation) return prev;

      return {
        ...prev,
        ubicacionId: ubicaciones[0].id,
      };
    });
  }, [isCookModalOpen, ubicaciones]);

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;
    setIsDeleting(true);
    try {
      await deleteResource(`/recetas/${itemToDelete.id}`);
      setData((prev) => prev.filter((r) => r.id !== itemToDelete.id));
      toast.success(
        t('recipes.toast.eliminada', { nombre: itemToDelete.nombre })
      );
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('recipes.toast.errorEliminar');
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
        toast.success(t('recipes.toast.actualizada'));
      } else {
        await createReceta(payload as RecetaPayload);
        toast.success(t('recipes.toast.creada'));
      }
      await loadData();
      setItemToEdit(null);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('recipes.toast.errorGuardar');
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (row: Receta) => {
    setItemToEdit(mapRecetaToFormData(row));
  };

  const handleViewClick = (row: Receta) => {
    setItemToView(row);
  };

  const openExportDialog = (ids: string[]) => {
    if (ids.length === 0) {
      toast.error(t('recipes.toast.seleccionaParaExportar'));
      return;
    }

    setExportIds(ids);
    setIncludeImageInPdf(true);
    setIsExportDialogOpen(true);
  };

  const handleExportPdf = async () => {
    if (exportIds.length === 0) {
      toast.error(t('recipes.toast.seleccionaParaExportar'));
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
      // Error handled by exportRecipesPdf internal toast
    } finally {
      setIsExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const query = new URLSearchParams();

      if (searchTerm.trim()) {
        query.append('searchTerm', searchTerm.trim());
      }

      if (selectedIds.length > 0) {
        query.append('ids', selectedIds.join(','));
      } else {
        // Si no hay IDs seleccionados, aplicamos los filtros actuales de tiempo
        const tiempoRange = getRecetaTiempoFilterRange(tiempoFilter);
        if (tiempoRange.minTiempoMinutos != null) {
          query.append(
            'minTiempoMinutos',
            String(tiempoRange.minTiempoMinutos)
          );
        }
        if (tiempoRange.maxTiempoMinutos != null) {
          query.append(
            'maxTiempoMinutos',
            String(tiempoRange.maxTiempoMinutos)
          );
        }
      }

      await DownloadService.downloadFile(
        `/export/recetas/xlsx?${query.toString()}`,
        {
          filename: t('recipes.toolbar.exportExcelFilename'),
          toast,
        }
      );
    } catch (err: unknown) {
      console.error('Export Excel Error:', err);
    }
  };

  const handleCookClick = (recetas: Receta[]) => {
    setCookData({
      items: recetas.map((r) => ({
        receta: r,
        cantidadAProducir: defaultCantidadAProducirParaModal(r),
      })),
      ubicacionId: ubicaciones[0]?.id || '',
    });
    setIsCookModalOpen(true);
  };

  const handleCantidadPreparacionChange = (index: number, valor: number) => {
    setCookData((prev) => {
      const nextItems = [...prev.items];
      if (!nextItems[index]) return prev;
      nextItems[index] = {
        ...nextItems[index],
        cantidadAProducir: valor,
      };
      return { ...prev, items: nextItems };
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
            cantidadAProducir: it.cantidadAProducir,
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
      toast.error(t('recipes.toast.sinFaltantesParaPedido'));
      return;
    }

    setIsCooking(true);
    try {
      const pedidoUsuario = await createPedidoUsuarioFromMissingStock({
        observaciones: t('recipes.observacionesPedidoAutoStock', {
          lista: cookData.items.map((it) => it.receta.nombre).join(', '),
        }),
        items: cookData.items.map((item) => ({
          recetaId: item.receta.id,
          cantidadAProducir: item.cantidadAProducir,
        })),
      });

      const totalPedidos = pedidoUsuario.pedidos?.length ?? 0;
      toast.success(
        totalPedidos > 0
          ? t('recipes.toast.pedidoGeneradoConInternos', {
              numero: pedidoUsuario.numeroGlobal,
              total: totalPedidos,
            })
          : t('recipes.toast.pedidoGenerado', {
              numero: pedidoUsuario.numeroGlobal,
            })
      );
      setIsCookModalOpen(false);
    } catch (err: unknown) {
      toast.error(
        t('recipes.toast.errorGenerarPedidos', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setIsCooking(false);
    }
  };

  const handleConfirmCook = async () => {
    if (cookData.items.length === 0 || !cookData.ubicacionId) {
      toast.error(t('recipes.toast.seleccionaUbicacion'));
      return;
    }

    setIsCooking(true);
    try {
      const results = await Promise.all(
        cookData.items.map(async (item) => {
          try {
            return await ejecutarProduccion({
              recetaId: item.receta.id,
              cantidadAProducir: item.cantidadAProducir,
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
              t('recipes.errors.errorEnReceta');
            toast.error(
              t('recipes.toast.errorRecetaConNombre', {
                nombre: item.receta.nombre,
                error: recipeError,
              })
            );
            return null;
          }
        })
      );

      const successful = results.filter((r) => r !== null).length;
      if (successful > 0) {
        toast.success(
          successful === cookData.items.length
            ? t('recipes.toast.produccionesExito')
            : t('recipes.toast.produccionesParcial', {
                successful,
                total: cookData.items.length,
              })
        );
      }
      setIsCookModalOpen(false);
      setSelectedIds([]);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('recipes.toast.errorIniciarPreparacion');
      toast.error(message);
    } finally {
      setIsCooking(false);
    }
  };

  const columns: Column<Receta>[] = useMemo(
    () => [
      {
        id: 'nombre',
        label: t('recipes.columns.nombre'),
        sortable: true,
        sortType: 'string',
        width: 350,
        cellSx: { py: 2 },
        render: (row) => (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              minWidth: 0,
              overflow: 'hidden',
            }}
          >
            <RecipeImagePreview
              receta={row}
              width={44}
              height={44}
              borderRadius={1.5}
              iconSize={20}
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
                  : t(
                      row.ingredientes?.length === 1
                        ? 'recipes.listado.ingredientesCount_one'
                        : 'recipes.listado.ingredientesCount_other',
                      { count: row.ingredientes?.length ?? 0 }
                    )}
              </Typography>
            </Box>
          </Box>
        ),
      },
      {
        id: 'dificultad',
        label: t('recipes.columns.dificultad'),
        render: (row) =>
          row.dificultad ? (
            <StatusChip
              status={row.dificultad}
              size="small"
              variant="outlined"
            />
          ) : (
            <span style={{ color: '#bbb' }}>—</span>
          ),
        sortable: true,
        sortType: 'string',
        width: 120,
        cellSx: { py: 2 },
      },
      {
        id: 'tiempoEstimadoMinutos',
        label: t('recipes.columns.tiempo'),
        width: 140,
        sortable: true,
        sortType: 'number',
        filterable: true,
        filterType: 'number',
        render: (row) => {
          const tiempoLabel = getTiempoPreparacionLabel(row, t);

          return tiempoLabel ? (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                whiteSpace: 'nowrap',
              }}
            >
              <AccessTimeOutlinedIcon
                fontSize="inherit"
                sx={{ opacity: 0.6 }}
              />
              {tiempoLabel}
            </Box>
          ) : (
            <span>—</span>
          );
        },
      },
      {
        id: 'ingredientes',
        label: t('recipes.columns.ingredientes'),
        align: 'right',
        width: 120,
        render: (row) => row.ingredientes?.length ?? 0,
        cellSx: { whiteSpace: 'nowrap' },
        responsiveDisplay: { xs: 'none', lg: 'table-cell' },
      },
    ],
    [t]
  );

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
        toast.error(t('recipes.toast.seleccionaRecetasPedido'));
        return;
      }

      setIsCooking(true);
      try {
        const pedidoUsuario = await createPedidoUsuarioFromRecetas({
          recetaIds,
          observaciones: t('recipes.observacionesPedidoDesdeRecetas', {
            lista: recetas.map((receta) => receta.nombre).join(', '),
          }),
        });

        toast.success(
          recetaIds.length === 1
            ? t('recipes.toast.pedidoGeneradoDesdeRecetas_one', {
                numero: pedidoUsuario.numeroGlobal,
              })
            : t('recipes.toast.pedidoGeneradoDesdeRecetas_other', {
                numero: pedidoUsuario.numeroGlobal,
                count: recetaIds.length,
              })
        );
        setItemToView(null);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : t('recipes.toast.errorPedidoDesdeRecetas');
        toast.error(message);
      } finally {
        setIsCooking(false);
      }
    },
    [toast, t]
  );

  const renderActions = (row: Receta) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      {canCook && (
        <Tooltip title={t('recipes.preparar')}>
          <IconButton
            color="success"
            onClick={() => {
              handleCookClick([row]);
            }}
            size="small"
            aria-label={t('recipes.preparar')}
          >
            <PlayCircleOutlineIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {canCreateOrders && (
        <Tooltip title={t('recipes.crearPedido')}>
          <span>
            <IconButton
              color="warning"
              onClick={() => {
                void handleCreateOrderFromRecipes([row]);
              }}
              size="small"
              aria-label={t('recipes.crearPedido')}
              disabled={isCooking}
            >
              <ShoppingCartCheckoutOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {canExportPdf && (
        <Tooltip title={t('recipes.toolbar.exportarPdf')}>
          <span>
            <IconButton
              color="error"
              onClick={() => {
                openExportDialog([row.id]);
              }}
              size="small"
              aria-label={t('recipes.toolbar.exportarPdf')}
              disabled={isExportingPdf}
            >
              <PictureAsPdfOutlinedIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}
      {canEdit && (
        <IconButton
          color="secondary"
          onClick={() => {
            handleEditClick(row);
          }}
          size="small"
          aria-label={t('comun.editar')}
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
          aria-label={t('comun.borrar')}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      )}
    </Stack>
  );

  const viewSections: DetailSection[] = itemToView
    ? [
        {
          title: t('recipes.detalle.seccionInformacion'),
          columns: 3,
          fields: [
            {
              label: t('recipes.detalle.dificultad'),
              value: itemToView.dificultad ? (
                <StatusChip
                  status={itemToView.dificultad}
                  size="small"
                  variant="outlined"
                />
              ) : undefined,
            },
            {
              label: t('recipes.detalle.franjaTiempo'),
              value: getFranjaTiempoLabel(itemToView, t),
            },
            {
              label: t('recipes.detalle.tiempoPreparacion'),
              value: getTiempoPreparacionLabel(itemToView, t),
            },
          ],
        },
        {
          title: t('recipes.detalle.seccionInstrucciones'),
          fields: [
            {
              label: t('recipes.detalle.pasosElaboracion'),
              value: itemToView.instrucciones,
              fullWidth: true,
            },
          ],
        },
        {
          title: t('recipes.detalle.seccionProduccion'),
          columns: 3,
          fields: [
            {
              label: t('recipes.detalle.rendimiento'),
              value: itemToView.rendimiento
                ? `${itemToView.rendimiento} ${itemToView.unidadResultado}`
                : undefined,
            },
            {
              label: t('recipes.detalle.diasCaducidad'),
              value: itemToView.diasCaducidad,
            },
            {
              label: t('recipes.detalle.costeEstimado'),
              value: getCosteUnitarioEstimadoLabel(
                itemToView.costeUnitarioEstimado
              ),
            },
            {
              label: t('recipes.detalle.racionesBase'),
              value: itemToView.raciones,
            },
            {
              label: t('recipes.detalle.tamanoRacion'),
              value: itemToView.tamanioRacion
                ? `${itemToView.tamanioRacion} ${itemToView.unidadResultado}`
                : undefined,
            },
          ],
        },
        {
          title: t('recipes.detalle.seccionIngredientes'),
          content: (
            <RecetaIngredientesView ingredientes={itemToView.ingredientes} />
          ),
        },
        {
          title: t('recipes.detalle.alergenosDetectados'),
          content: <RecetaAlergenos ingredientes={itemToView.ingredientes} />,
        },
      ]
    : [];

  return (
    <Box>
      <RecipeCarousel />

      <PageToolbar
        title={t('recipes.gestionTitulo')}
        searchValue={searchTerm}
        onSearchChange={onSearchChange}
        searchPlaceholder={t('recipes.toolbar.buscarPlaceholder')}
        searchId="search-recetas"
        filters={
          <MuiTextField
            select
            fullWidth
            size="small"
            label={t('recipes.toolbar.filtroTiempo')}
            value={tiempoFilter}
            onChange={(event) => {
              setTiempoFilter(event.target.value as RecetaTiempoFiltro);
              onPageChange(null, 1);
            }}
          >
            <MenuItem value="all">{t('recipes.filters.tiempo.all')}</MenuItem>
            <MenuItem value="rapidas">
              {t('recipes.filters.tiempo.rapidas')}
            </MenuItem>
            <MenuItem value="medias">
              {t('recipes.filters.tiempo.medias')}
            </MenuItem>
            <MenuItem value="largas">
              {t('recipes.filters.tiempo.largas')}
            </MenuItem>
          </MuiTextField>
        }
        totalItems={totalItems}
        totalItemsLabel={t('recipes.toolbar.totalItemsLabel')}
        viewMode={viewMode}
        primaryAction={
          canCreate
            ? {
                label: t('recipes.toolbar.nuevaReceta'),
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
                      ? t('recipes.toolbar.prepararConCount', {
                          count: selectedIds.length,
                        })
                      : t('recipes.toolbar.prepararSeleccion'),
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
                      ? t('recipes.toolbar.exportarPdfConCount', {
                          count: selectedIds.length,
                        })
                      : t('recipes.toolbar.exportarPdf'),
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
                  label: t('recipes.toolbar.exportarExcel'),
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
                      ? t('recipes.toolbar.crearPedidoConCount', {
                          count: selectedIds.length,
                        })
                      : t('recipes.toolbar.crearPedido'),
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

      <Paper
        elevation={2}
        sx={{
          borderRadius: 3,
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 4 } }}>
          {!isLoading && error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <DataTable
            columns={columns}
            data={data}
            isLoading={isLoading}
            pagination={{
              ...paginationProps,
              pageSizeOptions: paginationProps.pageSizeOptions ?? [
                5, 10, 15, 20, 50,
              ],
            }}
            renderActions={renderActions}
            onSort={onSort}
            sortConfig={sortConfig}
            filters={tableFilters}
            onFilter={onFilter}
            selectable
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            actionsWidth={120}
            id="recipes-table"
            hideViewModeToggle={true}
            getRowAriaLabel={(row: Receta) =>
              t('recipes.aria.filaReceta', { nombre: row.nombre })
            }
            onRowClick={handleViewClick}
            emptyStateMessage={
              <Box sx={{ py: 4, textAlign: 'center' }}>
                <MenuBookOutlinedIcon
                  sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
                />
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {searchTerm.trim()
                    ? t('recipes.empty.sinCoincidencias')
                    : t('recipes.empty.sinRegistros')}
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {searchTerm.trim()
                    ? t('recipes.empty.hintBusqueda')
                    : t('recipes.empty.hintInicial')}
                </Typography>
                {!searchTerm.trim() && canCreate && (
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setItemToEdit({})}
                  >
                    {t('recipes.toolbar.nuevaReceta')}
                  </Button>
                )}
              </Box>
            }
            renderGridItem={(receta) => (
              <Card
                variant="outlined"
                onClick={() => handleViewClick(receta)}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 2,
                  overflow: 'hidden',
                  cursor: 'pointer',
                  position: 'relative',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) =>
                      `0 0 0 1px ${theme.palette.primary.main}`,
                  },
                }}
              >
                {(canCook || canExportPdf || canCreateOrders) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 8,
                      left: 8,
                      zIndex: 2,
                      bgcolor: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '50%',
                      width: 32,
                      height: 32,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: 2,
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      size="small"
                      checked={selectedIds.includes(receta.id)}
                      onChange={(e) => {
                        const id = receta.id;
                        if (e.target.checked) {
                          setSelectedIds([...selectedIds, id]);
                        } else {
                          setSelectedIds(
                            selectedIds.filter((sid) => sid !== id)
                          );
                        }
                      }}
                    />
                  </Box>
                )}
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
                    {getTiempoPreparacionLabel(receta, t) && (
                      <Chip
                        icon={<AccessTimeOutlinedIcon />}
                        label={getTiempoPreparacionLabel(receta, t)}
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
                  onClick={(e) => e.stopPropagation()}
                >
                  <Typography variant="caption" color="text.secondary">
                    {t('recipes.detalle.ingredientesCount_other', {
                      count: receta.ingredientes?.length || 0,
                    })}
                  </Typography>
                  <Box>{renderActions(receta)}</Box>
                </CardActions>
              </Card>
            )}
          />
        </Box>
      </Paper>

      <ConfirmDialog
        isOpen={!!itemToDelete}
        onClose={() => !isDeleting && setItemToDelete(null)}
        onConfirm={() => void handleDeleteConfirm()}
        title={t('recipes.eliminarReceta')}
        message={
          <>
            {t('recipes.confirmEliminarMsj', { nombre: itemToDelete?.nombre })}
          </>
        }
        confirmText={t('recipes.confirmSiEliminar')}
        cancelText={t('comun.cancelar')}
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
        subtitle={t('recipes.listado.ingredientesCount_other', {
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
                  {t('recipes.detalle.preparar')}
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
                  {t('recipes.detalle.pedido')}
                </Button>
              )}
              <Button
                variant="outlined"
                color="error"
                startIcon={<PictureAsPdfOutlinedIcon />}
                onClick={() => openExportDialog([itemToView!.id])}
              >
                {t('recipes.detalle.fichaPdf')}
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
        editLabel={t('recipes.editarReceta')}
      />

      <Dialog
        open={isExportDialogOpen}
        onClose={() => !isExportingPdf && setIsExportDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>{t('recipes.exportPdf.titulo')}</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {exportIds.length === 1
              ? t('recipes.exportPdf.resumen_one')
              : t('recipes.exportPdf.resumen_other', {
                  count: exportIds.length,
                })}
          </Typography>

          <FormControlLabel
            control={
              <Switch
                checked={includeImageInPdf}
                onChange={(event) => setIncludeImageInPdf(event.target.checked)}
                color="primary"
              />
            }
            label={t('recipes.incluirImagenReceta')}
          />

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 1 }}
          >
            {t('recipes.exportPdf.imagenAyuda')}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsExportDialogOpen(false)}
            disabled={isExportingPdf}
          >
            {t('comun.cancelar')}
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
            {isExportingPdf
              ? t('recipes.exportPdf.exportando')
              : t('recipes.exportPdf.botonExportar')}
          </Button>
        </DialogActions>
      </Dialog>

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
                ? t('recipes.preparacionLote.tituloMultiples', {
                    count: cookData.items.length,
                  })
                : t('recipes.preparacionLote.tituloUna', {
                    nombre: cookData.items[0]?.receta.nombre ?? '',
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
              {t('recipes.preparacionLote.subtitulo')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid size={{ xs: 12, md: 7 }}>
              <Typography
                variant="subtitle2"
                sx={{
                  mb: 2,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  color: 'primary.dark',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  letterSpacing: 0.5,
                }}
              >
                <RestaurantIcon fontSize="small" />
                {t('recipes.preparacionLote.seccionRecetas')}
              </Typography>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        sx={{ fontWeight: 800, bgcolor: 'action.hover' }}
                      >
                        {t('recipes.preparacionLote.colReceta')}
                      </TableCell>
                      <TableCell
                        align="center"
                        sx={{ fontWeight: 800, bgcolor: 'action.hover' }}
                      >
                        {t('recipes.preparacionLote.colPorcionesPreparacion')}
                      </TableCell>
                      <TableCell
                        sx={{
                          fontWeight: 700,
                          bgcolor: 'action.hover',
                          minWidth: 140,
                        }}
                      >
                        {t('recipes.preparacionLote.colPrevisionServidor')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cookData.items.map((item, idx) => {
                      const itemResumen = stockValidation?.itemsResumen?.find(
                        (m) => m.recetaId === item.receta.id
                      );
                      return (
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
                            {item.receta.rendimiento != null &&
                            item.receta.rendimiento > 0 ? (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: 'block', mt: 0.5 }}
                              >
                                {t('recipes.preparacionLote.rendimientoBase', {
                                  rendimiento: item.receta.rendimiento,
                                  unidad: item.receta.unidadResultado || '',
                                })}
                              </Typography>
                            ) : null}
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: 'block', mt: 0.25 }}
                            >
                              {t('recipes.preparacionLote.racionesReferencia', {
                                n: item.receta.raciones ?? 1,
                              })}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <MuiTextField
                              type="text"
                              size="small"
                              variant="outlined"
                              value={item.cantidadAProducir}
                              onChange={(e) =>
                                handleCantidadPreparacionChange(
                                  idx,
                                  parseLocalizedNumber(
                                    normalizeNumericInput(e.target.value)
                                  ) ?? 0
                                )
                              }
                              autoComplete="off"
                              sx={{ width: 100, mx: 'auto' }}
                              slotProps={{
                                input: {
                                  inputProps: {
                                    inputMode: 'decimal',
                                    pattern: '[0-9]*[.,]?[0-9]*',
                                  },
                                  sx: {
                                    fontSize: '0.85rem',
                                    fontWeight: 600,
                                    textAlign: 'center',
                                  },
                                },
                              }}
                            />
                          </TableCell>
                          <TableCell>
                            {itemResumen ? (
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600 }}
                              >
                                {t('recipes.preparacionLote.equivProduccion', {
                                  cantidad: formatLocalizedNumber(
                                    itemResumen.cantidadFisicaObjetivo,
                                    3
                                  ),
                                  unidad: item.receta.unidadResultado || '',
                                  factor: formatLocalizedNumber(
                                    itemResumen.factorEscalado,
                                    4
                                  ),
                                })}
                              </Typography>
                            ) : (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                —
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>

            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={2.5}>
                <Box>
                  <Typography
                    variant="subtitle2"
                    sx={{ mb: 1.5, fontWeight: 700 }}
                  >
                    {t('recipes.cocinar.configuracionLote')}
                  </Typography>
                  <Stack spacing={2}>
                    <MuiTextField
                      select
                      label={t('recipes.cocinar.ubicacionDestino')}
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
                      label={t('recipes.cocinar.fechaCaducidadManual')}
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
                      {t('recipes.preparacionLote.verificacionStock')}
                    </Typography>
                    {isValidatingStock && (
                      <Box
                        sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                      >
                        <CircularProgress size={14} thickness={6} />
                        <Typography variant="caption" color="text.secondary">
                          {t('recipes.preparacionLote.validandoStock')}
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
                        {t('recipes.preparacionLote.insufTitulo')}
                      </Typography>
                      <Box
                        component="ul"
                        sx={{ m: 0, pl: 2, fontSize: '0.75rem', mb: 1.5 }}
                      >
                        {missingIngredients.map((missing) => (
                          <li key={missing.productoId}>
                            {t('recipes.preparacionLote.faltaLinea', {
                              nombre: missing.nombre,
                              cantidad: Number(
                                (
                                  missing.requerido - missing.disponible
                                ).toFixed(3)
                              ),
                              unidad: missing.unidad,
                            })}
                            {missing.cheapestProveedorNombre && (
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ ml: 0.5 }}
                              >
                                {t('recipes.preparacionLote.provEtiqueta', {
                                  nombre: missing.cheapestProveedorNombre,
                                })}
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
                        {t('recipes.preparacionLote.lanzarPedidoFaltantes')}
                      </Button>
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ borderRadius: 2 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700 }}>
                        {t('recipes.preparacionLote.stockOk')}
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
            {t('comun.cancelar')}
          </Button>
          <Button
            variant="contained"
            color={hasMissingIngredients ? 'error' : 'success'}
            onClick={() => void handleConfirmCook()}
            disabled={
              isCooking ||
              !cookData.ubicacionId ||
              cookData.items.some(
                (i) => !isCantidadObjetivoModalValida(i.cantidadAProducir)
              ) ||
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
              ? t('recipes.preparacionLote.iniciarLote')
              : t('recipes.preparacionLote.iniciarPreparacion')}
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
              {t('recipes.preparacionLote.crearPedidoFaltantes')}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Recetas;
