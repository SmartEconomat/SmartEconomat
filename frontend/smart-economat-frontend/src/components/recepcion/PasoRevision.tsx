import React from 'react';
import {
  Box,
  Alert,
  TextField,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Typography,
  TableContainer,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  FormControl,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {
  RecepcionDraft,
  EstadoVisualProducto,
} from '../../services/recepcion.types';

interface PasoRevisionProps {
  draft: RecepcionDraft;
  setDraft: React.Dispatch<React.SetStateAction<RecepcionDraft>>;
  expandedPanel: string | false;
  setExpandedPanel: (panel: string | false) => void;
  onUpdateLinea: (
    pIdx: number | null,
    lIdx: number,
    field: string,
    value: string | number | boolean | undefined
  ) => void;
}

const PasoRevision: React.FC<PasoRevisionProps> = ({
  draft,
  setDraft,
  expandedPanel,
  setExpandedPanel,
  onUpdateLinea,
}) => {
  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Revisa los totales. Si no indicas el Nº de Albarán, se generará uno
        automáticamente.
      </Alert>

      {draft.pedidosSeleccionados.map((p, pIdx) => (
        <Accordion
          key={p.id}
          expanded={
            expandedPanel === false ? pIdx === 0 : expandedPanel === p.id
          }
          onChange={(e, isExpanded) =>
            setExpandedPanel(isExpanded ? p.id : 'none')
          }
          TransitionProps={{ unmountOnExit: true }}
          elevation={0}
          sx={{
            mb: 2,
            border: 1,
            borderColor: 'divider',
            '&:before': { display: 'none' },
          }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              width="100%"
              onClick={(e) => e.stopPropagation()}
            >
              <Typography variant="subtitle2" color="primary">
                {p.proveedor} - {p.descripcion}
              </Typography>
              <TextField
                size="small"
                label="Nº Albarán"
                placeholder="Auto-generado si vacío"
                value={p.nAlbaran || ''}
                onChange={(e) => {
                  const newPedidos = [...draft.pedidosSeleccionados];
                  newPedidos[pIdx] = { ...p, nAlbaran: e.target.value };
                  setDraft({ ...draft, pedidosSeleccionados: newPedidos });
                }}
                sx={{ width: 220, mr: 2 }}
              />
            </Box>
          </AccordionSummary>
          <AccordionDetails sx={{ p: 0 }}>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{
                mt: 1,
                border: 'none',
                boxShadow: 'none',
                overflowX: 'auto',
              }}
            >
              <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: '30%' }}>Item</TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>
                      Unidad
                    </TableCell>
                    <TableCell align="right" sx={{ width: '8%' }}>
                      Exp.
                    </TableCell>
                    <TableCell align="right" sx={{ width: '8%' }}>
                      Alb.
                    </TableCell>
                    <TableCell align="right" sx={{ width: '10%' }}>
                      Real
                    </TableCell>
                    <TableCell sx={{ width: '12%' }}>Origen peso</TableCell>
                    <TableCell sx={{ width: '16%' }}>Estado Físico</TableCell>
                    <TableCell sx={{ width: '20%' }}>Notas</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {p.lineas.map((l, originalLIdx) => {
                    const isVisible =
                      Number(l.cantidadRecibida) > 0 ||
                      l.estado === 'No entregado';

                    if (!isVisible) return null;

                    return (
                      <TableRow key={l.pedidoProductoId}>
                        <TableCell
                          sx={{
                            lineHeight: 1.2,
                            whiteSpace: 'normal',
                            wordWrap: 'break-word',
                            p: 1,
                          }}
                        >
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 500, display: 'block' }}
                          >
                            {l.nombreProducto}
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary', display: 'block' }}
                          >
                            {l.codigoBarras
                              ? `EAN: ${l.codigoBarras}`
                              : 'Sin código'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Typography
                            variant="caption"
                            sx={{ color: 'text.secondary' }}
                          >
                            {l.unidad}
                          </Typography>
                        </TableCell>
                        <TableCell align="right">{l.cantidadPedida}</TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color: l.cantidadAlbaran
                              ? 'inherit'
                              : 'text.secondary',
                          }}
                        >
                          {l.cantidadAlbaran || '-'}
                        </TableCell>
                        <TableCell
                          align="right"
                          sx={{
                            color:
                              Number(l.cantidadRecibida) !== l.cantidadPedida
                                ? 'orange'
                                : 'inherit',
                            fontWeight: 'bold',
                          }}
                        >
                          {l.cantidadRecibida || 0}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            color={l.isWeighedWithScale ? 'success' : 'default'}
                            label={
                              Number(l.cantidadRecibida) > 0
                                ? l.isWeighedWithScale
                                  ? 'Báscula'
                                  : 'Manual'
                                : '—'
                            }
                            variant={
                              l.isWeighedWithScale ? 'filled' : 'outlined'
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <FormControl size="small" fullWidth>
                            <Select
                              value={l.estadoVisual}
                              MenuProps={{ disableScrollLock: true }}
                              onChange={(e) =>
                                onUpdateLinea(
                                  pIdx,
                                  originalLIdx,
                                  'estadoVisual',
                                  e.target.value
                                )
                              }
                            >
                              <MenuItem value={EstadoVisualProducto.OPTIMO}>
                                Óptimo
                              </MenuItem>
                              <MenuItem value={EstadoVisualProducto.ROTO}>
                                Roto
                              </MenuItem>
                              <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>
                                Defectuoso
                              </MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>
                        <TableCell>
                          {(() => {
                            const hasDiscrepancy =
                              Number(l.cantidadRecibida) !== l.cantidadPedida ||
                              (l.cantidadAlbaran !== '' &&
                                l.cantidadAlbaran != null &&
                                Number(l.cantidadAlbaran) !==
                                  l.cantidadPedida) ||
                              l.estadoVisual !== EstadoVisualProducto.OPTIMO;
                            const isMissingNote =
                              hasDiscrepancy &&
                              (!l.observaciones ||
                                l.observaciones.trim() === '');

                            return (
                              <TextField
                                placeholder={
                                  hasDiscrepancy
                                    ? 'Justificante Obligatorio*'
                                    : 'Opcional...'
                                }
                                error={isMissingNote}
                                size="small"
                                fullWidth
                                value={l.observaciones}
                                onChange={(e) => {
                                  onUpdateLinea(
                                    pIdx,
                                    originalLIdx,
                                    'observaciones',
                                    e.target.value
                                  );
                                }}
                              />
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {draft.productosEspontaneos.length > 0 && (
        <Paper
          sx={{
            p: 2,
            mb: 2,
            bgcolor: 'background.default',
            border: 1,
            borderColor: 'divider',
          }}
          elevation={0}
        >
          <Typography variant="subtitle2" color="secondary" sx={{ mb: 2 }}>
            Especial / Fuera de Pedido 🆕
          </Typography>

          <TableContainer
            component={Paper}
            variant="outlined"
            sx={{
              mt: 1,
              border: 'none',
              boxShadow: 'none',
              bgcolor: 'transparent',
              overflowX: 'auto',
            }}
          >
            <Table size="small" sx={{ tableLayout: 'fixed', minWidth: 900 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ width: '30%' }}>Item</TableCell>
                  <TableCell align="center" sx={{ width: '8%' }}>
                    Unidad
                  </TableCell>
                  <TableCell align="right" sx={{ width: '10%' }}>
                    Exp.
                  </TableCell>
                  <TableCell align="right" sx={{ width: '10%' }}>
                    Alb.
                  </TableCell>
                  <TableCell align="right" sx={{ width: '12%' }}>
                    Real
                  </TableCell>
                  <TableCell sx={{ width: '12%' }}>Origen peso</TableCell>
                  <TableCell sx={{ width: '15%' }}>Estado Físico</TableCell>
                  <TableCell sx={{ width: '15%' }}>Notas</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {draft.productosEspontaneos.map((l, lIdx) => (
                  <TableRow key={lIdx}>
                    <TableCell>{l.nombreProducto}</TableCell>
                    <TableCell align="center">
                      <Typography
                        variant="caption"
                        sx={{ color: 'text.secondary' }}
                      >
                        {l.unidad}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">0</TableCell>
                    <TableCell
                      align="right"
                      sx={{ color: 'orange', fontWeight: 'bold' }}
                    >
                      {l.cantidadRecibida || 0}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={l.isWeighedWithScale ? 'success' : 'default'}
                        label={
                          Number(l.cantidadRecibida) > 0
                            ? l.isWeighedWithScale
                              ? 'Báscula'
                              : 'Manual'
                            : '—'
                        }
                        variant={l.isWeighedWithScale ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                    <TableCell>
                      <FormControl size="small" fullWidth>
                        <Select
                          value={l.estadoVisual || EstadoVisualProducto.OPTIMO}
                          MenuProps={{ disableScrollLock: true }}
                          onChange={(e) =>
                            onUpdateLinea(
                              null,
                              lIdx,
                              'estadoVisual',
                              e.target.value
                            )
                          }
                        >
                          <MenuItem value={EstadoVisualProducto.OPTIMO}>
                            Óptimo
                          </MenuItem>
                          <MenuItem value={EstadoVisualProducto.ROTO}>
                            Roto
                          </MenuItem>
                          <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>
                            Defectuoso
                          </MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const isMissingNote =
                          !l.observaciones || l.observaciones.trim() === '';
                        return (
                          <TextField
                            placeholder="Justificante Obligatorio*"
                            error={isMissingNote}
                            size="small"
                            fullWidth
                            value={l.observaciones}
                            onChange={(e) => {
                              onUpdateLinea(
                                null,
                                lIdx,
                                'observaciones',
                                e.target.value
                              );
                            }}
                          />
                        );
                      })()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Box sx={{ mt: 3, mb: 1 }}>
        <TextField
          label="Firma / Observaciones generales"
          value={draft.observaciones}
          onChange={(e) =>
            setDraft({ ...draft, observaciones: e.target.value })
          }
          fullWidth
          multiline
          rows={2}
          placeholder="Añade aquí cualquier nota general de la entrega o firma..."
        />
      </Box>
    </Box>
  );
};

export default PasoRevision;
