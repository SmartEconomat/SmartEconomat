import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
import ReportProblemIcon from '@mui/icons-material/ReportProblem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import DataTable, { Column } from '../components/ui/DataTable';
import PageToolbar from '../components/ui/PageToolbar';
import {
  fetchProducciones,
  ProduccionLote,
  consumirPorciones,
  TipoConsumoProduccion,
} from '../services/produccion.service';
import DetailModal, { DetailSection } from '../components/ui/DetailModal';
import { getRecetaDetalle } from '../services/receta.service';
import { createMermaProduccion } from '../services/merma.service';
import { MotivoMerma } from '../services/merma.types';
import { useToast } from '../store/toast.hooks';
import {
  formatLocalizedNumber,
  parseLocalizedNumber,
  sanitizeLocalizedDecimalInput,
} from '../utils/numberUtils';

const formatAmount = (value?: number): string =>
  formatLocalizedNumber(value ?? 0, 3);

const formatDateTime = (value?: string | null): string => {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleString();
};

const RATION_STEP = 0.5;
const CONSUMPTION_FLOAT_TOLERANCE = 0.000001;

const getAmountConsumptionStep = (
  rationAmount?: number | null
): number | null => {
  if (!rationAmount || !Number.isFinite(rationAmount) || rationAmount <= 0) {
    return null;
  }

  return rationAmount * RATION_STEP;
};

const normalizeRationStep = (value?: number): number => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  const safeValue = Number.isFinite(numericValue)
    ? Math.max(0, numericValue)
    : 0;

  return Math.floor(safeValue / RATION_STEP) * RATION_STEP;
};

const formatRations = (value?: number): string =>
  formatLocalizedNumber(normalizeRationStep(value), 1);

const isMultipleOfAmount = (value: number, step: number): boolean => {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
    return false;
  }

  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) <= CONSUMPTION_FLOAT_TOLERANCE;
};

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

  const normalizedPortions = normalizeRationStep(Number(availablePortions));
  return `${formatAmount(rationAmount * normalizedPortions)} ${unit}`;
};

type FormatRationInfoTranslations = {
  single: (amount: string, unit: string) => string;
  multiple: (portions: string, total: string, unit: string) => string;
};

const formatRationInfo = (
  lote?: ProduccionLote,
  portions?: number,
  translations?: FormatRationInfoTranslations
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

  if (translations) {
    return safePortions === 1
      ? translations.single(amountLabel, unit)
      : translations.multiple(portionsLabel, totalLabel, unit);
  }

  return safePortions === 1
    ? `Cada ración equivale a ${amountLabel} ${unit}.`
    : `${portionsLabel} raciones equivalen a ${totalLabel} ${unit}.`;
};

type MermaUnitInfo = {
  fullLabel: string;
  shortLabel: string;
  example: string;
  note?: string;
};

const getMermaUnitInfo = (rawUnit?: string): MermaUnitInfo => {
  const unit = rawUnit?.toLowerCase();

  switch (unit) {
    case 'g':
      return { fullLabel: 'gramos (g)', shortLabel: 'g', example: '250' };
    case 'kg':
      return { fullLabel: 'kilogramos (kg)', shortLabel: 'kg', example: '0,5' };
    case 'ml':
      return { fullLabel: 'mililitros (ml)', shortLabel: 'ml', example: '200' };
    case 'l':
      return { fullLabel: 'litros (l)', shortLabel: 'l', example: '1' };
    case 'cda':
      return { fullLabel: 'cucharadas (cda)', shortLabel: 'cda', example: '2' };
    case 'cdta':
      return {
        fullLabel: 'cucharaditas (cdta)',
        shortLabel: 'cdta',
        example: '2',
      };
    case 'pieza':
      return {
        fullLabel: 'unidades (pieza/manojo)',
        shortLabel: 'unidad',
        example: '1',
      };
    default:
      return {
        fullLabel: 'unidad del ingrediente',
        shortLabel: 'unidad',
        example: '1',
      };
  }
};

