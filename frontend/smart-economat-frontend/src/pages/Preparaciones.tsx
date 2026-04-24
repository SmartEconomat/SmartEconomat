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

/**
 * Formats a numeric value to 3 decimal places using localised number formatting.
 * @param value - The number to format (defaults to 0).
 * @returns A localised decimal string.
 */
const formatAmount = (value?: number): string =>
  formatLocalizedNumber(value ?? 0, 3);

/**
 * Formats a date-time string as a localised date+time string,
 * returning an em-dash for null/undefined/invalid inputs.
 * @param value - An ISO date string or null/undefined.
 * @returns A formatted date-time string or '—'.
 */
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

/** Number of half-rations per step when consuming by portions. */
const RATION_STEP = 0.5;
/** Floating-point tolerance used when checking multiples. */
const CONSUMPTION_FLOAT_TOLERANCE = 0.000001;

/**
 * Computes the amount-based consumption step for a lote (half a ration).
 * Returns null when the ration amount is not a positive finite number.
 * @param rationAmount - The per-ration amount in the recipe's result unit.
 * @returns The step amount or null.
 */
const getAmountConsumptionStep = (
  rationAmount?: number | null
): number | null => {
  if (!rationAmount || !Number.isFinite(rationAmount) || rationAmount <= 0) {
    return null;
  }

  return rationAmount * RATION_STEP;
};

/**
 * Normalises a raw portion value to the nearest lower multiple of RATION_STEP.
 * @param value - The raw number of portions.
 * @returns The normalised value (>= 0).
 */
const normalizeRationStep = (value?: number): number => {
  const numericValue = typeof value === 'number' ? value : Number(value);
  const safeValue = Number.isFinite(numericValue)
    ? Math.max(0, numericValue)
    : 0;

  return Math.floor(safeValue / RATION_STEP) * RATION_STEP;
};

/**
 * Formats a portions value to 1 decimal place after normalising to RATION_STEP.
 * @param value - The raw portion count.
 * @returns A formatted portions string.
 */
const formatRations = (value?: number): string =>
  formatLocalizedNumber(normalizeRationStep(value), 1);

/**
 * Checks whether a value is a multiple of step within floating-point tolerance.
 * @param value - The value to test.
 * @param step - The step to divide by.
 * @returns True when value is a valid multiple of step.
 */
const isMultipleOfAmount = (value: number, step: number): boolean => {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) {
    return false;
  }

  const ratio = value / step;
  return Math.abs(ratio - Math.round(ratio)) <= CONSUMPTION_FLOAT_TOLERANCE;
};

/**
 * Derives the per-ration amount from a ProduccionLote.
 * Uses tamanioRacion when set, otherwise divides rendimiento by raciones.
 * @param lote - The production batch.
 * @returns The per-ration amount or null when unavailable.
 */
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

/**
 * Builds a human-readable label for the total available amount in a lote.
 * @param lote - The production batch.
 * @returns A label string such as "3,000 kg" or null when data is missing.
 */
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

/**
 * Builds a human-readable sentence about per-ration and total amounts
 * for a given number of portions.
 * @param lote - The production batch.
 * @param portions - The number of portions to describe.
 * @returns A descriptive string or null when ration data is unavailable.
 */
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

/** Descriptive unit labels used in the merma form. */
type MermaUnitInfo = {
  fullLabel: string;
  shortLabel: string;
  example: string;
  note?: string;
};

/**
 * Returns localised unit info for a merma ingredient based on its raw unit string.
 * @param rawUnit - The unit string from the recipe ingredient.
 * @returns A MermaUnitInfo object with labels and an input example.
 */
const getMermaUnitInfo = (rawUnit?: string): MermaUnitInfo => {
  const unit = rawUnit?.toLowerCase();

  switch (unit) {
    case 'g':
      return {
        fullLabel: 'gramos (g)',
        shortLabel: 'g',
        example: '250',
      };
    case 'kg':
      return {
        fullLabel: 'kilogramos (kg)',
        shortLabel: 'kg',
        example: '0,5',
      };
    case 'ml':
      return {
        fullLabel: 'mililitros (ml)',
        shortLabel: 'ml',
        example: '200',
      };
    case 'l':
      return {
        fullLabel: 'litros (l)',
        shortLabel: 'l',
        example: '1',
      };
    case 'cda':
      return {
        fullLabel: 'cucharadas (cda)',
        shortLabel: 'cda',
        example: '2',
      };
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
        note: 'Si el ingrediente se maneja por manojos, cuenta 1 manojo como 1 unidad.',
      };
    default:
      return {
        fullLabel: 'unidad del ingrediente',
        shortLabel: 'unidad',
        example: '1',
      };
  }
};

