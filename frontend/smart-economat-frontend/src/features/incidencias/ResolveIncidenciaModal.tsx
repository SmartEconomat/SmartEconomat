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
  Box,
  Chip,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
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
  nombreProducto: string;
  unidad?: string;
  cantidadEsperada: number;
  cantidadRecibidaOriginal: number;
  cantidadPendienteOriginal: number;
  ajusteCantidad: number;
  observacionesOriginales?: string;
  observaciones: string;
}

const CANTIDAD_EPSILON = 0.0005;

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
  const [lineas, setLineas] = useState<EditableLinea[]>([]);

  useEffect(() => {
    if (!isOpen || !incidencia) {
      return;
    }

    setObservaciones('');
    setMarcarComoResuelta(defaultMarkResolved);
    setLineas(
      incidencia.lineas.map((linea) => ({
        id: linea.id,
        pedidoProductoId: linea.pedidoProductoId,
        nombreProducto: linea.nombreProducto,
        unidad: linea.unidad,
        cantidadEsperada: linea.cantidadEsperada,
        cantidadRecibidaOriginal: linea.cantidadRecibida,
        cantidadPendienteOriginal: linea.cantidadPendiente,
        ajusteCantidad: 0,
        observacionesOriginales: linea.observaciones,
        observaciones: linea.observaciones || '',
      }))
    );
  }, [isOpen, incidencia, defaultMarkResolved]);

  const hasLineUpdates = useMemo(
    () =>
      lineas.some((linea) => {
        const esEditable = linea.cantidadPendienteOriginal > CANTIDAD_EPSILON;
        if (!esEditable) {
          return false;
        }

        return (
          Math.abs(linea.ajusteCantidad) > CANTIDAD_EPSILON ||
          (linea.observaciones || '').trim() !==
            (linea.observacionesOriginales || '').trim()
        );
      }),
    [lineas]
  );

  const canSubmit = marcarComoResuelta || hasLineUpdates;

  const handleAjusteChange = (lineaId: string, value: string) => {
    const ajuste = Number(value);
    setLineas((current) =>
      current.map((linea) =>
        linea.id === lineaId
          ? {
              ...linea,
              ajusteCantidad: Number.isFinite(ajuste) ? ajuste : 0,
            }
          : linea
      )
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
    if (!canSubmit) return;

    const lineasActualizadas = lineas
      .filter((linea) => {
        const esEditable = linea.cantidadPendienteOriginal > CANTIDAD_EPSILON;
        if (!esEditable) {
          return false;
        }

        return (
          Math.abs(linea.ajusteCantidad) > CANTIDAD_EPSILON ||
          (linea.observaciones || '').trim() !==
            (linea.observacionesOriginales || '').trim()
        );
      })
      .map((linea) => ({
        id: linea.id,
        pedidoProductoId: linea.pedidoProductoId,
        ajusteCantidad:
          Math.abs(linea.ajusteCantidad) > CANTIDAD_EPSILON
            ? linea.ajusteCantidad
            : undefined,
        observaciones: linea.observaciones.trim() || undefined,
      }));

    const payload: ResolveIncidenciaPayload = {
      observacionesResolucion: observaciones.trim() || undefined,
      marcarComoResuelta,
      lineas: lineasActualizadas.length > 0 ? lineasActualizadas : undefined,
    };

    await onResolve(payload);
    setObservaciones('');
  };

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 },
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
              Ajusta solo las líneas con discrepancia usando el nuevo campo de
              ajuste, manteniendo la cantidad recibida como solo lectura.
            </Typography>

            <Alert severity="info" variant="outlined">
              Proveedor: <strong>{incidencia?.proveedorNombre || '—'}</strong>
            </Alert>

            <FormControlLabel
              control={
                <Checkbox
                  checked={marcarComoResuelta}
                  onChange={(event) =>
                    setMarcarComoResuelta(event.target.checked)
                  }
                  disabled={isLoading}
                />
              }
              label="Marcar incidencia como resuelta"
            />

            <Stack spacing={1.25}>
              {lineas.map((linea) => {
                const unidad = linea.unidad || 'ud';
                const esEditable =
                  linea.cantidadPendienteOriginal > CANTIDAD_EPSILON;
                const cantidadRecibidaAjustada = Math.max(
                  0,
                  linea.cantidadRecibidaOriginal + linea.ajusteCantidad
                );
                const cantidadPendiente = Math.max(
                  linea.cantidadEsperada - cantidadRecibidaAjustada,
                  0
                );

                return (
                  <Box
                    key={linea.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 1.5,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Stack spacing={1.25}>
                      <Stack
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          {linea.nombreProducto}
                        </Typography>
                        <Chip
                          size="small"
                          label={`Pendiente: ${cantidadPendiente} ${unidad}`}
                          color={cantidadPendiente > 0 ? 'warning' : 'success'}
                        />
                      </Stack>

                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                      >
                        <TextField
                          label={`Cantidad pedida (${unidad})`}
                          value={linea.cantidadEsperada}
                          disabled
                          size="small"
                          sx={{ width: { xs: '100%', sm: 180 } }}
                        />

                        <TextField
                          label={`Cantidad recibida (${unidad})`}
                          type="number"
                          size="small"
                          value={linea.cantidadRecibidaOriginal}
                          disabled
                          inputProps={{ step: 0.001 }}
                          sx={{ width: { xs: '100%', sm: 190 } }}
                        />

                        <TextField
                          label={`Ajuste (${unidad})`}
                          type="number"
                          size="small"
                          value={linea.ajusteCantidad}
                          onChange={(event) =>
                            handleAjusteChange(linea.id, event.target.value)
                          }
                          disabled={isLoading || !esEditable}
                          inputProps={{ step: 0.001 }}
                          helperText={
                            esEditable
                              ? 'Introduce incremento o decremento.'
                              : 'Sin discrepancia: no requiere ajuste.'
                          }
                          sx={{ width: { xs: '100%', sm: 180 } }}
                        />

                        <TextField
                          label={`Recibida tras ajuste (${unidad})`}
                          type="number"
                          size="small"
                          value={cantidadRecibidaAjustada}
                          disabled
                          inputProps={{ step: 0.001 }}
                          sx={{ width: { xs: '100%', sm: 220 } }}
                        />
                      </Stack>

                      <TextField
                        label="Nota de línea (opcional)"
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
                    </Stack>
                  </Box>
                );
              })}
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
            disabled={isLoading || !canSubmit}
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
