import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  CircularProgress,
  Stack,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTranslation } from 'react-i18next';
import {
  EstadoIncidencia,
  Incidencia,
  ResolveIncidenciaPayload,
} from '../../services/incidencia.types';

/**
 * Props for the {@link ResolveIncidenciaModal} component.
 */
interface ResolveIncidenciaModalProps {
  /** Whether the dialog is open. */
  isOpen: boolean;
  /** Callback to close the dialog. */
  onClose: () => void;
  /**
   * Callback invoked when the user submits the resolution form.
   *
   * @param payload - The resolution payload containing adjustments and status.
   */
  onResolve: (payload: ResolveIncidenciaPayload) => Promise<void>;
  /** Whether a resolution operation is in progress. */
  isLoading: boolean;
  /** The incidencia being resolved, or null/undefined when not yet loaded. */
  incidencia?: Incidencia | null;
  /** Whether the "mark as resolved" checkbox should be checked by default. */
  defaultMarkResolved?: boolean;
}

/**
 * Internal representation of an incidencia line with editable adjustment
 * and observation fields for the resolution form.
 */
interface EditableLinea {
  id: string;
  pedidoProductoId: string;
  productoId?: string;
  nombreProducto: string;
  unidad?: string;
  cantidadEsperada: number;
  cantidadRecibidaOriginal: number;
  cantidadPendienteOriginal: number;
  ajusteInput: string;
  observacionesOriginales?: string;
  observaciones: string;
}

/**
 * Normalises a string for case- and whitespace-insensitive comparison.
 *
 * @param value - The string to normalise.
 * @returns Trimmed, lower-cased string, or empty string if undefined.
 */
function normalizeText(value?: string): string {
  return value?.trim().toLowerCase() || '';
}

/**
 * Formats a quantity number to three decimal places.
 *
 * @param value - The numeric quantity.
 * @returns Fixed-precision string, e.g. "1.500".
 */
function formatCantidad(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : '0.000';
}

/**
 * Parses a raw adjustment input string (which may use comma as decimal
 * separator) into a finite number, returning 0 for intermediate / invalid
 * states.
 *
 * @param value - Raw input string from the user.
 * @returns Parsed numeric value, or 0 if the string is incomplete/invalid.
 */