/** Simplified ingredient option used in the merma ingredient select. */
type MermaIngredienteOption = {
  productoId: string;
  productoNombre: string;
  unidad?: string;
};

/**
 * Preparaciones page component.
 * Shows production batches grouped by status (available / exhausted),
 * allows consumption by portions or amount, and lets users report
 * ingredient waste without altering batch history.
 */
const Preparaciones: React.FC = () => {
  const { t } = useTranslation();

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

  /**
   * Loads the current page of producciones from the API, filtered by the
   * active tab's estado value.
   */
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
        err instanceof Error
          ? err.message
          : t('preparaciones.toast.errorCargar')
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
    ? `¿Cuánto se perdió? (${selectedMermaUnitInfo.fullLabel})`
    : '¿Cuánto se perdió?';
  const mermaCantidadHelperText = isMermaCantidadInvalid
    ? 'Introduce un número mayor que 0.'
    : selectedMermaIngrediente
      ? `Registra la merma en ${selectedMermaUnitInfo.fullLabel}. Ejemplo: ${selectedMermaUnitInfo.example} ${selectedMermaUnitInfo.shortLabel}.`
      : 'Selecciona primero el ingrediente para ver en qué medida registrar la merma.';

  /**
   * Emits a warning toast when the user tries to exceed the maximum consumable
   * amount or portions for the current consume mode.
   * @param mode - The current consume mode ('raciones' or 'cantidad').
   */
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

  /**
   * Handles changes to the consumption input fields, clamping values to the
   * maximum available and normalising to valid steps.
   * @param mode - The current consume mode.
   * @param rawValue - The raw string value from the input element.
   */
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

  /**
   * Submits the consumption request to the API after validating the input.
   * Handles specific error types (insufficient stock) differently from
   * generic errors.
   */
  const handleConsume = async () => {
    if (!consumingId) {
      return;
    }

    if (isCurrentValueInvalid || currentValue === null) {
      if (isAmountModeWithoutEquivalence) {
        toast.error(t('preparaciones.consumir.sinEquivalencia'));
        return;
      }

      if (isAmountMultipleInvalid && rationAmount) {
        toast.error(
          `La cantidad debe ser múltiplo de ${formatAmount(rationAmount)} ${consumingItem?.receta?.unidadResultado || 'unidad'}.`
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
        toast.error(t('preparaciones.errors.cantidadInvalida'));
      }
      return;
    }

    try {
      await consumirPorciones(consumingId, {
        tipo: consumeMode,
        valor: currentValue,
      });
      toast.success(t('preparaciones.toast.consumoRegistrado'));
      setConsumingId(null);
      setPortionsInput('1');
      setAmountInput('1');
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('preparaciones.toast.errorConsumir');

      if (/no hay suficientes/i.test(message)) {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    }
  };

  /** Resets all merma form fields to their initial empty state. */
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

  /** Closes the merma dialog and resets its form. */
  const closeMermaDialog = useCallback(() => {
    setMermaLote(null);
    resetMermaForm();
  }, [resetMermaForm]);

  /**
   * Opens the merma dialog for a production batch, loading ingredient data
   * from the batch's recipe (inline or via API).
   * @param lote - The production batch to report waste for.
   */
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
        setMermaLoadError(
          'No se pudo resolver la receta del lote para cargar ingredientes.'
        );
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
            : 'No se pudo cargar el detalle de ingredientes para reportar merma.';
        setMermaLoadError(message);
      } finally {
        setIsLoadingMermaDetalle(false);
      }
    },
    [resetMermaForm]
  );

  /**
   * Submits the merma creation request after validating all required fields.
   */
  const handleSubmitMerma = async () => {
    if (!mermaLote) {
      toast.error(t('preparaciones.errors.loteInvalido'));
      return;
    }

    if (!mermaProductoId) {
      toast.error(t('preparaciones.errors.ingredienteInvalido'));
      return;
    }

    if (mermaCantidad === null || mermaCantidad <= 0) {
      toast.error(t('preparaciones.errors.mermaCantidadInvalida'));
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

      toast.success(t('preparaciones.toast.mermaRegistrada'));
      closeMermaDialog();
      await loadData();
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : t('preparaciones.toast.errorMerma');
      toast.error(message);
    } finally {
      setIsSubmittingMerma(false);
    }
  };

  /** Column definitions for the production batches DataTable. */
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

  /**
   * Renders the action icon buttons for a production batch row.
   * @param row - The production batch.
   * @returns A JSX stack of icon buttons.
   */
  const renderActions = (row: ProduccionLote) => (
    <Stack direction="row" spacing={1} justifyContent="center">
      <Tooltip title={t('preparaciones.actions.verDetalles')}>
        <IconButton
          color="primary"
          onClick={(e) => {
            e.currentTarget.blur();
            setItemToView(row);
          }}
          size="small"
          aria-label={t('preparaciones.actions.verDetalles')}
        >
          <VisibilityIcon fontSize="small" />
        </IconButton>
      </Tooltip>
      {activeTab === 0 && row.estado === 'disponible' && (
        <Tooltip title={t('preparaciones.actions.consumir')}>
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
            aria-label={t('preparaciones.actions.consumir')}
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

  /** Detail sections shown in the DetailModal for a selected batch. */
  const viewSections: DetailSection[] = itemToView
    ? [
        {
          title: t('preparaciones.detail.infoGeneral'),
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
                    value: `${formatRations(itemToView.porcionesRestantes)} ${t('preparaciones.detail.raciones')}`,
                  },
                ]
              : [
                  {
                    label: t('preparaciones.detail.racionesPreparadas'),
                    value: `${formatRations(itemToView.porcionesProducidas)} ${t('preparaciones.detail.raciones')}`,
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
                : t('preparaciones.detail.noDefinida'),
            },
            {
              label: t('preparaciones.detail.equivalencia'),
              value:
                formatRationInfo(itemToView) ??
                t('preparaciones.detail.noDefinida'),
            },
          ],
        },
      ]
    : [];

  return (
    <Box>
      <PageToolbar
        title={t('preparaciones.titulo')}
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
                {t('preparaciones.empty.ejecutaReceta')}
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
          title={`${t('preparaciones.detail.titulo')}: ${itemToView?.receta?.nombre}`}
          subtitle={t('preparaciones.detail.subtitulo', {
            fecha: itemToView
              ? new Date(itemToView.fechaProduccion).toLocaleDateString()
              : '',
          })}
          size="md"
          sections={viewSections}
        />

        <Dialog open={!!consumingId} onClose={() => setConsumingId(null)}>
          <DialogTitle>{t('preparaciones.consumir.titulo')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('preparaciones.consumir.descripcion')}
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
                  {t('preparaciones.consumir.disponibles')}{' '}
                  {formatRations(consumingItem.porcionesRestantes)}{' '}
                  {t('preparaciones.consumir.raciones')}
                </Typography>
                {getAvailableAmountLabel(consumingItem) && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 0.5 }}
                  >
                    {t('preparaciones.consumir.cantidadDisponible')}{' '}
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
                    : isAmountModeWithoutEquivalence
                      ? t('preparaciones.consumir.sinEquivalenciaCorto')
                      : isAmountMultipleInvalid && amountConsumptionStep
                        ? t('preparaciones.consumir.multiploRequerido', {
                            step: formatAmount(amountConsumptionStep),
                            unidad:
                              consumingItem.receta?.unidadResultado || 'unidad',
                          })
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
              <ToggleButton value="raciones">
                {t('preparaciones.consumir.porRaciones')}
              </ToggleButton>
              <ToggleButton value="cantidad" disabled={rationAmount === null}>
                {t('preparaciones.consumir.porCantidad')}
              </ToggleButton>
            </ToggleButtonGroup>
            <TextField
              fullWidth
              type="text"
              label={
                consumeMode === 'raciones'
                  ? t('preparaciones.consumir.cantidadRaciones')
                  : t('preparaciones.consumir.cantidadConsumir', {
                      unidad:
                        consumingItem?.receta?.unidadResultado || 'unidad',
                    })
              }
              value={consumeMode === 'raciones' ? portionsInput : amountInput}
              onChange={(e) => {
                handleConsumptionInputChange(consumeMode, e.target.value);
              }}
              error={isCurrentValueInvalid}
              helperText={
                consumeMode === 'raciones'
                  ? t('preparaciones.consumir.maximoDisponibleRaciones', {
                      max: formatRations(availablePortions),
                    })
                  : isAmountModeWithoutEquivalence
                    ? t('preparaciones.consumir.sinEquivalencia')
                    : isAmountMultipleInvalid && amountConsumptionStep
                      ? t('preparaciones.consumir.multiploRequerido', {
                          step: formatAmount(amountConsumptionStep),
                          unidad:
                            consumingItem?.receta?.unidadResultado || 'unidad',
                        })
                      : t('preparaciones.consumir.maximoDisponibleCantidad', {
                          max: formatAmount(maxConsumableAmount ?? 0),
                          unidad: consumingItem?.receta?.unidadResultado || '',
                        })
              }
              inputProps={{ inputMode: 'decimal' }}
              margin="dense"
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConsumingId(null)}>
              {t('preparaciones.consumir.cancelar')}
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={handleConsume}
              disabled={isCurrentValueInvalid}
            >
              {t('preparaciones.consumir.confirmarConsumo')}
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={!!mermaLote}
          onClose={closeMermaDialog}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>{t('preparaciones.mermaDialog.titulo')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('preparaciones.mermaDialog.descripcion')}
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
                  {t('preparaciones.mermaDialog.lote')} {mermaLote.id}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('preparaciones.mermaDialog.receta')}{' '}
                  {mermaLote.receta?.nombre || '—'}
                </Typography>
              </Box>
            )}

            {isLoadingMermaDetalle ? (
              <Typography variant="body2" color="text.secondary">
                {t('preparaciones.mermaDialog.cargandoIngredientes')}
              </Typography>
            ) : mermaLoadError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {mermaLoadError}
              </Alert>
            ) : mermaIngredientes.length === 0 ? (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {t('preparaciones.mermaDialog.sinIngredientes')}
              </Alert>
            ) : (
              <>
                <FormControl fullWidth margin="dense">
                  <InputLabel id="merma-ingrediente-label">
                    {t('preparaciones.mermaDialog.ingrediente')}
                  </InputLabel>
                  <Select
                    labelId="merma-ingrediente-label"
                    label={t('preparaciones.mermaDialog.ingrediente')}
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
                    {t('preparaciones.mermaDialog.seRegistraraEn', {
                      unidad: selectedMermaUnitInfo.fullLabel,
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
                  placeholder={`Ejemplo: ${selectedMermaUnitInfo.example}`}
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
                    {t('preparaciones.mermaDialog.motivo')}
                  </InputLabel>
                  <Select
                    labelId="merma-motivo-label"
                    label={t('preparaciones.mermaDialog.motivo')}
                    value={mermaMotivo}
                    onChange={(event) =>
                      setMermaMotivo(event.target.value as MotivoMerma)
                    }
                  >
                    <MenuItem value={MotivoMerma.ERROR_PREPARACION}>
                      {t('preparaciones.mermaDialog.motivoErrorPreparacion')}
                    </MenuItem>
                    <MenuItem value={MotivoMerma.ROTURA}>
                      {t('preparaciones.mermaDialog.motivoRotura')}
                    </MenuItem>
                    <MenuItem value={MotivoMerma.DETERIORO}>
                      {t('preparaciones.mermaDialog.motivoDeterioroCaducidad')}
                    </MenuItem>
                    <MenuItem value={MotivoMerma.HURTO}>
                      {t('preparaciones.mermaDialog.motivoHurto')}
                    </MenuItem>
                    <MenuItem value={MotivoMerma.OTROS}>
                      {t('preparaciones.mermaDialog.motivoOtros')}
                    </MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  margin="dense"
                  multiline
                  minRows={2}
                  maxRows={4}
                  label={t('preparaciones.mermaDialog.observaciones')}
                  value={mermaNotas}
                  onChange={(event) => setMermaNotas(event.target.value)}
                />
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={closeMermaDialog} disabled={isSubmittingMerma}>
              {t('preparaciones.mermaDialog.cancelar')}
            </Button>
            <Button
              variant="contained"
              color="warning"
              onClick={handleSubmitMerma}
              disabled={isMermaFormInvalid}
            >
              {t('preparaciones.mermaDialog.registrar')}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
};

export default Preparaciones;
