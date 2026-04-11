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
import {
  EstadoIncidencia,
  Incidencia,
  ResolveIncidenciaPayload,
} from '../../services/incidencia.types';

interface ResolveIncidenciaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (payload: ResolveIncidenciaPayload) => Promise<void>;
  isLoading: boolean;
  incidencia?: Incidencia | null;
  defaultMarkResolved?: boolean;
}

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

function normalizeText(value?: string): string {
  return value?.trim().toLowerCase() || '';
}

function formatCantidad(value: number): string {
  return Number.isFinite(value) ? value.toFixed(3) : '0.000';
}

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

const CANTIDAD_EPSILON = 0.0005;

function hasDiscrepancia(
  cantidadEsperada: number,
  cantidadRecibida: number
): boolean {
  return Math.abs(cantidadEsperada - cantidadRecibida) > CANTIDAD_EPSILON;
}

const ResolveIncidenciaModal: React.FC<ResolveIncidenciaModalProps> = ({
  isOpen,
  onClose,
  onResolve,
  isLoading,
  incidencia,
  defaultMarkResolved = true,
}) => {
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

  const lineasPaginadas = useMemo(() => {
    const start = page * rowsPerPage;
    return lineasFiltradas.slice(start, start + rowsPerPage);
  }, [lineasFiltradas, page, rowsPerPage]);

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

  const clampAjuste = (linea: EditableLinea, ajuste: number): number => {
    const bounds = getAjusteBounds(linea);
    return Math.min(bounds.max, Math.max(bounds.min, ajuste));
  };

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

  const handleObservacionLineaChange = (lineaId: string, value: string) => {
    setLineas((current) =>
      current.map((linea) =>
        linea.id === lineaId ? { ...linea, observaciones: value } : linea
      )
    );
  };

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
              ? 'Resolver incidencia'
              : 'Ajustar cantidades de incidencia'}
          </Typography>
        </DialogTitle>

        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Se muestran todas las líneas de la incidencia. Solo las líneas con
              discrepancia permiten ajuste, manteniendo la cantidad recibida
              como solo lectura.
            </Typography>

            <Alert severity="info" variant="outlined">
              Proveedor: <strong>{incidencia?.proveedorNombre || '—'}</strong>
            </Alert>

            {!hasLineas && (
              <Alert severity="error" variant="outlined">
                Esta incidencia no tiene productos asociados. No se puede
                ajustar ni resolver hasta que tenga al menos una línea válida.
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
              label="Marcar incidencia como resuelta"
            />

            {marcarComoResuelta && (
              <FormControl size="small" sx={{ maxWidth: 320 }}>
                <InputLabel id="estado-final-incidencia-label">
                  Estado final
                </InputLabel>
                <Select
                  labelId="estado-final-incidencia-label"
                  label="Estado final"
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
                    Resuelta
                  </MenuItem>
                  <MenuItem value={EstadoIncidencia.CANCELADA}>
                    Cancelada
                  </MenuItem>
                  <MenuItem value={EstadoIncidencia.INVALIDA}>
                    Inválida
                  </MenuItem>
                </Select>
              </FormControl>
            )}

            <Stack spacing={1.25}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <TextField
                  label="Buscar producto"
                  value={busquedaProducto}
                  onChange={(event) => setBusquedaProducto(event.target.value)}
                  size="small"
                  disabled={!hasLineas}
                  fullWidth
                />
              </Stack>

              <Alert severity="info" variant="outlined">
                Ajustables: <strong>{resumenLineas.ajustables}</strong> | Sin
                ajuste: <strong>{resumenLineas.sinAjuste}</strong> | Total:{' '}
                <strong>{resumenLineas.total}</strong>
              </Alert>

              {!hasLineasAjustables && hasLineas ? (
                <Alert severity="warning" variant="outlined">
                  Esta incidencia tiene productos, pero no hay discrepancias
                  activas para ajustar. Puedes cerrar la incidencia si procede.
                </Alert>
              ) : null}

              <TableContainer component={Paper} variant="outlined">
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Producto</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Pedida</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Recibida</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Ajuste</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Tras ajuste
                      </TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Balance</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Nota</TableCell>
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
                              label={`Ajuste (${linea.unidad || 'ud'})`}
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
                                    ? `Rango permitido: ${formatCantidad(boundsAjuste.min)} a 0`
                                    : balanceOriginal < -CANTIDAD_EPSILON
                                      ? `Rango permitido: 0 a ${formatCantidad(boundsAjuste.max)}`
                                      : 'Ajuste manual'
                                  : 'No requiere ajuste'
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
                                    ? 'Pendiente ajuste'
                                    : 'Balanceado'
                                  : 'Sin ajuste'
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
                              label="Nota"
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
                labelRowsPerPage="Filas"
              />
              {lineasFiltradas.length === 0 ? (
                <Alert severity="warning" variant="outlined">
                  No hay productos que coincidan con el filtro actual.
                </Alert>
              ) : null}
            </Stack>

            <TextField
              label="Notas de resolución (opcional)"
              placeholder="Ej: Ajuste parcial recibido hoy, queda pendiente 1 unidad para mañana."
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
            Cancelar
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
              ? 'Guardando...'
              : marcarComoResuelta
                ? 'Guardar y resolver'
                : 'Guardar ajustes'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default ResolveIncidenciaModal;