function parseAjusteInput(value: string): number {
  const normalized = value.replace(',', '.').trim();

  if (
    normalized === '' ||
    normalized === '-' ||
    normalized === '+' ||
    normalized === '-.' ||
    normalized === '+.'
  ) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Tolerance used to determine whether two quantities are effectively equal. */
const CANTIDAD_EPSILON = 0.0005;

/**
 * Returns true when the absolute difference between expected and received
 * quantities exceeds the tolerance threshold.
 *
 * @param cantidadEsperada - Expected quantity.
 * @param cantidadRecibida - Received quantity.
 * @returns Whether a discrepancy exists.
 */
function hasDiscrepancia(
  cantidadEsperada: number,
  cantidadRecibida: number
): boolean {
  return Math.abs(cantidadEsperada - cantidadRecibida) > CANTIDAD_EPSILON;
}

/**
 * Modal dialog for resolving or adjusting quantities on an incidencia.
 * Displays all product lines, allows per-line quantity adjustments for lines
 * with discrepancies, and optionally marks the incidencia as closed with a
 * chosen final state.
 *
 * @param {ResolveIncidenciaModalProps} props - Component props.
 * @returns JSX rendered resolution dialog.
 * @example
 * <ResolveIncidenciaModal
 *   isOpen={open}
 *   onClose={handleClose}
 *   onResolve={handleResolve}
 *   isLoading={isSubmitting}
 *   incidencia={selectedIncidencia}
 * />
 */
const ResolveIncidenciaModal: React.FC<ResolveIncidenciaModalProps> = ({
  isOpen,
  onClose,
  onResolve,
  isLoading,
  incidencia,
  defaultMarkResolved = true,
}) => {
  const { t } = useTranslation();
  const [observaciones, setObservaciones] = useState('');
  const [marcarComoResuelta, setMarcarComoResuelta] = useState(true);
  const [estadoFinal, setEstadoFinal] = useState<
    | EstadoIncidencia.RESUELTA
    | EstadoIncidencia.CANCELADA
    | EstadoIncidencia.INVALIDA
  >(EstadoIncidencia.RESUELTA);
  const [lineas, setLineas] = useState<EditableLinea[]>([]);
  const [busquedaProducto, setBusquedaProducto] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(8);

  useEffect(() => {
    if (!isOpen || !incidencia) {
      return;
    }

    setObservaciones('');
    setMarcarComoResuelta(defaultMarkResolved);
    setEstadoFinal(EstadoIncidencia.RESUELTA);
    setBusquedaProducto('');
    setPage(0);
    setRowsPerPage(8);
    setLineas(
      incidencia.lineas.map((linea) => ({
        id: linea.id,
        pedidoProductoId: linea.pedidoProductoId,
        productoId: linea.productoId,
        nombreProducto: linea.nombreProducto,
        unidad: linea.unidad,
        cantidadEsperada: linea.cantidadEsperada,
        cantidadRecibidaOriginal: linea.cantidadRecibida,
        cantidadPendienteOriginal: linea.cantidadPendiente,
        ajusteInput: '0',
        observacionesOriginales: linea.observaciones,
        observaciones: linea.observaciones || '',
      }))
    );
  }, [isOpen, incidencia, defaultMarkResolved]);

  /** Lines sorted so that those with discrepancies appear first, then alphabetically. */
  const lineasOrdenadas = useMemo(
    () =>
      [...lineas].sort((a, b) => {
        const aEditable = hasDiscrepancia(
          a.cantidadEsperada,
          a.cantidadRecibidaOriginal
        );
        const bEditable = hasDiscrepancia(
          b.cantidadEsperada,
          b.cantidadRecibidaOriginal
        );

        if (aEditable !== bEditable) {
          return aEditable ? -1 : 1;
        }

        return a.nombreProducto.localeCompare(b.nombreProducto, 'es');
      }),
    [lineas]
  );

  /** Lines filtered by the product search term. */
  const lineasFiltradas = useMemo(() => {
    const term = normalizeText(busquedaProducto);

    return lineasOrdenadas.filter((linea) => {
      if (!term) {
        return true;
      }

      return normalizeText(linea.nombreProducto).includes(term);
    });
  }, [lineasOrdenadas, busquedaProducto]);

  useEffect(() => {
    setPage(0);
  }, [busquedaProducto]);

  /** Slice of filtered lines for the current pagination page. */
  const lineasPaginadas = useMemo(() => {
    const start = page * rowsPerPage;
    return lineasFiltradas.slice(start, start + rowsPerPage);
  }, [lineasFiltradas, page, rowsPerPage]);

  /** Summary counts of adjustable, non-adjustable, and total lines. */
  const resumenLineas = useMemo(() => {
    const ajustables = lineas.filter((linea) =>
      hasDiscrepancia(linea.cantidadEsperada, linea.cantidadRecibidaOriginal)
    ).length;

    return {
      total: lineas.length,
      ajustables,
      sinAjuste: Math.max(lineas.length - ajustables, 0),
    };
  }, [lineas]);

  const hasLineasAjustables = resumenLineas.ajustables > 0;

  /** True when at least one adjustable line has a non-zero adjustment or changed notes. */
  const hasLineUpdates = useMemo(
    () =>
      lineas.some((linea) => {
        const esEditable = hasDiscrepancia(
          linea.cantidadEsperada,
          linea.cantidadRecibidaOriginal
        );
        if (!esEditable) {
          return false;
        }

        return (
          Math.abs(parseAjusteInput(linea.ajusteInput)) > CANTIDAD_EPSILON ||
          (linea.observaciones || '').trim() !==
            (linea.observacionesOriginales || '').trim()
        );
      }),
    [lineas]
  );

  const canSubmit = marcarComoResuelta || hasLineUpdates;
  const hasLineas = lineas.length > 0;

  /**
   * Computes the permitted adjustment bounds for a line based on its original
   * balance (received – expected).
   *
   * @param linea - The editable line to compute bounds for.
   * @returns Object with `min` and `max` adjustment values.
   */
  const getAjusteBounds = (linea: EditableLinea) => {
    const balanceOriginal =
      linea.cantidadRecibidaOriginal - linea.cantidadEsperada;

    if (balanceOriginal > CANTIDAD_EPSILON) {
      return {
        min: -balanceOriginal,
        max: 0,
      };
    }

    if (balanceOriginal < -CANTIDAD_EPSILON) {
      return {
        min: 0,
        max: Math.abs(balanceOriginal),
      };
    }

    return {
      min: 0,
      max: 0,
    };
  };

  /**
   * Clamps an adjustment value to the permitted bounds for a line.
   *
   * @param linea - The line whose bounds define the clamp range.
   * @param ajuste - The raw adjustment value to clamp.
   * @returns The clamped adjustment value.
   */
  const clampAjuste = (linea: EditableLinea, ajuste: number): number => {
    const bounds = getAjusteBounds(linea);
    return Math.min(bounds.max, Math.max(bounds.min, ajuste));
  };

  /**
   * Returns true when the input string represents an intermediate / incomplete
   * numeric entry that should not yet be clamped.
   *
   * @param value - Raw input string.
   * @returns Whether the value is an intermediate entry.
   */
  const isIntermedioAjuste = (value: string): boolean => {
    const normalized = value.replace(',', '.').trim();
    return (
      normalized === '' ||
      normalized === '-' ||
      normalized === '+' ||
      normalized === '-.' ||
      normalized === '+.'
    );
  };

  /**
   * Updates the ajusteInput for a specific line, clamping once a complete
   * numeric value has been entered.
   *
   * @param lineaId - ID of the line to update.
   * @param value - New raw input string.
   */
  const handleAjusteChange = (lineaId: string, value: string) => {
    setLineas((current) =>
      current.map((linea) =>
        linea.id === lineaId
          ? (() => {
              if (isIntermedioAjuste(value)) {
                return {
                  ...linea,
                  ajusteInput: value,
                };
              }

              const ajuste = parseAjusteInput(value);
              const ajusteClamped = clampAjuste(linea, ajuste);

              return {
                ...linea,
                ajusteInput: value,
                ...(Math.abs(ajuste - ajusteClamped) > CANTIDAD_EPSILON
                  ? { ajusteInput: formatCantidad(ajusteClamped) }
                  : {}),
              };
            })()
          : linea
      )
    );
  };

  /**
   * Formats and clamps the ajusteInput when the user leaves the field (blur).
   *
   * @param lineaId - ID of the line whose input was blurred.
   */
  const handleAjusteBlur = (lineaId: string) => {
    setLineas((current) =>
      current.map((linea) => {
        if (linea.id !== lineaId) {
          return linea;
        }

        const ajuste = parseAjusteInput(linea.ajusteInput);
        const ajusteClamped = clampAjuste(linea, ajuste);

        return {
          ...linea,
          ajusteInput: formatCantidad(ajusteClamped),
        };
      })
    );
  };

  /**
   * Updates the observation text for a specific line.
   *
   * @param lineaId - ID of the line to update.
   * @param value - New observation string.
   */
  const handleObservacionLineaChange = (lineaId: string, value: string) => {
    setLineas((current) =>
      current.map((linea) =>
        linea.id === lineaId ? { ...linea, observaciones: value } : linea
      )
    );
  };

  /**
   * Handles form submission: builds the resolution payload from the edited
   * lines and calls {@link onResolve}.
   *
   * @param e - The form submit event.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasLineas || !canSubmit) return;

    const lineasActualizadas = lineas
      .filter((linea) => {
        const esEditable = hasDiscrepancia(
          linea.cantidadEsperada,
          linea.cantidadRecibidaOriginal
        );
        if (!esEditable) {
          return false;
        }

        return (
          Math.abs(parseAjusteInput(linea.ajusteInput)) > CANTIDAD_EPSILON ||
          (linea.observaciones || '').trim() !==
            (linea.observacionesOriginales || '').trim()
        );
      })
      .map((linea) => {
        const ajusteCantidad = clampAjuste(
          linea,
          parseAjusteInput(linea.ajusteInput)
        );

        return {
          id: linea.id,
          pedidoProductoId: linea.pedidoProductoId,
          ajusteCantidad:
            Math.abs(ajusteCantidad) > CANTIDAD_EPSILON
              ? ajusteCantidad
              : undefined,
          observaciones: linea.observaciones.trim() || undefined,
        };
      });

    const payload: ResolveIncidenciaPayload = {
      observacionesResolucion: observaciones.trim() || undefined,
      marcarComoResuelta,
      estadoFinal: marcarComoResuelta ? estadoFinal : undefined,
      lineas: lineasActualizadas.length > 0 ? lineasActualizadas : undefined,
    };

    await onResolve(payload);
    setObservaciones('');
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          width: 'min(96vw, 1360px)',
        },
      }}
    >
      <form onSubmit={handleSubmit}>
        <DialogTitle
          component="div"
          sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
        >
          <CheckCircleIcon color="success" />
          <Typography variant="h6" component="h2" fontWeight={700}>
            {defaultMarkResolved
              ? t('incidencias.modal.resolverTitulo')
              : t('incidencias.modal.ajustarTitulo')}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              {t('incidencias.modal.descripcion')}
            </Typography>

            <Alert severity="info" variant="outlined">
              {t('incidencias.modal.proveedor')}:{' '}
              <strong>{incidencia?.proveedorNombre || '—'}</strong>
            </Alert>

            {!hasLineas && (
              <Alert severity="error" variant="outlined">
                {t('incidencias.modal.sinLineas')}
              </Alert>
            )}

            <FormControlLabel
              control={
                <Checkbox
                  checked={marcarComoResuelta}
                  onChange={(event) => {
                    const nextChecked = event.target.checked;
                    setMarcarComoResuelta(nextChecked);
                    if (!nextChecked) {
                      setEstadoFinal(EstadoIncidencia.RESUELTA);
                    }
                  }}
                  disabled={isLoading || !hasLineas}
                />
              }
              label={t('incidencias.modal.marcarResuelta')}
            />

            {marcarComoResuelta && (
              <FormControl size="small" sx={{ maxWidth: 320 }}>
                <InputLabel id="estado-final-incidencia-label">
                  {t('incidencias.modal.estadoFinal')}
                </InputLabel>
                <Select
                  labelId="estado-final-incidencia-label"
                  label={t('incidencias.modal.estadoFinal')}
                  value={estadoFinal}
                  onChange={(event) =>
                    setEstadoFinal(
                      event.target.value as
                        | EstadoIncidencia.RESUELTA
                        | EstadoIncidencia.CANCELADA
                        | EstadoIncidencia.INVALIDA
                    )
                  }
                  disabled={isLoading || !hasLineas}
                >
                  <MenuItem value={EstadoIncidencia.RESUELTA}>
                    {t('incidencias.estados.resuelta')}
                  </MenuItem>
                  <MenuItem value={EstadoIncidencia.CANCELADA}>
                    {t('incidencias.estados.cancelada')}
                  </MenuItem>
                  <MenuItem value={EstadoIncidencia.INVALIDA}>
                    {t('incidencias.estados.invalida')}
                  </MenuItem>
                </Select>
              </FormControl>
            )}

            <Stack spacing={1.25}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label={t('incidencias.modal.buscarProducto')}
                  value={busquedaProducto}
                  onChange={(event) => setBusquedaProducto(event.target.value)}
                  size="small"
                  disabled={!hasLineas}
                  fullWidth
                />
              </Stack>

              <Alert severity="info" variant="outlined">
                {t('incidencias.modal.ajustables')}:{' '}
                <strong>{resumenLineas.ajustables}</strong> |{' '}
                {t('incidencias.modal.sinAjuste')}:{' '}
                <strong>{resumenLineas.sinAjuste}</strong> |{' '}
                {t('incidencias.modal.total')}:{' '}
                <strong>{resumenLineas.total}</strong>
              </Alert>

              {!hasLineasAjustables && hasLineas ? (
                <Alert severity="warning" variant="outlined">
                  {t('incidencias.modal.sinDiscrepancias')}
                </Alert>
              ) : null}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('incidencias.modal.tabla.producto')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('incidencias.modal.tabla.pedida')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('incidencias.modal.tabla.recibida')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('incidencias.modal.tabla.ajuste')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('incidencias.modal.tabla.trasAjuste')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('incidencias.modal.tabla.balance')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('incidencias.modal.tabla.estado')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        {t('incidencias.modal.tabla.nota')}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {lineasPaginadas.map((linea) => {
                      const esEditable = hasDiscrepancia(
                        linea.cantidadEsperada,
                        linea.cantidadRecibidaOriginal
                      );
                      const balanceOriginal =
                        linea.cantidadRecibidaOriginal - linea.cantidadEsperada;
                      const ajusteCantidad = parseAjusteInput(
                        linea.ajusteInput
                      );
                      const boundsAjuste = getAjusteBounds(linea);
                      const ajusteAplicado = clampAjuste(linea, ajusteCantidad);
                      const recibidaTrasAjuste = Math.max(
                        0,
                        linea.cantidadRecibidaOriginal + ajusteAplicado
                      );
                      const balanceTrasAjuste =
                        recibidaTrasAjuste - linea.cantidadEsperada;

                      return (
                        <TableRow key={linea.id} hover>
                          <TableCell>{linea.nombreProducto}</TableCell>
                          <TableCell>
                            {formatCantidad(linea.cantidadEsperada)}{' '}
                            {linea.unidad || 'ud'}
                          </TableCell>
                          <TableCell>
                            {formatCantidad(linea.cantidadRecibidaOriginal)}{' '}
                            {linea.unidad || 'ud'}
                          </TableCell>
                          <TableCell sx={{ minWidth: 140 }}>
                            <TextField
                              label={`${t('incidencias.modal.ajusteLabel')} (${linea.unidad || 'ud'})`}
                              type="number"
                              size="small"
                              value={linea.ajusteInput}
                              onChange={(event) =>
                                handleAjusteChange(linea.id, event.target.value)
                              }
                              onBlur={() => handleAjusteBlur(linea.id)}
                              disabled={isLoading || !esEditable}
                              inputProps={{
                                step: 0.001,
                                min: boundsAjuste.min,
                                max: boundsAjuste.max,
                              }}
                              helperText={
                                esEditable
                                  ? balanceOriginal > CANTIDAD_EPSILON
                                    ? t('incidencias.modal.rangoPermitidoMax', {
                                        min: formatCantidad(boundsAjuste.min),
                                      })
                                    : balanceOriginal < -CANTIDAD_EPSILON
                                      ? t(
                                          'incidencias.modal.rangoPermitidoMin',
                                          {
                                            max: formatCantidad(
                                              boundsAjuste.max
                                            ),
                                          }
                                        )
                                      : t('incidencias.modal.ajusteManual')
                                  : t('incidencias.modal.noRequiereAjuste')
                              }
                            />
                          </TableCell>
                          <TableCell>
                            {formatCantidad(recibidaTrasAjuste)}{' '}
                            {linea.unidad || 'ud'}
                          </TableCell>
                          <TableCell>
                            {balanceTrasAjuste > CANTIDAD_EPSILON ? '+' : ''}
                            {formatCantidad(balanceTrasAjuste)}{' '}
                            {linea.unidad || 'ud'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                esEditable
                                  ? Math.abs(balanceTrasAjuste) >
                                    CANTIDAD_EPSILON
                                    ? t('incidencias.modal.chipPendiente')
                                    : t('incidencias.modal.chipBalanceado')
                                  : t('incidencias.modal.chipSinAjuste')
                              }
                              color={
                                esEditable
                                  ? Math.abs(balanceTrasAjuste) >
                                    CANTIDAD_EPSILON
                                    ? 'warning'
                                    : 'success'
                                  : 'default'
                              }
                            />
                          </TableCell>
                          <TableCell sx={{ minWidth: 220 }}>
                            <TextField
                              label={t('incidencias.modal.tabla.nota')}
                              value={linea.observaciones}
                              onChange={(event) =>
                                handleObservacionLineaChange(
                                  linea.id,
                                  event.target.value
                                )
                              }
                              disabled={isLoading || !esEditable}
                              size="small"
                              fullWidth
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>

              <TablePagination
                component="div"
                count={lineasFiltradas.length}
                page={page}
                onPageChange={(_event, newPage) => setPage(newPage)}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={(event) => {
                  setRowsPerPage(Number(event.target.value));
                  setPage(0);
                }}
                rowsPerPageOptions={[5, 8, 12, 20]}
                labelRowsPerPage={t('incidencias.modal.filasPorPagina')}
              />
              {lineasFiltradas.length === 0 ? (
                <Alert severity="warning" variant="outlined">
                  {t('incidencias.modal.sinResultadosFiltro')}
                </Alert>
              ) : null}
            </Stack>

            <TextField
              label={t('incidencias.modal.notasResolucion')}
              placeholder={t('incidencias.modal.notasResolucionPlaceholder')}
              fullWidth
              multiline
              rows={4}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              disabled={isLoading}
              variant="outlined"
            />
          </Stack>
        </DialogContent>

        <DialogActions sx={{ p: 2, px: 3 }}>
          <Button
            onClick={onClose}
            disabled={isLoading}
            variant="text"
            color="inherit"
          >
            {t('comun.cancelar')}
          </Button>
          <Button
            type="submit"
            variant="contained"
            color={marcarComoResuelta ? 'success' : 'warning'}
            disabled={isLoading || !hasLineas || !canSubmit}
            startIcon={
              isLoading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                <CheckCircleIcon />
              )
            }
          >
            {isLoading
              ? t('comun.cargando')
              : marcarComoResuelta
                ? t('incidencias.modal.guardarYResolver')
                : t('incidencias.modal.guardarAjustes')}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ResolveIncidenciaModal;
