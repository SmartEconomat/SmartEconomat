import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Box,
  FormControl,
  Select,
  MenuItem,
  Stack,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SyncAltIcon from '@mui/icons-material/SyncAlt';
import {
  CreateAjusteManualInventarioPayload,
  InventarioItem,
} from '../../services/inventario.types';
import {
  createAjusteManualInventario,
  ejecutarTransferenciaInventario,
} from '../../services/inventario.service';
import { useToast } from '../../store/toast.hooks';
import ReportProblemIcon from '@mui/icons-material/ReportProblemOutlined';
import DynamicFormModal, { DynamicField } from '../ui/DynamicFormModal';
import { SelectOption } from '../ui/Select';
import { mermaSchema } from '../../utils/schemas';
import { createMerma } from '../../services/merma.service';
import { MotivoMerma } from '../../services/merma.types';
import { fetchProductosPaginated } from '../../services/producto.service';
import { formatLocalizedDate } from '../../utils/intlFormat';
import {
  normalizeNumericInput,
  parseLocalizedNumber,
} from '../../utils/numberUtils';
import { UbicacionService } from '../../services/ubicacion.service';
import type { Ubicacion } from '../../services/ubicacion.types';

const AUDIT_MANUAL_REASON_KEY = 'inventario.detalle.auditManualReason';
const MERMA_PRODUCT_SEARCH_LIMIT = 20;

const parseAdjustmentValue = (value: string | undefined): number | null => {
  if (!value) return null;
  return parseLocalizedNumber(value);
};

const MEASURABLE_STOCK_UNITS = new Set(['KG', 'G', 'L', 'ML']);

// Moved helpers inside component or they take t

const formatProductoMedidaLabel = (
  contenido?: number,
  unidad?: string
): string | null => {
  if (!contenido || !Number.isFinite(contenido) || !unidad) {
    return null;
  }

  return `${contenido} ${unidad}`;
};

interface InventoryDetailModalProps {
  open: boolean;
  mode: 'view' | 'audit';
  productoId: string | null;
  items: InventarioItem[];
  onClose: () => void;
  onRefreshItem: () => void | Promise<void>;
  /** Habilita traslados formales cuando el servidor concede inventario:transferir. */
  canTransferStock?: boolean;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({
  open,
  mode,
  productoId,
  items,
  onClose,
  onRefreshItem,
  canTransferStock = false,
}) => {
  const { t } = useTranslation();
  const toast = useToast();

  const formatStockUnits = (value: number): string => {
    const safeValue = Number.isFinite(value) ? value : 0;
    return `${safeValue.toFixed(2)} ${t('comun.elementos')}`;
  };

  const formatEquivalentAmount = (value: number, unit: string): string => {
    if (unit === 'ML' && Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(2)} L`;
    }

    if (unit === 'G' && Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(2)} KG`;
    }

    return `${value.toFixed(2)} ${unit}`;
  };

  const formatEquivalentFromConstruction = (
    stockUnits: number,
    contenidoPorUnidad?: number,
    unidadContenido?: string
  ): string | null => {
    const normalizedUnit = unidadContenido?.toUpperCase();
    if (!normalizedUnit || !MEASURABLE_STOCK_UNITS.has(normalizedUnit)) {
      return null;
    }

    if (!contenidoPorUnidad || !Number.isFinite(contenidoPorUnidad)) {
      return null;
    }

    const equivalent = stockUnits * contenidoPorUnidad;
    return `≈ ${formatEquivalentAmount(equivalent, normalizedUnit)}`;
  };

