import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Alert,
  Stack,
  IconButton,
  Tooltip,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RestaurantIcon from '@mui/icons-material/Restaurant';
import LocalDiningIcon from '@mui/icons-material/LocalDining';
import HistoryIcon from '@mui/icons-material/History';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import {
  fetchProducciones,
  ProduccionLote,
  consumirPorciones,
  TipoConsumoProduccion,
} from '../services/produccion.service';
import DetailModal, { DetailSection } from '../components/ui/DetailModal';
import { useToast } from '../store/toast.hooks';
import {
  formatLocalizedNumber,
  parseLocalizedNumber,
  sanitizeLocalizedDecimalInput,
} from '../utils/numberUtils';

const formatAmount = (value?: number): string =>
  formatLocalizedNumber(value ?? 0, 3);

const formatRations = (value?: number): string => formatAmount(value);

const getRationAmount = (lote?: ProduccionLote): number | null => {
  if (!lote?.receta) {
    return null;
  }

  if (lote.receta.tamanioRacion && Number(lote.receta.tamanioRacion) > 0) {
    return Number(lote.receta.tamanioRacion);
  }

  if (
    lote.receta.rendimiento &&
    lote.receta.raciones &&
    Number(lote.receta.raciones) > 0
  ) {
    return Number(lote.receta.rendimiento) / Number(lote.receta.raciones);
  }

  return null;
};

const getAvailableAmountLabel = (lote?: ProduccionLote): string | null => {
  const rationAmount = getRationAmount(lote);
  const availablePortions = lote?.porcionesRestantes;
  const unit = lote?.receta?.unidadResultado;

  if (!rationAmount || availablePortions == null || !unit) {
    return null;
  }

  return `${formatAmount(rationAmount * Number(availablePortions))} ${unit}`;
};

const formatRationInfo = (
  lote?: ProduccionLote,
  portions?: number
): string | null => {
  const rationAmount = getRationAmount(lote);
  const unit = lote?.receta?.unidadResultado;

  if (!rationAmount || !unit) {
    return null;
  }

  const safePortions = Math.max(0.001, Number(portions) || 1);
  const totalAmount = rationAmount * safePortions;
  const amountLabel = formatAmount(rationAmount);
  const totalLabel = formatAmount(totalAmount);
  const portionsLabel = formatRations(safePortions);

  return safePortions === 1
    ? `Cada ración equivale a ${amountLabel} ${unit}.`
    : `${portionsLabel} raciones equivalen a ${totalLabel} ${unit}.`;
};

