import React, { useState } from 'react';
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
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import {
  CreateAjusteManualInventarioPayload,
  InventarioItem,
} from '../../services/inventario.types';
import { createAjusteManualInventario } from '../../services/inventario.service';
import { useToast } from '../../store/toast.hooks';
import ReportProblemIcon from '@mui/icons-material/ReportProblemOutlined';
import DynamicFormModal, { DynamicField } from '../ui/DynamicFormModal';
import { SelectOption } from '../ui/Select';
import { mermaSchema } from '../../utils/schemas';
import { createMerma } from '../../services/merma.service';
import { MotivoMerma } from '../../services/merma.types';
import { fetchAllProductos } from '../../services/producto.service';
import { useTranslation } from 'react-i18next';

const AUDIT_MANUAL_REASON = 'Ajuste de auditoria desde inventario';

/**
 * Parses a raw adjustment string input into a finite number or null.
 *
 * @param value - The raw string from the adjustment text field.
 * @returns The parsed number, or null if the value is empty or non-finite.
 */
const parseAdjustmentValue = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const MEASURABLE_STOCK_UNITS = new Set(['KG', 'G', 'L', 'ML']);

/**
 * Formats a stock unit value as a fixed-precision string with the "uds" suffix.
 *
 * @param value - The numeric stock count.
 * @returns Formatted string, e.g. "3.00 uds".
 */
const formatStockUnits = (value: number): string => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(2)} uds`;
};

/**
 * Formats a measurement value with automatic unit upgrade (mL→L, g→kg).
 *
 * @param value - The numeric measurement value.
 * @param unit  - The base unit string (e.g. "ML", "G").
 * @returns Formatted string with the appropriate unit label.
 */
const formatEquivalentAmount = (value: number, unit: string): string => {
  if (unit === 'ML' && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} L`;
  }

  if (unit === 'G' && Math.abs(value) >= 1000) {
    return `${(value / 1000).toFixed(2)} KG`;
  }

  return `${value.toFixed(2)} ${unit}`;
};

/**
 * Calculates the equivalent measurable amount from stock units and the product
 * construction metadata.  Returns null when the unit is not measurable or
 * the conversion data is missing.
 *
 * @param stockUnits         - Number of stock units.
 * @param contenidoPorUnidad - Product content per stock unit (e.g. 330 for 330 mL).
 * @param unidadContenido    - Unit of measurement (e.g. "ML", "G").
 * @returns Formatted equivalent string prefixed with "≈", or null.
 */
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

/**
 * Builds a human-readable product construction label, e.g. "1 ud stock = 330.00 ML".
 * Returns null when the unit is not measurable or conversion data is missing.
 *
 * @param contenidoPorUnidad - Product content per stock unit.
 * @param unidadContenido    - Unit of measurement.
 * @returns Construction label string or null.
 */
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

  return `1 ud stock = ${contenidoPorUnidad.toFixed(2)} ${normalizedUnit}`;
};

/**
 * Formats a product measure label combining the content amount and its unit.
 * Returns null if either argument is missing or non-finite.
 *
 * @param contenido - Numeric content amount.
 * @param unidad    - Unit of measurement string.
 * @returns Label string like "330 ML", or null.
 */
const formatProductoMedidaLabel = (
  contenido?: number,
  unidad?: string
): string | null => {
  if (!contenido || !Number.isFinite(contenido) || !unidad) {
    return null;
  }

  return `${contenido} ${unidad}`;
};

/** Props for the {@link InventoryDetailModal} component. */
interface InventoryDetailModalProps {
  open: boolean;
  mode: 'view' | 'audit';
  productoId: string | null;
  items: InventarioItem[];
  onClose: () => void;
  onRefreshItem: () => void | Promise<void>;
}

/**
 * Modal dialog that displays batch-level inventory details for a given product.
 *
 * In `view` mode it shows the current stock per batch (read-only).
 * In `audit` mode it allows the user to enter per-batch stock adjustments and
 * save them individually.  A "Report Wastage" shortcut opens a sub-modal.
 *
 * @param props - {@link InventoryDetailModalProps}
 */