  const formatProductConstruction = (
    contenidoPorUnidad?: number,
    unidadContenido?: string
  ): string | null => {
    const normalizedUnit = unidadContenido?.toUpperCase();
    if (!normalizedUnit || !MEASURABLE_STOCK_UNITS.has(normalizedUnit)) {
      return null;
    }

    if (!contenidoPorUnidad || !Number.isFinite(contenidoPorUnidad)) {
      return null;
    }

    return t('inventario.detalle.productConstruction', {
      contenido: contenidoPorUnidad.toFixed(2),
      unidad: normalizedUnit,
    });
  };
  // Filter items matching the product – memoized to avoid new reference each render
  const relevantItems = React.useMemo(
    () =>
      items.filter(
        (item) =>
          item.productoProveedor?.producto?.id === productoId && !item.deletedAt
      ),
    [items, productoId]
  );
  const productName =
    relevantItems[0]?.productoProveedor?.producto?.nombre || 'Producto';
  const productMeasureUnit =
    relevantItems[0]?.productoProveedor?.producto?.unidad;
  const productContentRaw = Number(
    relevantItems[0]?.productoProveedor?.producto?.contenido
  );
  const productContentPerUnit =
    Number.isFinite(productContentRaw) && productContentRaw > 0
      ? productContentRaw
      : undefined;
  const productConstruction = formatProductConstruction(
    productContentPerUnit,
    productMeasureUnit
  );

  // Local state for audit mode edits
  const [stockAdjustments, setStockAdjustments] = useState<
    Record<string, string>
  >({});
  const [isSaving, setIsSaving] = useState<Record<string, boolean>>({});
  const [isMermaModalOpen, setIsMermaModalOpen] = useState(false);
  const [isSavingMerma, setIsSavingMerma] = useState(false);
  const [productosOptions, setProductosOptions] = useState<SelectOption[]>([]);
  const [isSearchingProductos, setIsSearchingProductos] = useState(false);
  const mermaProductSearchRequestIdRef = React.useRef(0);
  const [ubicacionesTransfer, setUbicacionesTransfer] = useState<Ubicacion[]>(
    []
  );
  const [loadingUbicacionesTransfer, setLoadingUbicacionesTransfer] =
    useState(false);
  const [transferDestinoByLote, setTransferDestinoByLote] = useState<
    Record<string, string>
  >({});
  const [transferCantidadByLote, setTransferCantidadByLote] = useState<
    Record<string, string>
  >({});
  const [isTransferring, setIsTransferring] = useState<Record<string, boolean>>(
    {}
  );

  React.useEffect(() => {
    if (!open || !canTransferStock || mode !== 'audit') {
      return;
    }
    setLoadingUbicacionesTransfer(true);
    void UbicacionService.findAll()
      .then((list) => {
        setUbicacionesTransfer(list);
      })
      .catch((err: unknown) => {
        console.error(err);
        toast.error(t('inventario.detalle.transfer.errors.cargarUbicaciones'));
        setUbicacionesTransfer([]);
      })
      .finally(() => setLoadingUbicacionesTransfer(false));
  }, [open, mode, canTransferStock, t, toast]);