const Preparaciones: React.FC = () => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [data, setData] = useState<ProduccionLote[]>([]);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [itemToView, setItemToView] = useState<ProduccionLote | null>(null);
  const [consumingId, setConsumingId] = useState<string | null>(null);
  const [consumeMode, setConsumeMode] =
    useState<TipoConsumoProduccion>('raciones');
  const [portionsInput, setPortionsInput] = useState('1');
  const [amountInput, setAmountInput] = useState('1');
  const toast = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const estado = activeTab === 0 ? 'disponible' : 'agotado';
      const response = await fetchProducciones(page, pageSize, estado);
      setData(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : 'Error al cargar preparaciones'
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const consumingItem = consumingId
    ? (data.find((item) => item.id === consumingId) ?? null)
    : null;
  const availablePortions = consumingItem
    ? Number(consumingItem.porcionesRestantes) || 0
    : 0;
  const rationAmount = getRationAmount(consumingItem ?? undefined);
  const maxConsumableAmount = rationAmount
    ? availablePortions * rationAmount
    : null;
  const parsedPortions = parseLocalizedNumber(portionsInput);
  const parsedAmount = parseLocalizedNumber(amountInput);
  const currentValue =
    consumeMode === 'raciones' ? parsedPortions : parsedAmount;
  const currentMax =
    consumeMode === 'raciones' ? availablePortions : maxConsumableAmount;
  const isCurrentValueInvalid =
    currentValue === null ||
    currentValue <= 0 ||
    (currentMax !== null && currentValue > currentMax);

  const notifyExceededMax = useCallback(
    (mode: TipoConsumoProduccion) => {
      if (mode === 'raciones') {
        toast.warning(
          `Solo hay ${formatRations(availablePortions)} raciones disponibles en este lote.`
        );
        return;
      }

      toast.warning(
        `Solo puedes consumir ${formatAmount(maxConsumableAmount ?? 0)} ${consumingItem?.receta?.unidadResultado || ''}.`
      );
    },
    [
      availablePortions,
      consumingItem?.receta?.unidadResultado,
      maxConsumableAmount,
      toast,
    ]
  );

  const handleConsumptionInputChange = useCallback(
    (mode: TipoConsumoProduccion, rawValue: string) => {
      const sanitized = sanitizeLocalizedDecimalInput(rawValue);

      if (mode === 'raciones') {
        if (!sanitized) {
          setPortionsInput('');
          return;
        }

        const parsedValue = parseLocalizedNumber(sanitized);
        if (parsedValue !== null && parsedValue > availablePortions) {
          setPortionsInput(formatLocalizedNumber(availablePortions, 3));
          notifyExceededMax(mode);
          return;
        }

        setPortionsInput(sanitized);
        return;
      }

      if (!sanitized) {
        setAmountInput('');
        return;
      }

      const parsedValue = parseLocalizedNumber(sanitized);
      if (
        parsedValue !== null &&
        maxConsumableAmount !== null &&
        parsedValue > maxConsumableAmount
      ) {
        setAmountInput(formatLocalizedNumber(maxConsumableAmount, 3));
        notifyExceededMax(mode);
        return;
      }

      setAmountInput(sanitized);
    },
    [availablePortions, maxConsumableAmount, notifyExceededMax]
  );

  const handleConsume = async () => {
    if (!consumingId) {
      return;
    }

    if (isCurrentValueInvalid || currentValue === null) {
      if (
        currentMax !== null &&
        currentValue !== null &&
        currentValue > currentMax
      ) {
        notifyExceededMax(consumeMode);
      } else {
        toast.error('Introduce una cantidad válida para consumir.');
      }
      return;
    }

    try {
      await consumirPorciones(consumingId, {
        tipo: consumeMode,
        valor: currentValue,
      });
      toast.success('Consumo registrado correctamente.');
      setConsumingId(null);
      setPortionsInput('1');
      setAmountInput('1');
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Error al consumir la preparación.';

      if (/no hay suficientes/i.test(message)) {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    }
  };

  const columns: Column<ProduccionLote>[] = [
    {
      id: 'fechaProduccion',
      label: 'Fecha',
      render: (row) => new Date(row.fechaProduccion).toLocaleString(),
    },
    {
      id: 'receta',
      label: 'Receta',
      render: (row) => row.receta?.nombre ?? '—',
    },
    {
      id: 'cantidadProducida',
      label: 'Cantidad',
      align: 'right',
    },
    {
      id: 'costeTotalReal',
      label: 'Coste Real',
      align: 'right',
      render: (row) => `${Number(row.costeTotalReal).toFixed(2)}€`,
      hideOnMobile: true,
    },
    {
      id: 'usuario',
      label: 'Cocinero/a',
      render: (row) => row.usuario?.nombre ?? '—',
      hideOnMobile: true,
    },
    {
      id: 'porcionesRestantes',
      label: 'Raciones',
      align: 'right',
      render: (row) => (
        <Typography
          variant="body2"
          sx={{
            fontWeight: 'bold',
            color:
              row.estado === 'disponible' ? 'success.main' : 'text.disabled',
          }}
        >
          {formatRations(row.porcionesRestantes)} /{' '}
          {formatRations(row.porcionesProducidas)}
        </Typography>
      ),
    },
  ];

  const renderActions = (row: ProduccionLote) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title="Ver detalles">
        <IconButton
          color="primary"
          onClick={(e) => {
            e.currentTarget.blur();
            setItemToView(row);
          }}
          size="small"
          aria-label="Ver detalles"
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {row.estado === 'disponible' && (
        <Tooltip title="Consumir raciones o cantidad">
          <IconButton
            color="success"
            onClick={(e) => {
              e.currentTarget.blur();
              setConsumingId(row.id);
              setPortionsInput('1');
              setAmountInput(
                formatLocalizedNumber(getRationAmount(row) ?? 1, 3)
              );
              setConsumeMode('raciones');
            }}
            size="small"
          >
            <LocalDiningIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  const viewSections: DetailSection[] = itemToView
    ? [
        {
          title: 'Información General',
          columns: 3,
          fields: [
            { label: 'Receta', value: itemToView.receta?.nombre },
            {
              label: 'Fecha de ejecución',
              value: new Date(itemToView.fechaProduccion).toLocaleString(),
            },
            {
              label: 'Cantidad Producida',
              value: itemToView.cantidadProducida,
            },
            {
              label: 'Raciones disponibles',
              value: `${formatRations(itemToView.porcionesRestantes)} / ${formatRations(itemToView.porcionesProducidas)}`,
            },
            {
              label: 'Coste Total Real',
              value: `${Number(itemToView.costeTotalReal).toFixed(4)}€`,
            },
            {
              label: 'Caducidad',
              value: itemToView.fechaCaducidad
                ? new Date(itemToView.fechaCaducidad).toLocaleDateString()
                : 'No definida',
            },
            {
              label: 'Equivalencia',
              value: formatRationInfo(itemToView) ?? 'No definida',
            },
          ],
        },
      ]
    : [];

  return (
    <Box>
      <PageToolbar
        title="Bolsa de Preparaciones"
        totalItems={totalItems}
        totalItemsLabel="preparaciones"
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab
            icon={<RestaurantIcon />}
            iconPosition="start"
            label="Disponibles"
          />
          <Tab
            icon={<HistoryIcon />}
            iconPosition="start"
            label="Agotadas (Consumidas)"
          />
        </Tabs>
      </Box>

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
          emptyStateMessage={
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <RestaurantIcon
                sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }}
              />
              <Typography variant="h6" color="text.secondary">
                No hay preparaciones registradas
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ejecuta una receta para ver su historial aquí.
              </Typography>
            </Box>
          }
          pagination={{
            currentPage: page,
            totalPages: totalPages,
            onPageChange: (_, newPage) => setPage(newPage),
            pageSize: pageSize,
            onPageSizeChange: (e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            },
          }}
          renderActions={renderActions}
        />

        <DetailModal
          isOpen={!!itemToView}
          onClose={() => setItemToView(null)}
          title={`Preparación: ${itemToView?.receta?.nombre}`}
          subtitle={`Ejecutada el ${
            itemToView
              ? new Date(itemToView.fechaProduccion).toLocaleDateString()
              : ''
          }`}
          size="md"
          sections={viewSections}
        />

        <Dialog open={!!consumingId} onClose={() => setConsumingId(null)}>
          <DialogTitle>Consumir preparación</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              Puedes consumir este lote por raciones o por cantidad/peso total.
            </Typography>
            {consumingItem && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  Disponibles: {formatRations(consumingItem.porcionesRestantes)}{' '}
                  de {formatRations(consumingItem.porcionesProducidas)} raciones
                </Typography>
                {getAvailableAmountLabel(consumingItem) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    Cantidad disponible:{' '}
                    {getAvailableAmountLabel(consumingItem)}
                  </Typography>
                )}
                {formatRationInfo(consumingItem) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {formatRationInfo(consumingItem)}
                  </Typography>
                )}
                <Typography
                  variant="caption"
                  color="primary.main"
                  sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}
                >
                  {consumeMode === 'raciones'
                    ? formatRationInfo(
                        consumingItem,
                        parsedPortions ?? undefined
                      )
                    : `${formatAmount(parsedAmount ?? 0)} ${consumingItem.receta?.unidadResultado || ''} a consumir.`}
                </Typography>
              </Box>
            )}
            <ToggleButtonGroup
              exclusive
              size="small"
              color="primary"
              value={consumeMode}
              onChange={(_, value: TipoConsumoProduccion | null) => {
                if (!value) {
                  return;
                }

                setConsumeMode(value);
              }}
              sx={{ mb: 2 }}
            >
              <ToggleButton value="raciones">Por raciones</ToggleButton>
              <ToggleButton value="cantidad">Por cantidad/peso</ToggleButton>
            </ToggleButtonGroup>
            <TextField
              fullWidth
              type="text"
              label={
                consumeMode === 'raciones'
                  ? 'Cantidad de Raciones'
                  : `Cantidad a consumir (${consumingItem?.receta?.unidadResultado || 'unidad'})`
              }
              value={consumeMode === 'raciones' ? portionsInput : amountInput}
              onChange={(e) => {
                handleConsumptionInputChange(consumeMode, e.target.value);
              }}
              error={isCurrentValueInvalid}
              helperText={
                consumeMode === 'raciones'
                  ? `Máximo disponible: ${formatRations(availablePortions)} raciones.`
                  : `Máximo disponible: ${formatAmount(maxConsumableAmount ?? 0)} ${consumingItem?.receta?.unidadResultado || ''}.`
              }
              inputProps={{ inputMode: 'decimal' }}
              margin="dense"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConsumingId(null)}>Cancelar</Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleConsume}
              disabled={isCurrentValueInvalid}
            >
              Confirmar Consumo
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Preparaciones;