const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({
  open,
  mode,
  productoId,
  items,
  onClose,
  onRefreshItem,
}) => {
  const toast = useToast();
  const { t } = useTranslation();
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

  // Initialize local edit state ONLY when modal opens
  React.useEffect(() => {
    if (open) {
      const initialAdjustments: Record<string, string> = {};
      relevantItems.forEach((item) => {
        initialAdjustments[item.id] = '';
      });
      setStockAdjustments(initialAdjustments);
      setIsSaving({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, productoId]);

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

  /**
   * Returns an inline validation error message for the adjustment field of a
   * given inventory item, or null when the value is valid.
   *
   * @param item         - The inventory item being validated.
   * @param requireValue - When true, an empty value also triggers an error.
   * @returns Error string or null.
   */
  const getAdjustmentError = (
    item: InventarioItem,
    requireValue: boolean
  ): string | null => {
    const rawValue = stockAdjustments[item.id]?.trim() ?? '';
    if (!rawValue) {
      return requireValue ? 'Introduce un ajuste distinto de 0.' : null;
    }

    const adjustment = parseAdjustmentValue(rawValue);
    if (adjustment === null) {
      return 'Introduce un numero valido.';
    }

    if (adjustment === 0) {
      return 'El ajuste no puede ser 0.';
    }

    const currentStock = Number(item.cantidadActual) || 0;
    if (currentStock + adjustment < 0) {
      return 'El ajuste no puede dejar el stock en negativo.';
    }

    return null;
  };

  /**
   * Updates the local adjustment input value for a specific inventory item.
   *
   * @param id    - The inventory item ID.
   * @param value - The new raw text value from the TextField.
   */
  const handleAdjustmentChange = (id: string, value: string) => {
    setStockAdjustments((prev) => ({ ...prev, [id]: value }));
  };

  /**
   * Validates and persists the stock adjustment for a single inventory batch.
   * Displays toast feedback on success or failure.
   *
   * @param item - The inventory item whose adjustment should be saved.
   */
  const handleSaveAdjustment = async (item: InventarioItem) => {
    const validationError = getAdjustmentError(item, true);
    if (validationError) {
      toast.error(validationError);
      return;
    }

    const adjustment = parseAdjustmentValue(stockAdjustments[item.id]);
    if (adjustment === null) {
      toast.error('No se pudo interpretar el ajuste de stock.');
      return;
    }

    const payload: CreateAjusteManualInventarioPayload = {
      inventarioId: item.id,
      tipo: adjustment > 0 ? 'entrada' : 'salida_ajuste',
      ajuste: adjustment,
      motivo: AUDIT_MANUAL_REASON,
    };

    setIsSaving((prev) => ({ ...prev, [item.id]: true }));
    try {
      await createAjusteManualInventario(payload);
      setStockAdjustments((prev) => ({ ...prev, [item.id]: '' }));
      toast.success(t('inventario.detalle.toast.ajusteAplicado'));
      onRefreshItem();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : t('inventario.detalle.toast.errorAjuste');

      if (errorMessage.toLowerCase().includes('inventario no encontrado')) {
        await onRefreshItem();
        setStockAdjustments((prev) => ({ ...prev, [item.id]: '' }));
        toast.error(t('inventario.detalle.toast.loteNoExiste'));
      } else {
        toast.error(errorMessage);
      }
    } finally {
      setIsSaving((prev) => ({ ...prev, [item.id]: false }));
    }
  };

  /**
   * Loads the product options list lazily (only on first open) and opens the
   * wastage sub-modal.
   */
  const handleOpenMerma = async () => {
    if (productosOptions.length === 0) {
      const productos = await fetchAllProductos();
      setProductosOptions(
        productos.map((p) => ({
          value: p.id,
          label: formatProductoMedidaLabel(p.contenido, p.unidad)
            ? `${p.nombre} · ${formatProductoMedidaLabel(p.contenido, p.unidad)} por unidad`
            : p.nombre,
        }))
      );
    }
    setIsMermaModalOpen(true);
  };

  /**
   * Submits the wastage form data to the API.
   * Closes the sub-modal and refreshes inventory on success.
   *
   * @param formData - Key-value map of form field values from DynamicFormModal.
   */
  const handleSaveMerma = async (formData: Record<string, string | number>) => {
    setIsSavingMerma(true);
    try {
      await createMerma({
        productoId: String(formData.productoId),
        cantidad: Number(formData.cantidad),
        motivo: formData.motivo as MotivoMerma,
        notas: formData.notas as string | undefined,
      });
      toast.success(t('inventario.detalle.toast.mermaRegistrada'));
      setIsMermaModalOpen(false);
      onRefreshItem();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : t('inventario.detalle.toast.errorMerma');
      toast.error(message);
    } finally {
      setIsSavingMerma(false);
    }
  };

  const dynamicMermaSchema: DynamicField[] = mermaSchema.map((field) => {
    if (field.name === 'productoId') {
      return { ...field, options: productosOptions, defaultValue: productoId };
    }
    return field;
  });

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle component="div">
        <Typography variant="h6" component="h2">
          {mode === 'audit' ? t('inventario.detalle.auditarTitulo') : t('inventario.detalle.detalleLotesTitulo')}
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
            {t('inventario.detalle.instruccion')}
          </Typography>
        )}
        {mode === 'audit' && productConstruction && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: 'block' }}
          >
            Construcción del producto: {productConstruction}
          </Typography>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {relevantItems.length === 0 ? (
          <Typography color="text.secondary">
            {t('inventario.detalle.sinLotes')}
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
                  {t('inventario.detalle.resumen')}
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
                      {t('inventario.detalle.stockActual')}
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
                      {t('inventario.detalle.ajustePendiente')}
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
                      {t('inventario.detalle.stockProyectado')}
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
                    <TableCell>{t('inventario.detalle.loteId')}</TableCell>
                    <TableCell>{t('comun.proveedor')}</TableCell>
                    <TableCell>{t('comun.ubicacion')}</TableCell>
                    <TableCell>{t('inventario.detalle.caducidad')}</TableCell>
                    {mode === 'audit' ? (
                      <>
                        <TableCell align="right">{t('inventario.detalle.stockActualUds')}</TableCell>
                        <TableCell align="right">
                          {t('inventario.detalle.ajusteUds')}
                        </TableCell>
                        <TableCell align="right">
                          {t('inventario.detalle.stockResultante')}
                        </TableCell>
                        <TableCell align="center">Acción</TableCell>
                      </>
                    ) : (
                      <TableCell align="right">Cantidad actual (uds)</TableCell>
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
                            ? new Date(lote.fechaCaducidad).toLocaleDateString()
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
                                type="number"
                                value={adjustmentInput}
                                onChange={(e) =>
                                  handleAdjustmentChange(
                                    lote.id,
                                    e.target.value
                                  )
                                }
                                placeholder="+2 / -1"
                                error={Boolean(fieldError)}
                                helperText={
                                  fieldError ??
                                  'Ajuste en unidades de envase (+/-)'
                                }
                                sx={{ width: '170px' }}
                                inputProps={{
                                  step: 'any',
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
                            <TableCell align="center">
                              <IconButton
                                color="primary"
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
          {t('inventario.detalle.reportarMerma')}
        </Button>
        <Box>
          <Button onClick={onClose} variant="contained" color="primary">
            {mode === 'audit' ? t('inventario.detalle.cerrarAuditoria') : t('comun.cerrar')}
          </Button>
        </Box>
      </DialogActions>

      <DynamicFormModal
        isOpen={isMermaModalOpen}
        onClose={() => setIsMermaModalOpen(false)}
        title={t('inventario.detalle.registrarMerma')}
        fields={dynamicMermaSchema}
        onSubmit={handleSaveMerma}
        isSubmitting={isSavingMerma}
        initialData={{ productoId }}
        requireConfirmation={true}
        confirmationMessage={t('inventario.detalle.confirmarMerma')}
      />
    </Dialog>
  );
};

export default InventoryDetailModal;