  React.useEffect(() => {
    if (!open || !canTransferStock) {
      return;
    }
    setTransferDestinoByLote({});
    setTransferCantidadByLote({});
    setIsTransferring({});
  }, [open, canTransferStock, productoId]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    setStockAdjustments((prev) => {
      const next: Record<string, string> = {};
      for (const item of relevantItems) {
        next[item.id] = prev[item.id] ?? '';
      }
      return next;
    });
    setIsSaving({});
  }, [open, productoId, relevantItems]);

  const totalCurrentStock = React.useMemo(
    () =>
      relevantItems.reduce(
        (sum, item) => sum + (Number(item.cantidadActual) || 0),
        0
      ),
    [relevantItems]
  );

  const totalProjectedStock = React.useMemo(
    () =>
      relevantItems.reduce((sum, item) => {
        const currentStock = Number(item.cantidadActual) || 0;
        const adjustment = parseAdjustmentValue(stockAdjustments[item.id]);
        return sum + currentStock + (adjustment ?? 0);
      }, 0),
    [relevantItems, stockAdjustments]
  );

  const totalDeltaStock = totalProjectedStock - totalCurrentStock;

  const totalProjectedColor =
    totalDeltaStock > 0
      ? 'success.main'
      : totalDeltaStock < 0
        ? 'warning.main'
        : 'text.primary';

  const getAdjustmentError = (
    item: InventarioItem,
    requireValue: boolean
  ): string | null => {
    const rawValue = stockAdjustments[item.id]?.trim() ?? '';
    if (!rawValue) {
      return requireValue ? t('inventario.detalle.errorRequireValue') : null;
    }

    const adjustment = parseAdjustmentValue(rawValue);
    if (adjustment === null) {
      return t('inventario.detalle.errorInvalidNumber');
    }

    if (adjustment === 0) {
      return t('inventario.detalle.errorZeroAdjustment');
    }

    const currentStock = Number(item.cantidadActual) || 0;
    if (currentStock + adjustment < 0) {
      return t('inventario.detalle.errorNegativeStock');
    }

    return null;
  };

  const handleAdjustmentChange = (id: string, value: string) => {
    setStockAdjustments((prev) => ({ ...prev, [id]: value }));
  };

  const handleSaveAdjustment = async (item: InventarioItem) => {
    const validationError = getAdjustmentError(item, true);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const adjustment = parseAdjustmentValue(stockAdjustments[item.id]);
    if (adjustment === null) {
      toast.error(t('inventario.detalle.toast.errorParseAdjustment'));
      return;
    }

    const payload: CreateAjusteManualInventarioPayload = {
      inventarioId: item.id,
      tipo: adjustment > 0 ? 'entrada' : 'salida_ajuste',
      ajuste: adjustment,
      motivo: t(AUDIT_MANUAL_REASON_KEY),
    };

    setIsSaving((prev) => ({ ...prev, [item.id]: true }));
    try {
      await createAjusteManualInventario(payload);
      setStockAdjustments((prev) => ({ ...prev, [item.id]: '' }));
      toast.success(t('inventario.detalle.toast.adjustSuccessful'));
      onRefreshItem();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('inventario.detalle.toast.errorParseAdjustment');

      if (errorMessage.toLowerCase().includes('inventario no encontrado')) {
        await onRefreshItem();
        setStockAdjustments((prev) => ({ ...prev, [item.id]: '' }));
        toast.error(t('inventario.detalle.toast.batchNotFound'));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  const resolveTransferQty = (
    inventarioItem: InventarioItem
  ): { ok: false } | { ok: true; value: number } => {
    const raw = transferCantidadByLote[inventarioItem.id]?.trim() ?? '';
    if (!raw) {
      return { ok: false };
    }
    const parsed = parseLocalizedNumber(raw);
    if (parsed === null || !Number.isFinite(parsed) || parsed <= 0) {
      return { ok: false };
    }
    const max = Number(inventarioItem.cantidadActual);
    if (parsed > max + 1e-9) {
      return { ok: false };
    }
    return { ok: true, value: parsed };
  };

  const handleExecuteTransfer = async (inventarioItem: InventarioItem) => {
    const destId = transferDestinoByLote[inventarioItem.id]?.trim();
    if (!destId) {
      toast.error(t('inventario.detalle.transfer.errors.sinDestino'));
      return;
    }
    const origenUb = inventarioItem.ubicacion?.id ?? null;
    if (origenUb !== null && destId === origenUb) {
      toast.error(t('inventario.detalle.transfer.errors.mismoNodo'));
      return;
    }
    const qtyCheck = resolveTransferQty(inventarioItem);
    if (!qtyCheck.ok) {
      toast.error(t('inventario.detalle.transfer.errors.cantidadInvalida'));
      return;
    }

    const idempotency =
      typeof globalThis.crypto !== 'undefined' &&
      typeof globalThis.crypto.randomUUID === 'function'
        ? globalThis.crypto.randomUUID()
        : `fe-${inventarioItem.id}-${destId}-${Date.now()}`;

    setIsTransferring((prev) => ({ ...prev, [inventarioItem.id]: true }));
    try {
      await ejecutarTransferenciaInventario({
        idempotenciaKey: idempotency,
        lineas: [
          {
            inventarioOrigenId: inventarioItem.id,
            ubicacionDestinoId: destId,
            cantidad: qtyCheck.value,
          },
        ],
      });
      toast.success(t('inventario.detalle.transfer.toast.ok'));
      setTransferCantidadByLote((prev) => ({
        ...prev,
        [inventarioItem.id]: '',
      }));
      await onRefreshItem();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('inventario.detalle.transfer.errors.generico');
      toast.error(message);
    } finally {
      setIsTransferring((prev) => ({ ...prev, [inventarioItem.id]: false }));
    }
  };

  const selectedProductOption = React.useMemo<SelectOption | null>(() => {
    if (!productoId) {
      return null;
    }

    const medida = formatProductoMedidaLabel(
      productContentPerUnit,
      productMeasureUnit
    );

    return {
      value: productoId,
      label: medida
        ? `${productName} · ${medida} ${t('comun.porUnidad')}`
        : productName,
    };
  }, [productoId, productContentPerUnit, productMeasureUnit, productName, t]);

  const searchMermaProductos = React.useCallback(
    async (query: string) => {
      const normalizedQuery = query.trim();
      const requestId = ++mermaProductSearchRequestIdRef.current;

      setIsSearchingProductos(true);
      try {
        const response = await fetchProductosPaginated({
          page: 1,
          limit: MERMA_PRODUCT_SEARCH_LIMIT,
          searchTerm: normalizedQuery || undefined,
          sortBy: 'nombre',
          order: 'ASC',
        });

        if (requestId !== mermaProductSearchRequestIdRef.current) {
          return;
        }

        const fetchedOptions: SelectOption[] = response.data.map((p) => ({
          value: p.id,
          label: formatProductoMedidaLabel(p.contenido, p.unidad)
            ? `${p.nombre} · ${formatProductoMedidaLabel(p.contenido, p.unidad)} ${t('comun.porUnidad')}`
            : p.nombre,
        }));

        setProductosOptions(() => {
          const merged = new Map<string | number, SelectOption>();
          if (selectedProductOption) {
            merged.set(selectedProductOption.value, selectedProductOption);
          }
          fetchedOptions.forEach((option) => {
            merged.set(option.value, option);
          });
          return Array.from(merged.values());
        });
      } catch (err) {
        console.error('Error buscando productos para merma:', err);
      } finally {
        if (requestId === mermaProductSearchRequestIdRef.current) {
          setIsSearchingProductos(false);
        }
      }
    },
    [selectedProductOption, t]
  );

  const handleOpenMerma = () => {
    if (selectedProductOption) {
      setProductosOptions([selectedProductOption]);
    } else {
      setProductosOptions([]);
    }

    setIsMermaModalOpen(true);
    void searchMermaProductos('');
  };

  const handleSaveMerma = async (formData: Record<string, unknown>) => {
    setIsSavingMerma(true);
    try {
      await createMerma({
        productoId: String(formData.productoId),
        cantidad: Number(formData.cantidad),
        motivo: formData.motivo as MotivoMerma,
        notas: formData.notas as string | undefined,
      });
      toast.success(t('inventario.detalle.toast.wasteSuccess'));
      setIsMermaModalOpen(false);
      onRefreshItem();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('inventario.detalle.toast.wasteError');
      toast.error(message);
    } finally {
      setIsSavingMerma(false);
    }
  };

  const dynamicMermaSchema: DynamicField[] = React.useMemo(
    () =>
      mermaSchema.map((field) => {
        if (field.name === 'productoId') {
          return {
            ...field,
            type: 'autocomplete' as const,
            options: productosOptions,
            defaultValue: productoId,
            onSearch: (query: string) => {
              void searchMermaProductos(query);
            },
            loading: isSearchingProductos,
          };
        }
        return field;
      }),
    [isSearchingProductos, productoId, productosOptions, searchMermaProductos]
  );

  const mermaInitialData = React.useMemo(() => ({ productoId }), [productoId]);

  return (
    <Dialog
      data-testid="inventario-detalle-modal"
      open={open}
      onClose={onClose}
      maxWidth={mode === 'audit' && canTransferStock ? 'lg' : 'md'}
      fullWidth
    >
      <DialogTitle component="div">
        <Typography variant="h6" component="h2">
          {mode === 'audit'
            ? t('inventario.detalle.auditTitle')
            : t('inventario.detalle.detailTitle')}
        </Typography>
        <Typography
          variant="subtitle2"
          component="span"
          color="text.secondary"
          sx={{ display: 'block' }}
        >
          {productName}
        </Typography>
        {mode === 'audit' && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block', mt: 0.5 }}
          >
            {t('inventario.detalle.auditReadOnlyHint')}
          </Typography>
        )}
        {mode === 'audit' && productConstruction && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
          >
            {productConstruction}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {relevantItems.length === 0 ? (
          <Typography color="text.secondary">
            {t('inventario.detalle.noBatches')}
          </Typography>
        ) : (
          <>
            {mode === 'audit' && (
              <Box
                sx={{
                  mb: 2,
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'background.default',
                }}
              >
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('inventario.detalle.auditSummary')}
                </Typography>
                <Box
                  sx={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 3,
                    alignItems: 'flex-start',
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('inventario.detalle.currentStock')}
                    </Typography>
                    <Typography variant="h6">
                      {formatStockUnits(totalCurrentStock)}
                    </Typography>
                    {formatEquivalentFromConstruction(
                      totalCurrentStock,
                      productContentPerUnit,
                      productMeasureUnit
                    ) && (
                      <Typography variant="caption" color="text.secondary">
                        {formatEquivalentFromConstruction(
                          totalCurrentStock,
                          productContentPerUnit,
                          productMeasureUnit
                        )}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('inventario.detalle.pendingAdjustment')}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: totalProjectedColor }}
                    >
                      {totalDeltaStock > 0 ? '+' : ''}
                      {formatStockUnits(totalDeltaStock)}
                    </Typography>
                    {formatEquivalentFromConstruction(
                      totalDeltaStock,
                      productContentPerUnit,
                      productMeasureUnit
                    ) && (
                      <Typography variant="caption" color="text.secondary">
                        {formatEquivalentFromConstruction(
                          totalDeltaStock,
                          productContentPerUnit,
                          productMeasureUnit
                        )}
                      </Typography>
                    )}
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      {t('inventario.detalle.projectedStock')}
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{ color: totalProjectedColor }}
                    >
                      {formatStockUnits(totalProjectedStock)}
                    </Typography>
                    {formatEquivalentFromConstruction(
                      totalProjectedStock,
                      productContentPerUnit,
                      productMeasureUnit
                    ) && (
                      <Typography variant="caption" color="text.secondary">
                        {formatEquivalentFromConstruction(
                          totalProjectedStock,
                          productContentPerUnit,
                          productMeasureUnit
                        )}
                      </Typography>
                    )}
                  </Box>
                </Box>
              </Box>
            )}

            <TableContainer component={Paper} elevation={0} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>
                      {t('inventario.detalle.columns.batchId')}
                    </TableCell>
                    <TableCell>
                      {t('inventario.detalle.columns.supplier')}
                    </TableCell>
                    <TableCell>
                      {t('inventario.detalle.columns.location')}
                    </TableCell>
                    <TableCell>
                      {t('inventario.detalle.columns.expiry')}
                    </TableCell>
                    {mode === 'audit' ? (
                      <>
                        <TableCell align="right">
                          {t('inventario.detalle.columns.currentStockUnits')}
                        </TableCell>
                        <TableCell align="right">
                          {t('inventario.detalle.columns.adjustment')}
                        </TableCell>
                        <TableCell align="right">
                          {t('inventario.detalle.columns.resultingStock')}
                        </TableCell>
                        {canTransferStock ? (
                          <TableCell align="center" sx={{ minWidth: 260 }}>
                            {t('inventario.detalle.columns.transfer')}
                          </TableCell>
                        ) : null}
                        <TableCell align="center">
                          {t('inventario.detalle.columns.action')}
                        </TableCell>
                      </>
                    ) : (
                      <TableCell align="right">
                        {t('inventario.detalle.columns.currentQty')}
                      </TableCell>
                    )}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {relevantItems.map((lote) => {
                    const currentStock = Number(lote.cantidadActual) || 0;
                    const adjustmentInput = stockAdjustments[lote.id] ?? '';
                    const adjustment = parseAdjustmentValue(adjustmentInput);
                    const projectedStock = currentStock + (adjustment ?? 0);
                    const hasInput = adjustmentInput.trim().length > 0;
                    const fieldError =
                      mode === 'audit' && hasInput
                        ? getAdjustmentError(lote, false)
                        : null;
                    const saveError =
                      mode === 'audit' ? getAdjustmentError(lote, true) : null;
                    const projectedStockColor =
                      projectedStock < 0
                        ? 'error.main'
                        : (adjustment ?? 0) > 0
                          ? 'success.main'
                          : (adjustment ?? 0) < 0
                            ? 'warning.main'
                            : 'text.primary';
                    const equivalentCurrent = formatEquivalentFromConstruction(
                      currentStock,
                      productContentPerUnit,
                      productMeasureUnit
                    );
                    const equivalentProjected =
                      formatEquivalentFromConstruction(
                        projectedStock,
                        productContentPerUnit,
                        productMeasureUnit
                      );

                    return (
                      <TableRow key={lote.id}>
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{ fontFamily: 'monospace' }}
                          >
                            {lote.id.split('-')[0]}...
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {lote.productoProveedor?.proveedor?.nombre || '—'}
                        </TableCell>
                        <TableCell>{lote.ubicacion?.nombre || '—'}</TableCell>
                        <TableCell>
                          {lote.fechaCaducidad
                            ? formatLocalizedDate(lote.fechaCaducidad)
                            : '—'}
                        </TableCell>

                        {mode === 'audit' ? (
                          <>
                            <TableCell align="right">
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography variant="body2" fontWeight={500}>
                                  {formatStockUnits(currentStock)}
                                </Typography>
                                {equivalentCurrent ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {equivalentCurrent}
                                  </Typography>
                                ) : null}
                              </Box>
                            </TableCell>
                            <TableCell align="right" sx={{ minWidth: 200 }}>
                              <TextField
                                size="small"
                                type="text"
                                value={adjustmentInput}
                                onChange={(e) => {
                                  const normalized = normalizeNumericInput(
                                    e.target.value,
                                    true
                                  );
                                  handleAdjustmentChange(lote.id, normalized);
                                }}
                                placeholder="+2 / -1"
                                error={Boolean(fieldError)}
                                helperText={
                                  fieldError ??
                                  t('inventario.detalle.adjustmentHelperText')
                                }
                                sx={{ width: '170px' }}
                                inputProps={{
                                  inputMode: 'decimal',
                                  pattern: '^-?[0-9]*[.,]?[0-9]*',
                                  style: { textAlign: 'right' },
                                }}
                                disabled={isSaving[lote.id]}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ textAlign: 'right' }}>
                                <Typography
                                  variant="body2"
                                  fontWeight={600}
                                  sx={{ color: projectedStockColor }}
                                >
                                  {formatStockUnits(projectedStock)}
                                </Typography>
                                {equivalentProjected ? (
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {equivalentProjected}
                                  </Typography>
                                ) : null}
                              </Box>
                            </TableCell>
                            {canTransferStock ? (
                              <TableCell align="center">
                                {(() => {
                                  const opcionesDestino =
                                    ubicacionesTransfer.filter(
                                      (u) => u.id !== lote.ubicacion?.id
                                    );
                                  return opcionesDestino.length === 0 &&
                                    !loadingUbicacionesTransfer ? (
                                    <Typography
                                      variant="caption"
                                      color="text.secondary"
                                    >
                                      {t(
                                        'inventario.detalle.transfer.sinDestinos'
                                      )}
                                    </Typography>
                                  ) : (
                                    <Stack spacing={1} sx={{ py: 0.5 }}>
                                      <FormControl
                                        size="small"
                                        fullWidth
                                        disabled={
                                          loadingUbicacionesTransfer ||
                                          isTransferring[lote.id]
                                        }
                                        sx={{ minWidth: 0 }}
                                      >
                                        <Select<string>
                                          labelId={`inv-tr-dest-${lote.id}`}
                                          id={`inv-tr-dest-select-${lote.id}`}
                                          label={t(
                                            'inventario.detalle.transfer.destino'
                                          )}
                                          value={
                                            transferDestinoByLote[lote.id] ?? ''
                                          }
                                          displayEmpty
                                          onChange={(ev) =>
                                            setTransferDestinoByLote(
                                              (prev) => ({
                                                ...prev,
                                                [lote.id]: String(
                                                  ev.target.value
                                                ),
                                              })
                                            )
                                          }
                                          renderValue={(v) =>
                                            !v ? (
                                              <Typography
                                                component="span"
                                                variant="body2"
                                                color="text.secondary"
                                                sx={{
                                                  overflow: 'hidden',
                                                  textOverflow: 'ellipsis',
                                                  whiteSpace: 'nowrap',
                                                  display: 'block',
                                                  width: '100%',
                                                }}
                                              >
                                                {t(
                                                  'inventario.detalle.transfer.placeholderDestino'
                                                )}
                                              </Typography>
                                            ) : (
                                              (ubicacionesTransfer.find(
                                                (u) => u.id === v
                                              )?.nombre ?? v)
                                            )
                                          }
                                        >
                                          <MenuItem value="">
                                            <em>
                                              {t(
                                                'inventario.detalle.transfer.placeholderDestino'
                                              )}
                                            </em>
                                          </MenuItem>
                                          {opcionesDestino.map((ub) => (
                                            <MenuItem key={ub.id} value={ub.id}>
                                              {ub.nombre}
                                            </MenuItem>
                                          ))}
                                        </Select>
                                      </FormControl>
                                      <TextField
                                        size="small"
                                        fullWidth
                                        label={t(
                                          'inventario.detalle.transfer.cantidad'
                                        )}
                                        value={
                                          transferCantidadByLote[lote.id] ?? ''
                                        }
                                        onChange={(e) =>
                                          setTransferCantidadByLote((prev) => ({
                                            ...prev,
                                            [lote.id]: normalizeNumericInput(
                                              e.target.value,
                                              false
                                            ),
                                          }))
                                        }
                                        disabled={isTransferring[lote.id]}
                                        inputProps={{
                                          inputMode: 'decimal',
                                          style: { textAlign: 'right' },
                                        }}
                                      />
                                      <Box
                                        sx={{
                                          display: 'flex',
                                          justifyContent: 'center',
                                        }}
                                      >
                                        <IconButton
                                          color="secondary"
                                          size="small"
                                          aria-label={t(
                                            'inventario.detalle.transfer.runAria'
                                          )}
                                          onClick={() =>
                                            void handleExecuteTransfer(lote)
                                          }
                                          disabled={
                                            isTransferring[lote.id] ||
                                            loadingUbicacionesTransfer
                                          }
                                          data-testid={`inventario-traslado-submit-${lote.id}`}
                                        >
                                          {isTransferring[lote.id] ? (
                                            <CircularProgress size={22} />
                                          ) : (
                                            <SyncAltIcon fontSize="small" />
                                          )}
                                        </IconButton>
                                      </Box>
                                    </Stack>
                                  );
                                })()}
                              </TableCell>
                            ) : null}
                            <TableCell align="center">
                              <IconButton
                                color="primary"
                                aria-label={t(
                                  'inventario.detalle.saveAdjustmentAria'
                                )}
                                onClick={() => void handleSaveAdjustment(lote)}
                                disabled={
                                  isSaving[lote.id] || Boolean(saveError)
                                }
                              >
                                {isSaving[lote.id] ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <SaveIcon fontSize="small" />
                                )}
                              </IconButton>
                            </TableCell>
                          </>
                        ) : (
                          <TableCell align="right">
                            <Box sx={{ textAlign: 'right' }}>
                              <Typography variant="body2" fontWeight={500}>
                                {formatStockUnits(currentStock)}
                              </Typography>
                              {equivalentCurrent ? (
                                <Typography
                                  variant="caption"
                                  color="text.secondary"
                                >
                                  {equivalentCurrent}
                                </Typography>
                              ) : null}
                            </Box>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2, justifyContent: 'space-between' }}>
        <Button
          startIcon={<ReportProblemIcon />}
          color="error"
          variant="outlined"
          onClick={handleOpenMerma}
        >
          {t('inventario.detalle.reportWaste')}
        </Button>
        <Box>
          <Button onClick={onClose} variant="contained" color="primary">
            {mode === 'audit'
              ? t('inventario.detalle.closeAudit')
              : t('inventario.detalle.close')}
          </Button>
        </Box>
      </DialogActions>

      <DynamicFormModal
        isOpen={isMermaModalOpen}
        onClose={() => setIsMermaModalOpen(false)}
        title={t('inventario.detalle.registerWaste')}
        fields={dynamicMermaSchema}
        onSubmit={handleSaveMerma}
        isSubmitting={isSavingMerma}
        initialData={mermaInitialData}
        requireConfirmation={true}
        confirmationMessage={t('inventario.detalle.wasteWarning')}
      />
    </Dialog>
  );
};

export default InventoryDetailModal;