type MermaIngredienteOption = {
  productoId: string;
  productoNombre: string;
  unidad?: string;
};

const Preparaciones: React.FC = () => {
  const { t } = useTranslation();

  const rationInfoTranslations: FormatRationInfoTranslations = {
    single: (amount, unit) =>
      t('preparaciones.rationInfo.single', { amount, unit }),
    multiple: (portions, total, unit) =>
      t('preparaciones.rationInfo.multiple', { portions, total, unit }),
  };
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
  const [mermaLote, setMermaLote] = useState<ProduccionLote | null>(null);
  const [mermaIngredientes, setMermaIngredientes] = useState<
    MermaIngredienteOption[]
  >([]);
  const [mermaProductoId, setMermaProductoId] = useState('');
  const [mermaCantidadInput, setMermaCantidadInput] = useState('');
  const [mermaMotivo, setMermaMotivo] = useState<MotivoMerma>(
    MotivoMerma.ERROR_PREPARACION
  );
  const [mermaNotas, setMermaNotas] = useState('');
  const [mermaLoadError, setMermaLoadError] = useState<string | null>(null);
  const [isLoadingMermaDetalle, setIsLoadingMermaDetalle] = useState(false);
  const [isSubmittingMerma, setIsSubmittingMerma] = useState(false);
  const toast = useToast();

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const estado = activeTab === 0 ? 'sin_consumo' : 'consumido';
      const response = await fetchProducciones(page, pageSize, estado);
      setData(response.data);
      setTotalPages(response.totalPages);
      setTotalItems(response.total);
    } catch (err: unknown) {
      setError(
        err instanceof Error ? err.message : t('preparaciones.toast.loadError')
      );
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, activeTab, t]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const consumingItem = consumingId
    ? (data.find((item) => item.id === consumingId) ?? null)
    : null;
  const availablePortions = consumingItem
    ? Number(consumingItem.porcionesRestantes) || 0
    : 0;
  const availableRationPortions = normalizeRationStep(availablePortions);
  const rationAmount = getRationAmount(consumingItem ?? undefined);
  const amountConsumptionStep = getAmountConsumptionStep(rationAmount);
  const maxConsumableAmount = rationAmount
    ? availableRationPortions * rationAmount
    : null;
  const parsedPortions = parseLocalizedNumber(portionsInput);
  const parsedAmount = parseLocalizedNumber(amountInput);
  const currentValue =
    consumeMode === 'raciones' ? parsedPortions : parsedAmount;
  const currentMax =
    consumeMode === 'raciones' ? availableRationPortions : maxConsumableAmount;
  const isAmountModeWithoutEquivalence =
    consumeMode === 'cantidad' && rationAmount === null;
  const isAmountMultipleInvalid =
    consumeMode === 'cantidad' &&
    currentValue !== null &&
    amountConsumptionStep !== null &&
    !isMultipleOfAmount(currentValue, amountConsumptionStep);
  const isCurrentValueInvalid =
    currentValue === null ||
    currentValue <= 0 ||
    (currentMax !== null && currentValue > currentMax) ||
    isAmountModeWithoutEquivalence ||
    isAmountMultipleInvalid;
  const mermaCantidad = parseLocalizedNumber(mermaCantidadInput);
  const isMermaFormInvalid =
    !mermaLote ||
    !mermaProductoId ||
    mermaCantidad === null ||
    mermaCantidad <= 0 ||
    isLoadingMermaDetalle ||
    isSubmittingMerma;
  const selectedMermaIngrediente =
    mermaIngredientes.find((item) => item.productoId === mermaProductoId) ??
    null;
  const selectedMermaUnitInfo = getMermaUnitInfo(
    selectedMermaIngrediente?.unidad
  );
  const isMermaCantidadInvalid =
    mermaCantidadInput.length > 0 &&
    (mermaCantidad === null || mermaCantidad <= 0);
  const mermaCantidadLabel = selectedMermaIngrediente
    ? t('preparaciones.merma.cantidadLabelWithUnit', {
        unit: selectedMermaUnitInfo.fullLabel,
      })
    : t('preparaciones.merma.cantidadLabel');
  const mermaCantidadHelperText = isMermaCantidadInvalid
    ? t('preparaciones.merma.cantidadHelperInvalid')
    : selectedMermaIngrediente
      ? t('preparaciones.merma.cantidadHelperWithUnit', {
          unit: selectedMermaUnitInfo.fullLabel,
          example: selectedMermaUnitInfo.example,
          shortUnit: selectedMermaUnitInfo.shortLabel,
        })
      : t('preparaciones.merma.cantidadHelperDefault');

  const notifyExceededMax = useCallback(
    (mode: TipoConsumoProduccion) => {
      if (mode === 'raciones') {
        toast.warning(
          t('preparaciones.exceedMax.raciones', {
            count: formatRations(availablePortions),
          })
        );
        return;
      }

      toast.warning(
        t('preparaciones.exceedMax.cantidad', {
          amount: formatAmount(maxConsumableAmount ?? 0),
          unit: consumingItem?.receta?.unidadResultado || '',
        })
      );
    },
    [
      availablePortions,
      consumingItem?.receta?.unidadResultado,
      maxConsumableAmount,
      t,
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
        if (parsedValue !== null && parsedValue > availableRationPortions) {
          setPortionsInput(formatRations(availableRationPortions));
          notifyExceededMax(mode);
          return;
        }

        if (parsedValue !== null) {
          setPortionsInput(formatRations(parsedValue));
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
    [availableRationPortions, maxConsumableAmount, notifyExceededMax]
  );

  const handleConsume = async () => {
    if (!consumingId) {
      return;
    }

    if (isCurrentValueInvalid || currentValue === null) {
      if (isAmountModeWithoutEquivalence) {
        toast.error(t('preparaciones.consumo.errorSinEquivalencia'));
        return;
      }

      if (isAmountMultipleInvalid && rationAmount) {
        toast.error(
          t('preparaciones.consumo.errorMultiplo', {
            amount: formatAmount(rationAmount),
            unit: consumingItem?.receta?.unidadResultado || 'unidad',
          })
        );
        return;
      }

      if (
        currentMax !== null &&
        currentValue !== null &&
        currentValue > currentMax
      ) {
        notifyExceededMax(consumeMode);
      } else {
        toast.error(t('preparaciones.toast.invalidCantidad'));
      }
      return;
    }

    try {
      await consumirPorciones(consumingId, {
        tipo: consumeMode,
        valor: currentValue,
      });
      toast.success(t('preparaciones.toast.consumoSuccess'));
      setConsumingId(null);
      setPortionsInput('1');
      setAmountInput('1');
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('preparaciones.toast.consumoError');

      if (/no hay suficientes/i.test(message)) {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    }
  };

  const resetMermaForm = useCallback(() => {
    setMermaIngredientes([]);
    setMermaProductoId('');
    setMermaCantidadInput('');
    setMermaMotivo(MotivoMerma.ERROR_PREPARACION);
    setMermaNotas('');
    setMermaLoadError(null);
    setIsLoadingMermaDetalle(false);
    setIsSubmittingMerma(false);
  }, []);

  const closeMermaDialog = useCallback(() => {
    setMermaLote(null);
    resetMermaForm();
  }, [resetMermaForm]);

  const openMermaDialog = useCallback(
    async (lote: ProduccionLote) => {
      setMermaLote(lote);
      resetMermaForm();

      const ingredientesDesdeLote = (lote.receta?.ingredientes || [])
        .filter((item) => Boolean(item?.producto?.id))
        .map((item) => ({
          productoId: String(item.producto?.id),
          productoNombre: item.producto?.nombre || 'Ingrediente',
          unidad: item.unidad,
        }));

      if (ingredientesDesdeLote.length > 0) {
        setMermaIngredientes(ingredientesDesdeLote);
        setMermaProductoId(ingredientesDesdeLote[0].productoId);
        return;
      }

      const recetaId = lote.recetaId || lote.receta?.id;
      if (!recetaId) {
        setMermaLoadError(t('preparaciones.merma.noReceta'));
        return;
      }

      setIsLoadingMermaDetalle(true);

      try {
        const detalle = await getRecetaDetalle(recetaId);
        const ingredientes = (detalle.detalleIngredientes || [])
          .filter((item) => Boolean(item.productoId))
          .map((item) => ({
            productoId: item.productoId,
            productoNombre: item.productoNombre,
            unidad: item.unidad,
          }));

        setMermaIngredientes(ingredientes);
        if (ingredientes.length > 0) {
          setMermaProductoId(ingredientes[0].productoId);
        }
      } catch (err: unknown) {
        const message =
          err instanceof Error && err.message
            ? err.message
            : t('preparaciones.merma.noIngredientes');
        setMermaLoadError(message);
      } finally {
        setIsLoadingMermaDetalle(false);
      }
    },
    [resetMermaForm]
  );

  const handleSubmitMerma = async () => {
    if (!mermaLote) {
      toast.error(t('preparaciones.toast.invalidLote'));
      return;
    }

    if (!mermaProductoId) {
      toast.error(t('preparaciones.toast.invalidIngrediente'));
      return;
    }

    if (mermaCantidad === null || mermaCantidad <= 0) {
      toast.error(t('preparaciones.toast.invalidMermaCantidad'));
      return;
    }

    setIsSubmittingMerma(true);
    try {
      await createMermaProduccion({
        produccionLoteId: mermaLote.id,
        productoId: mermaProductoId,
        cantidad: mermaCantidad,
        motivo: mermaMotivo,
        notas: mermaNotas.trim() || undefined,
      });

      toast.success(t('preparaciones.toast.mermaSuccess'));
      closeMermaDialog();
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('preparaciones.toast.mermaError');
      toast.error(message);
    } finally {
      setIsSubmittingMerma(false);
    }
  };

  const columns: Column<ProduccionLote>[] = [
    {
      id: 'createdAt',
      label: t('preparaciones.columns.fechaCreacion'),
      render: (row) => formatDateTime(row.createdAt || row.fechaProduccion),
      hideOnMobile: true,
    },
    {
      id: 'receta',
      label: t('preparaciones.columns.receta'),
      render: (row) => row.receta?.nombre ?? '—',
    },
    {
      id: 'cantidadProducida',
      label: t('preparaciones.columns.cantidad'),
      align: 'right',
    },
    {
      id: 'costeTotalReal',
      label: t('preparaciones.columns.costeReal'),
      align: 'right',
      render: (row) => `${Number(row.costeTotalReal).toFixed(2)}€`,
      hideOnMobile: true,
    },
    {
      id: 'usuario',
      label: t('preparaciones.columns.cocinero'),
      render: (row) => row.usuario?.nombre ?? '—',
      hideOnMobile: true,
    },
    ...(activeTab === 1
      ? [
          {
            id: 'fechaAgotado' as const,
            label: t('preparaciones.columns.fechaAgotado'),
            render: (row: ProduccionLote) =>
              row.estado === 'agotado'
                ? formatDateTime(row.fechaAgotado || null)
                : '—',
            hideOnMobile: true,
          },
        ]
      : []),
    ...(activeTab === 0
      ? [
          {
            id: 'porcionesRestantes' as const,
            label: t('preparaciones.columns.racionesDisponibles'),
            align: 'right' as const,
            render: (row: ProduccionLote) => (
              <Typography
                variant="body2"
                sx={{ fontWeight: 'bold', color: 'success.main' }}
              >
                {formatRations(row.porcionesRestantes)}
              </Typography>
            ),
          },
        ]
      : [
          {
            id: 'porcionesProducidas' as const,
            label: t('preparaciones.columns.racionesPreparadas'),
            align: 'right' as const,
            render: (row: ProduccionLote) => (
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                {formatRations(row.porcionesProducidas)}
              </Typography>
            ),
          },
        ]),
  ];

  const renderActions = (row: ProduccionLote) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title={t('preparaciones.actions.viewDetail')}>
        <IconButton
          color="primary"
          onClick={(e) => {
            e.currentTarget.blur();
            setItemToView(row);
          }}
          size="small"
          aria-label={t('preparaciones.actions.viewDetail')}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {activeTab === 0 && row.estado === 'disponible' && (
        <Tooltip title={t('preparaciones.actions.consume')}>
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
            aria-label={t('preparaciones.actions.consume')}
          >
            <LocalDiningIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
      {activeTab === 0 && row.estado === 'disponible' && (
        <Tooltip title={t('preparaciones.actions.merma')}>
          <IconButton
            color="warning"
            onClick={(e) => {
              e.currentTarget.blur();
              void openMermaDialog(row);
            }}
            size="small"
            aria-label={t('preparaciones.actions.merma')}
          >
            <ReportProblemIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Stack>
  );

  const viewSections: DetailSection[] = itemToView
    ? [
        {
          title: t('preparaciones.detail.sectionTitle'),
          columns: 3,
          fields: [
            {
              label: t('preparaciones.detail.receta'),
              value: itemToView.receta?.nombre,
            },
            {
              label: t('preparaciones.detail.fechaEjecucion'),
              value: formatDateTime(itemToView.fechaProduccion),
            },
            {
              label: t('preparaciones.detail.fechaCreacion'),
              value: formatDateTime(
                itemToView.createdAt || itemToView.fechaProduccion
              ),
            },
            {
              label: t('preparaciones.detail.fechaAgotado'),
              value:
                itemToView.estado === 'agotado'
                  ? formatDateTime(itemToView.fechaAgotado || null)
                  : t('preparaciones.detail.aunDisponible'),
            },
            {
              label: t('preparaciones.detail.cantidadProducida'),
              value: itemToView.cantidadProducida,
            },
            ...(activeTab === 0
              ? [
                  {
                    label: t('preparaciones.detail.racionesDisponibles'),
                    value: t('preparaciones.detail.racionesSuffix', {
                      count: formatRations(itemToView.porcionesRestantes),
                    }),
                  },
                ]
              : [
                  {
                    label: t('preparaciones.detail.racionesPreparadas'),
                    value: t('preparaciones.detail.racionesSuffix', {
                      count: formatRations(itemToView.porcionesProducidas),
                    }),
                  },
                ]),
            {
              label: t('preparaciones.detail.costeTotalReal'),
              value: `${Number(itemToView.costeTotalReal).toFixed(4)}€`,
            },
            {
              label: t('preparaciones.detail.caducidad'),
              value: itemToView.fechaCaducidad
                ? new Date(itemToView.fechaCaducidad).toLocaleDateString()
                : t('preparaciones.detail.caducidadNoDefinida'),
            },
            {
              label: t('preparaciones.detail.equivalencia'),
              value:
                formatRationInfo(
                  itemToView,
                  undefined,
                  rationInfoTranslations
                ) ?? t('preparaciones.detail.equivalenciaNoDefinida'),
            },
          ],
        },
      ]
    : [];

  return (
    <Box>
      <PageToolbar
        title={t('preparaciones.pageTitle')}
        totalItems={totalItems}
        totalItemsLabel={t('preparaciones.totalItemsLabel')}
      />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
          <Tab
            icon={<RestaurantIcon />}
            iconPosition="start"
            label={t('preparaciones.tabs.disponibles')}
          />
          <Tab
            icon={<HistoryIcon />}
            iconPosition="start"
            label={t('preparaciones.tabs.agotadas')}
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
                {t('preparaciones.empty.noPreparaciones')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('preparaciones.empty.hint')}
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
          title={t('preparaciones.detail.modalTitle', {
            name: itemToView?.receta?.nombre,
          })}
          subtitle={t('preparaciones.detail.modalSubtitle', {
            date: itemToView
              ? new Date(itemToView.fechaProduccion).toLocaleDateString()
              : '',
          })}
          size="md"
          sections={viewSections}
        />

        <Dialog open={!!consumingId} onClose={() => setConsumingId(null)}>
          <DialogTitle>{t('preparaciones.consumo.title')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('preparaciones.consumo.description')}
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
                  {t('preparaciones.consumo.disponibles', {
                    count: formatRations(consumingItem.porcionesRestantes),
                  })}
                </Typography>
                {getAvailableAmountLabel(consumingItem) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {t('preparaciones.consumo.cantidadDisponible')}{' '}
                    {getAvailableAmountLabel(consumingItem)}
                  </Typography>
                )}
                {formatRationInfo(
                  consumingItem,
                  undefined,
                  rationInfoTranslations
                ) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {formatRationInfo(
                      consumingItem,
                      undefined,
                      rationInfoTranslations
                    )}
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
                        parsedPortions ?? undefined,
                        rationInfoTranslations
                      )
                    : isAmountModeWithoutEquivalence
                      ? t('preparaciones.consumo.infoSinEquivalencia')
                      : isAmountMultipleInvalid && amountConsumptionStep
                        ? t('preparaciones.consumo.infoMultiploInvalido', {
                            amount: formatAmount(amountConsumptionStep),
                            unit:
                              consumingItem.receta?.unidadResultado || 'unidad',
                          })
                        : t('preparaciones.consumo.infoCantidadAConsumir', {
                            amount: formatAmount(parsedAmount ?? 0),
                            unit: consumingItem.receta?.unidadResultado || '',
                          })}
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
              <ToggleButton value="raciones">
                {t('preparaciones.consumo.toggleRaciones')}
              </ToggleButton>
              <ToggleButton value="cantidad" disabled={rationAmount === null}>
                {t('preparaciones.consumo.toggleCantidad')}
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField
              fullWidth
              type="text"
              label={
                consumeMode === 'raciones'
                  ? t('preparaciones.consumo.labelRaciones')
                  : t('preparaciones.consumo.labelCantidad', {
                      unit: consumingItem?.receta?.unidadResultado || 'unidad',
                    })
              }
              value={consumeMode === 'raciones' ? portionsInput : amountInput}
              onChange={(e) => {
                handleConsumptionInputChange(consumeMode, e.target.value);
              }}
              error={isCurrentValueInvalid}
              helperText={
                consumeMode === 'raciones'
                  ? t('preparaciones.consumo.maxRaciones', {
                      count: formatRations(availablePortions),
                    })
                  : isAmountModeWithoutEquivalence
                    ? t('preparaciones.consumo.errorSinEquivalencia')
                    : isAmountMultipleInvalid && amountConsumptionStep
                      ? t('preparaciones.consumo.errorMultiplo', {
                          amount: formatAmount(amountConsumptionStep),
                          unit:
                            consumingItem?.receta?.unidadResultado || 'unidad',
                        })
                      : t('preparaciones.consumo.maxCantidad', {
                          amount: formatAmount(maxConsumableAmount ?? 0),
                          unit: consumingItem?.receta?.unidadResultado || '',
                        })
              }
              inputProps={{ inputMode: 'decimal' }}
              margin="dense"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConsumingId(null)}>
              {t('preparaciones.consumo.cancel')}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleConsume}
              disabled={isCurrentValueInvalid}
            >
              {t('preparaciones.consumo.confirm')}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={!!mermaLote}
          onClose={closeMermaDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{t('preparaciones.merma.title')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('preparaciones.merma.description')}
            </Typography>

            {mermaLote && (
              <Box
                sx={{
                  mb: 2,
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {t('preparaciones.merma.loteLabel', { id: mermaLote.id })}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('preparaciones.merma.recetaLabel', {
                    name: mermaLote.receta?.nombre || '—',
                  })}
                </Typography>
              </Box>
            )}

            {isLoadingMermaDetalle ? (
              <Typography variant="body2" color="text.secondary">
                {t('preparaciones.merma.loadingIngredientes')}
              </Typography>
            ) : mermaLoadError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {mermaLoadError}
              </Alert>
            ) : mermaIngredientes.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('preparaciones.merma.noIngredientes')}
              </Alert>
            ) : (
              <>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="merma-ingrediente-label">
                    {t('preparaciones.merma.ingredienteLabel')}
                  </InputLabel>
                  <Select
                    labelId="merma-ingrediente-label"
                    label={t('preparaciones.merma.ingredienteLabel')}
                    value={mermaProductoId}
                    onChange={(event) =>
                      setMermaProductoId(String(event.target.value))
                    }
                  >
                    {mermaIngredientes.map((ingrediente) => (
                      <MenuItem
                        key={ingrediente.productoId}
                        value={ingrediente.productoId}
                      >
                        {ingrediente.productoNombre} ·{' '}
                        {getMermaUnitInfo(ingrediente.unidad).fullLabel}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {selectedMermaIngrediente && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5, mb: 1 }}
                  >
                    {t('preparaciones.merma.registradaEn', {
                      unit: selectedMermaUnitInfo.fullLabel,
                    })}
                    {selectedMermaUnitInfo.note
                      ? ` ${selectedMermaUnitInfo.note}`
                      : ''}
                  </Typography>
                )}

                <TextField
                  fullWidth
                  margin="dense"
                  label={mermaCantidadLabel}
                  value={mermaCantidadInput}
                  placeholder={`${selectedMermaUnitInfo.example}`}
                  inputProps={{ inputMode: 'decimal' }}
                  onChange={(event) => {
                    const sanitized = sanitizeLocalizedDecimalInput(
                      event.target.value
                    );
                    setMermaCantidadInput(sanitized);
                  }}
                  error={isMermaCantidadInvalid}
                  helperText={mermaCantidadHelperText}
                />

                <FormControl fullWidth margin="dense">
                  <InputLabel id="merma-motivo-label">
                    {t('preparaciones.merma.motivoLabel')}
                  </InputLabel>
                  <Select
                    labelId="merma-motivo-label"
                    label={t('preparaciones.merma.motivoLabel')}
                    value={mermaMotivo}
                    onChange={(event) =>
                      setMermaMotivo(event.target.value as MotivoMerma)
                    }
                  >
                    <MenuItem value={MotivoMerma.ERROR_PREPARACION}>
                      {t('preparaciones.merma.motivoErrorPreparacion')}
                    </MenuItem>
                    <MenuItem value={MotivoMerma.ROTURA}>
                      {t('preparaciones.merma.motivoRotura')}
                    </MenuItem>
                    <MenuItem value={MotivoMerma.DETERIORO}>
                      {t('preparaciones.merma.motivoDeterio')}
                    </MenuItem>
                    <MenuItem value={MotivoMerma.HURTO}>
                      {t('preparaciones.merma.motivoHurto')}
                    </MenuItem>
                    <MenuItem value={MotivoMerma.OTROS}>
                      {t('preparaciones.merma.motivoOtros')}
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  margin="dense"
                  multiline
                  minRows={2}
                  maxRows={4}
                  label={t('preparaciones.merma.observacionesLabel')}
                  value={mermaNotas}
                  onChange={(event) => setMermaNotas(event.target.value)}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeMermaDialog} disabled={isSubmittingMerma}>
              {t('preparaciones.merma.cancel')}
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleSubmitMerma}
              disabled={isMermaFormInvalid}
            >
              {t('preparaciones.merma.confirm')}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Preparaciones;
