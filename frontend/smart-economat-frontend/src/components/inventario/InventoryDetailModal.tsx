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

const AUDIT_MANUAL_REASON = 'Ajuste de auditoria desde inventario';

const parseAdjustmentValue = (value: string | undefined): number | null => {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const MEASURABLE_STOCK_UNITS = new Set(['KG', 'G', 'L', 'ML']);

const formatStockUnits = (value: number): string => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(2)} uds`;
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

  return `1 ud stock = ${contenidoPorUnidad.toFixed(2)} ${normalizedUnit}`;
};

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
  onRefreshItem: () => void;
}

const InventoryDetailModal: React.FC<InventoryDetailModalProps> = ({
  open,
  mode,
  productoId,
  items,
  onClose,
  onRefreshItem,
}) => {
  const toast = useToast();
  // Filter items matching the product – memoized to avoid new reference each render
  const relevantItems = React.useMemo(
    () =>
      items.filter(
        (item) => item.productoProveedor?.producto?.id === productoId
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
      toast.success('Ajuste de stock aplicado correctamente.');
      onRefreshItem();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Error al aplicar ajuste de stock.';
      toast.error(errorMessage);
    } finally {
      setIsSaving((prev) => ({ ...prev, [item.id]: false }));
    }
  };

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

  const handleSaveMerma = async (formData: Record<string, string | number>) => {
    setIsSavingMerma(true);
    try {
      await createMerma({
        productoId: String(formData.productoId),
        cantidad: Number(formData.cantidad),
        motivo: formData.motivo as MotivoMerma,
        notas: formData.notas as string | undefined,
      });
      toast.success('Merma registrada correctamente');
      setIsMermaModalOpen(false);
      onRefreshItem();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Error al registrar merma';
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
          {mode === 'audit' ? 'Auditar Stock por Ajuste' : 'Detalles de Lotes'}
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
            Solo lectura: stock actual y stock total en unidades de envase.
            Editable: ajuste de stock (+/-).
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
            No se encontraron lotes para este producto.
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
                  Resumen de auditoria
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
                      Stock total actual (solo lectura)
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
                      Ajuste total pendiente
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
                      Stock total proyectado (solo lectura)
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
                    <TableCell>Lote ID</TableCell>
                    <TableCell>Proveedor</TableCell>
                    <TableCell>Ubicación</TableCell>
                    <TableCell>Caducidad</TableCell>
                    {mode === 'audit' ? (
                      <>
                        <TableCell align="right">Stock actual (uds)</TableCell>
                        <TableCell align="right">
                          Ajuste de stock (uds +/-)
                        </TableCell>
                        <TableCell align="right">
                          Stock resultante (uds)
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
          Reportar Merma
        </Button>
        <Box>
          <Button onClick={onClose} variant="contained" color="primary">
            {mode === 'audit' ? 'Cerrar Auditoría' : 'Cerrar'}
          </Button>
        </Box>
      </DialogActions>

      <DynamicFormModal
        isOpen={isMermaModalOpen}
        onClose={() => setIsMermaModalOpen(false)}
        title="Registrar Merma"
        fields={dynamicMermaSchema}
        onSubmit={handleSaveMerma}
        isSubmitting={isSavingMerma}
        initialData={{ productoId }}
        requireConfirmation={true}
        confirmationMessage="Esta acción descontará el stock del inventario de forma permanente. ¿Estás seguro?"
      />
    </Dialog>
  );
};

export default InventoryDetailModal;
