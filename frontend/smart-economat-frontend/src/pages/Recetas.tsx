import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import DynamicFormModal, {
  DynamicField,
} from '../components/ui/DynamicFormModal';
import DetailModal, { DetailSection } from '../components/ui/DetailModal';
import RecetaAlergenos from '../components/ui/RecetaAlergenos';
import {
  Receta,
  DificultadReceta,
  TiempoReceta,
  RecetaIngrediente,
  UnidadIngrediente,
} from '../services/receta.types';
import {
  fetchRecetas,
  createReceta,
  updateReceta,
  exportRecipesPdf,
  calculatePreviewCost,
} from '../services/receta.service';
import {
  deleteResource,
  resolveStoredFileUrl,
  uploadFile,
} from '../services/api.service';
import {
  ejecutarProduccion,
  validarStock,
  StockValidationResult,
} from '../services/produccion.service';
import {
  createMissingStockBatch,
  createPurchaseBatchFromRecetas,
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
import RecipeCarousel from '../components/ui/RecipeCarousel';
import PageToolbar from '../components/ui/PageToolbar';

import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import AddIcon from '@mui/icons-material/Add';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import PictureAsPdfOutlinedIcon from '@mui/icons-material/PictureAsPdfOutlined';
import ShoppingCartCheckoutOutlinedIcon from '@mui/icons-material/ShoppingCartCheckoutOutlined';
import { parseLocalizedNumber } from '../utils/numberUtils';
import { DownloadService } from '../services/download.service';

const recetaSchema: DynamicField[] = [
  { name: 'nombre', label: 'Nombre de la Receta', required: true, width: 12 },
  {
    name: 'tiempoPreparacion',
    label: 'Tiempo de preparación',
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
    name: 'rendimiento',
    label: 'Rendimiento estimado',
    type: 'number',
    width: 6,
  },
  {
    name: 'unidadResultado',
    label: 'Unidad',
    type: 'select',
    width: 6,
    options: Object.values(UnidadIngrediente).map((u) => ({
      value: u as string,
      label: u as string,
    })),
  },
  {
    name: 'diasCaducidad',
    label: 'Días de caducidad',
    type: 'number',
    width: 3,
  },
  {
    name: 'costeUnitarioEstimado',
    label: 'Coste est. (info)',
    type: 'number',
    width: 3,
    disabled: true,
  },
  {
    name: 'raciones',
    label: 'Raciones (base)',
    type: 'number',
    width: 3,
  },
  {
    name: 'tamanioRacion',
    label: 'Tamaño ración',
    type: 'number',
    width: 3,
  },
  {
    name: 'ingredientes',
    label: 'Ingredientes de la receta',
    type: 'recipeIngredients',
    position: 'bottom',
  },
  {
    name: 'imagen',
    label: 'Imagen de la receta',
    type: 'image',
    required: false,
    width: 12,
    position: 'left',
  },
];

const RecetaIngredientesView: React.FC<{
  ingredientes?: RecetaIngrediente[];
}> = ({ ingredientes = [] }) => {
  if (ingredientes.length === 0) {
    return (
      <Typography variant="body2" color="text.secondary">
        Sin ingredientes registrados.
      </Typography>
    );
  }

  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead sx={{ bgcolor: 'action.hover' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Producto</TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 100 }}>
              Cantidad
            </TableCell>
            <TableCell sx={{ fontWeight: 'bold', width: 80 }}>Unidad</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Proveedor fav.</TableCell>
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
                    Automático
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
  const [formValueUpdates, setFormValueUpdates] = useState<
    Record<string, unknown>
  >({});
  const lastCalculationRef = useRef<string>('');
  const calculationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (!itemToEdit) {
      setFormValueUpdates({});
      lastCalculationRef.current = '';
      if (calculationTimerRef.current)
        clearTimeout(calculationTimerRef.current);
    }
  }, [itemToEdit]);

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
    // Cargar ubicaciones para el modal de preparación
    UbicacionService.findAll().then(setUbicaciones).catch(console.error);
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
      const normalizeIngredients = (
        ings: Array<{
          productoId?: string;
          producto?: { id: string };
          cantidad: number | string;
          unidad: string;
          mermaAplicada?: number | string;
          proveedorFavoritoId?: string;
        }>
      ) => {
        return ings
          .map((ing) => ({
            productoId: ing.productoId || ing.producto?.id,
            cantidad: Number(ing.cantidad),
            unidad: ing.unidad,
            mermaAplicada: Number(ing.mermaAplicada ?? 0),
            proveedorFavoritoId: ing.proveedorFavoritoId || undefined,
          }))
          .filter((ing) => ing.productoId && ing.cantidad > 0);
      };

      // Extraer minutos del valor seleccionado de tiempo (ej: TiempoReceta.MIN_30 -> 30)
      const getMinutesFromValue = (value: string): number => {
        const match = value?.match(/\d+/);
        return match ? parseInt(match[0]) : 30;
      };

      // Procesar imagen: subir y obtener URL igual que en Productos
      let finalPathImg: string | undefined = undefined;
      if (formData.imagen instanceof File) {
        try {
          finalPathImg = await uploadFile(formData.imagen);
        } catch (err) {
          throw err instanceof Error
            ? err
            : new Error('Hubo un error al subir la imagen de la receta.');
        }
      } else if (
        typeof formData.imagen === 'string' &&
        formData.imagen.trim()
      ) {
        finalPathImg = formData.imagen.trim();
      }

      const payload = {
        nombre: formData.nombre,
        instrucciones: formData.instrucciones,
        tiempoEstimadoMinutos: getMinutesFromValue(
          formData.tiempoPreparacion as string
        ),
        dificultad: formData.dificultad,
        rendimiento:
          parseLocalizedNumber(
            formData.rendimiento as string | number | null | undefined
          ) ?? null,
        unidadResultado: formData.unidadResultado || null,
        diasCaducidad: formData.diasCaducidad
          ? Number(formData.diasCaducidad)
          : null,
        raciones:
          parseLocalizedNumber(
            formData.raciones as string | number | null | undefined
          ) ?? 1,
        tamanioRacion:
          parseLocalizedNumber(
            formData.tamanioRacion as string | number | null | undefined
          ) ?? null,
        ingredientes: normalizeIngredients(
          Array.isArray(formData.ingredientes) ? formData.ingredientes : []
        ),
        ...(finalPathImg && { pathImg: finalPathImg }),
      };
      if (formData.id) {
        await updateReceta(
          String(formData.id),
          payload as unknown as Partial<Receta>
        );
        toast.success('Receta actualizada correctamente.');
      } else {
        await createReceta(payload as unknown as Partial<Receta>);
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
    // Mapear tiempoEstimadoMinutos a la franja de tiempo más cercana
    let tiempoPreparacion = TiempoReceta.MIN_30;
    const mins = row.tiempoEstimadoMinutos;
    if (mins <= 10) tiempoPreparacion = TiempoReceta.MIN_10;
    else if (mins <= 20) tiempoPreparacion = TiempoReceta.MIN_20;
    else if (mins <= 30) tiempoPreparacion = TiempoReceta.MIN_30;
    else if (mins <= 45) tiempoPreparacion = TiempoReceta.MIN_45;
    else tiempoPreparacion = TiempoReceta.MIN_60;

    // Rellenar campo imagen con la url existente
    const imagen = resolveStoredFileUrl(
      row.pathImgOptimized || row.pathImg || ''
    );
    setItemToEdit({ ...row, tiempoPreparacion, imagen } as unknown as Record<
      string,
      unknown
    >);
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
      // El error ya lo maneja el servicio
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

  const handleCreateMissingOrder = async () => {
    if (!stockValidation) return;

    const missing = stockValidation.ingredients.filter((ing) => !ing.isEnough);

    if (missing.length === 0) {
      toast.error(
        'No se encontraron proveedores válidos para los ingredientes faltantes.'
      );
      return;
    }

    setIsCooking(true);
    try {
      const batch = await createMissingStockBatch({
        observaciones: `Pedido automático por falta de stock para: ${cookData.items.map((it) => it.receta.nombre).join(', ')}`,
        items: cookData.items.map((item) => ({
          recetaId: item.receta.id,
          cantidad: item.cantidad,
        })),
      });

      const totalPedidos = batch.pedidos?.length ?? 0;
      toast.success(
        totalPedidos > 0
          ? `Se han generado ${totalPedidos} pedidos para cubrir los faltantes.`
          : 'Se ha generado un lote de pedidos para cubrir los faltantes.'
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

  const handleFormValuesChange = useCallback(
    (formData: Record<string, unknown>) => {
      const ingredientes =
        (formData.ingredientes as Array<{
          productoId?: string;
          producto?: { id: string };
          cantidad?: string | number;
          unidad?: string;
          mermaAplicada?: string | number;
          proveedorFavoritoId?: string;
        }>) || [];
      const rendimiento = Number(formData.rendimiento) || 1;

      // Filtrar ingredientes válidos para evitar llamadas innecesarias
      const validIngredientes = ingredientes
        .map((ing) => ({
          productoId: ing.productoId || ing.producto?.id,
          cantidad: Number(ing.cantidad),
          unidad: ing.unidad,
          mermaAplicada: Number(ing.mermaAplicada ?? 0),
          proveedorFavoritoId: ing.proveedorFavoritoId,
        }))
        .filter((ing) => ing.productoId && ing.cantidad > 0);

      const currentKey = JSON.stringify({
        ingredientes: validIngredientes,
        rendimiento,
      });
      if (currentKey === lastCalculationRef.current) return;
      lastCalculationRef.current = currentKey;

      if (calculationTimerRef.current)
        clearTimeout(calculationTimerRef.current);

      if (validIngredientes.length === 0) {
        setFormValueUpdates({ costeUnitarioEstimado: 0 });
        return;
      }

      calculationTimerRef.current = setTimeout(async () => {
        try {
          const result = await calculatePreviewCost({
            ingredientes: validIngredientes,
            rendimiento: rendimiento > 0 ? rendimiento : 1,
          });

          setFormValueUpdates({
            costeUnitarioEstimado: result.costoUnitarioEstimado,
          });
        } catch (err) {
          console.error('Error recalculando costes:', err);
        }
      }, 600);
    },
    []
  );

  const columns: Column<Receta>[] = [
    {
      id: 'nombre',
      label: 'Nombre',
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
                : `${row.ingredientes?.length ?? 0} ingredientes`}
            </Typography>
          </Box>
        </Box>
      ),
    },
    {
      id: 'dificultad',
      label: 'Dificultad',
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
    },
    {
      id: 'tiempoPreparacion',
      label: 'Tiempo',
      width: 200,
      headerSx: { px: 4 },
      render: (row) => {
        const tiempoLabel =
          row.tiempoPreparacion ||
          (typeof row.tiempoEstimadoMinutos === 'number'
            ? `${row.tiempoEstimadoMinutos} min`
            : null);

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
        ) : null;
      },
      cellSx: { px: 4 },
    },
    {
      id: 'ingredientes',
      label: 'Ingredientes',
      align: 'right',
      width: 170,
      render: (row) => row.ingredientes?.length ?? 0,
      headerSx: { px: 4 },
      cellSx: { whiteSpace: 'nowrap', px: 4 },
      hideOnMobile: true,
    },
  ];

  const canEdit = usePermission('recetas:editar');
  const canDelete = usePermission('recetas:eliminar');
  const canCreate = usePermission('recetas:crear');
  const canCook = usePermission('recetas:cocinar');
  const canExportPdf = usePermission('recetas:ver');
  const canCreateOrders = usePermission('pedidos:crear');

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
        const batch = await createPurchaseBatchFromRecetas({
          recetaIds,
          observaciones: `Pedido generado desde recetas: ${recetas
            .map((receta) => receta.nombre)
            .join(', ')}`,
        });

        toast.success(
          `Lote ${batch.id} generado correctamente desde ${recetaIds.length} receta${recetaIds.length === 1 ? '' : 's'}.`
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
      <Tooltip title="Ver detalles">
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
        <Tooltip title="Preparar ahora">
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
          title: 'Información',
          columns: 3,
          fields: [
            {
              label: 'Dificultad',
              value: itemToView.dificultad ? (
                <StatusChip
                  status={itemToView.dificultad}
                  size="small"
                  variant="outlined"
                />
              ) : undefined,
            },
            { label: 'Franja de tiempo', value: itemToView.tiempo },
            {
              label: 'Tiempo de preparación',
              value: itemToView.tiempoPreparacion,
            },
          ],
        },
        {
          title: 'Instrucciones',
          fields: [
            {
              label: 'Pasos de elaboración',
              value: itemToView.instrucciones,
              fullWidth: true,
            },
          ],
        },
        {
          title: 'Producción',
          columns: 3,
          fields: [
            {
              label: 'Rendimiento',
              value: itemToView.rendimiento
                ? `${itemToView.rendimiento} ${itemToView.unidadResultado}`
                : undefined,
            },
            { label: 'Días de Caducidad', value: itemToView.diasCaducidad },
            {
              label: 'Coste Est. por unidad',
              value: itemToView.costeUnitarioEstimado
                ? `${Number(itemToView.costeUnitarioEstimado).toFixed(4)}€`
                : undefined,
            },
            { label: 'Raciones (base)', value: itemToView.raciones },
            {
              label: 'Tamaño ración',
              value: itemToView.tamanioRacion
                ? `${itemToView.tamanioRacion} ${itemToView.unidadResultado}`
                : undefined,
            },
          ],
        },
        {
          title: 'Ingredientes',
          content: (
            <RecetaIngredientesView ingredientes={itemToView.ingredientes} />
          ),
        },
        {
          title: 'Alérgenos detectados',
          content: <RecetaAlergenos ingredientes={itemToView.ingredientes} />,
        },
      ]
    : [];

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
        primaryAction={
          canCreate
            ? {
                label: 'Nueva Receta',
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
                      ? `Preparar (${selectedIds.length})`
                      : 'Preparar recetas',
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
                      ? `Exportar PDF (${selectedIds.length})`
                      : 'Exportar PDF',
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
          ...(canCreateOrders
            ? [
                {
                  label:
                    selectedIds.length > 0
                      ? `Crear pedido (${selectedIds.length})`
                      : 'Crear pedido',
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
          hideTopBar={false}
          actionsAlign="center"
          viewMode={viewMode}
          defaultViewMode={viewMode}
          selectable={canCook || canExportPdf || canCreateOrders}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
          exportHandlers={{
            onExportPdf: () => {
              const ids =
                selectedIds.length > 0 ? selectedIds : data.map((r) => r.id);
              openExportDialog(ids);
            },
            onExportExcel: handleExportExcel,
            exportLabel: 'recetas filtradas',
          }}
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
              {!searchTerm.trim() && canCreate && (
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
          title={itemToEdit?.id ? 'Editar Receta' : 'Nueva Receta'}
          size="lg"
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
          onValuesChange={handleFormValuesChange}
          valueUpdates={formValueUpdates}
        />

        <DetailModal
          isOpen={!!itemToView}
          onClose={() => setItemToView(null)}
          title={itemToView?.nombre ?? ''}
          subtitle={`${itemToView?.ingredientes?.length ?? 0} ingredientes`}
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
                    Preparar
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
                    Pedido
                  </Button>
                )}
                <Button
                  variant="outlined"
                  color="error"
                  startIcon={<PictureAsPdfOutlinedIcon />}
                  onClick={() => openExportDialog([itemToView!.id])}
                >
                  Ficha PDF
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
          editLabel="Editar receta"
        />

        <Dialog
          open={isExportDialogOpen}
          onClose={() => !isExportingPdf && setIsExportDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>Exportar recetas a PDF</DialogTitle>
          <DialogContent dividers>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {exportIds.length === 1
                ? 'Vas a exportar 1 receta.'
                : `Vas a exportar ${exportIds.length} recetas.`}
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
              label="Incluir imagen de la receta"
            />

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: 'block', mt: 1 }}
            >
              Si la imagen no existe, el PDF se generará igualmente sin ella.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExportingPdf}
            >
              Cancelar
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
              {isExportingPdf ? 'Exportando...' : 'Exportar PDF'}
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
                  ? `Producción en Lote (${cookData.items.length} recetas)`
                  : `Preparar Receta: ${cookData.items[0]?.receta.nombre}`}
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
                Configura las cantidades y valida el stock antes de iniciar.
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
                  <MenuBookOutlinedIcon fontSize="small" /> Recetas a procesar
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
                          Receta
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            width: 100,
                            bgcolor: 'background.paper',
                          }}
                          align="right"
                        >
                          Cantidad
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            width: 100,
                            bgcolor: 'background.paper',
                          }}
                          align="right"
                        >
                          Raciones
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: 700,
                            width: 60,
                            bgcolor: 'background.paper',
                          }}
                        >
                          Und.
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
                                Rendimiento base: {item.receta.rendimiento}{' '}
                                {item.receta.unidadResultado || ''}
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
                      Configuración del Lote
                    </Typography>
                    <Stack spacing={2}>
                      <MuiTextField
                        select
                        label="Ubicación de destino"
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
                        label="Fecha de caducidad (manual)"
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
                        Verificación de Stock
                      </Typography>
                      {isValidatingStock && (
                        <Box
                          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
                        >
                          <CircularProgress size={14} thickness={6} />
                          <Typography variant="caption" color="text.secondary">
                            Garantizando stock...
                          </Typography>
                        </Box>
                      )}
                    </Box>

                    {stockValidation &&
                    stockValidation.ingredients.some((ing) => !ing.isEnough) ? (
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
                          INGREDIENTES INSUFICIENTES
                        </Typography>
                        <Box
                          component="ul"
                          sx={{ m: 0, pl: 2, fontSize: '0.75rem', mb: 1.5 }}
                        >
                          {stockValidation.ingredients
                            .filter((ing) => !ing.isEnough)
                            .map((ing) => (
                              <li key={ing.productoId}>
                                <b>{ing.nombre}</b>: Faltan{' '}
                                {Number(
                                  (ing.requerido - ing.disponible).toFixed(3)
                                )}{' '}
                                {ing.unidad}
                                {ing.cheapestProveedorNombre && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      display: 'block',
                                      fontStyle: 'italic',
                                      opacity: 0.7,
                                    }}
                                  >
                                    (Prov: {ing.cheapestProveedorNombre})
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
                          Lanzar Pedido de Faltantes
                        </Button>
                      </Alert>
                    ) : (
                      <Alert severity="success" sx={{ borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700 }}>
                          Todo en orden. Stock suficiente para procesar este
                          lote.
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
              Cancelar
            </Button>
            <Button
              variant="contained"
              color={
                stockValidation?.ingredients.some((ing) => !ing.isEnough)
                  ? 'error'
                  : 'success'
              }
              onClick={() => void handleConfirmCook()}
              disabled={
                isCooking ||
                !cookData.ubicacionId ||
                cookData.items.some((i) => i.cantidad <= 0) ||
                (stockValidation?.ingredients.some((ing) => !ing.isEnough) ??
                  false)
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
                ? 'Iniciar Producción de Lote'
                : 'Iniciar Preparación'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Recetas;
