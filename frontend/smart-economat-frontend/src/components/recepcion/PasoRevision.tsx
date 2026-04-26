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
import { useTranslation } from 'react-i18next';
import {
  RecepcionDraft,
  LineaDraft,
  EstadoVisualProducto,
} from '../../services/recepcion.types';

/**
 * Documentación en español.
 */
const hasDraftText = (value?: string): boolean =>
  typeof value === 'string' && value.trim().length > 0;

/**
 * Documentación en español.
 */
const hasCantidadAlbaran = (linea: LineaDraft): boolean =>
  linea.cantidadAlbaran !== '' && linea.cantidadAlbaran != null;

/**
 * Documentación en español.
 */
const isLineaVisibleEnRevision = (linea: LineaDraft): boolean =>
  Boolean(
    linea.intervenida ||
    Number(linea.cantidadRecibida) > 0 ||
    hasCantidadAlbaran(linea) ||
    hasDraftText(linea.observaciones) ||
    hasDraftText(linea.fechaCaducidad) ||
    linea.estadoVisual !== EstadoVisualProducto.OPTIMO
  );

/**
 * Documentación en español.
 */
interface PasoRevisionProps {
        /**
     * Documentación en español.
     */
  draft: RecepcionDraft;
        /**
     * Documentación en español.
     */
  setDraft: React.Dispatch<React.SetStateAction<RecepcionDraft>>;
        /**
     * Documentación en español.
     */
  expandedPanel: string | false;
        /**
     * Documentación en español.
     */
  setExpandedPanel: (panel: string | false) => void;
        /**
     * Documentación en español.
     */
  onUpdateLinea: (
    pIdx: number | null,
    lIdx: number,
    field: string,
    value: string | number | boolean | undefined
  ) => void;
}

/**
 * Documentación en español.
 */
const PasoRevision: React.FC<PasoRevisionProps> = ({
  draft,
  setDraft,
  expandedPanel,
  setExpandedPanel,
  onUpdateLinea,
}) => {
  const { t } = useTranslation();

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        {t('recepcion.revision.instruccion')}
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
                label={t('recepcion.revision.numAlbaran')}
                placeholder={t('recepcion.revision.autoGenerado')}
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
                    <TableCell sx={{ width: '30%' }}>
                      {t('comun.item')}
                    </TableCell>
                    <TableCell align="center" sx={{ width: '8%' }}>
                      {t('comun.unidad')}
                    </TableCell>
                    <TableCell align="right" sx={{ width: '8%' }}>
                      {t('recepcion.revision.exp')}
                    </TableCell>
                    <TableCell align="right" sx={{ width: '8%' }}>
                      {t('recepcion.revision.alb')}
                    </TableCell>
                    <TableCell align="right" sx={{ width: '10%' }}>
                      {t('recepcion.revision.real')}
                    </TableCell>
                    <TableCell sx={{ width: '12%' }}>
                      {t('recepcion.revision.origenPeso')}
                    </TableCell>
                    <TableCell sx={{ width: '16%' }}>
                      {t('recepcion.revision.estadoFisico')}
                    </TableCell>
                    <TableCell sx={{ width: '20%' }}>
                      {t('comun.notas')}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {p.lineas.map((l, originalLIdx) => {
                    const isVisible = isLineaVisibleEnRevision(l);

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
                              ? `${t('recepcion.escaneo.ean')}: ${l.codigoBarras}`
                              : t('recepcion.escaneo.sinCodigo')}
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
                                  ? t('recepcion.revision.bascula')
                                  : t('recepcion.revision.manual')
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
                                {t('recepcion.escaneo.estadoOptimo')}
                              </MenuItem>
                              <MenuItem value={EstadoVisualProducto.ROTO}>
                                {t('recepcion.escaneo.estadoRoto')}
                              </MenuItem>
                              <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>
                                {t('recepcion.revision.defectuoso')}
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
                                    ? t('recepcion.revision.justificante')
                                    : t('comun.opcional')
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
            {t('recepcion.escaneo.fueraDePedido')} 🆕
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
                  <TableCell sx={{ width: '30%' }}>{t('comun.item')}</TableCell>
                  <TableCell align="center" sx={{ width: '8%' }}>
                    {t('comun.unidad')}
                  </TableCell>
                  <TableCell align="right" sx={{ width: '10%' }}>
                    {t('recepcion.revision.exp')}
                  </TableCell>
                  <TableCell align="right" sx={{ width: '10%' }}>
                    {t('recepcion.revision.alb')}
                  </TableCell>
                  <TableCell align="right" sx={{ width: '12%' }}>
                    {t('recepcion.revision.real')}
                  </TableCell>
                  <TableCell sx={{ width: '12%' }}>
                    {t('recepcion.revision.origenPeso')}
                  </TableCell>
                  <TableCell sx={{ width: '15%' }}>
                    {t('recepcion.revision.estadoFisico')}
                  </TableCell>
                  <TableCell sx={{ width: '15%' }}>
                    {t('comun.notas')}
                  </TableCell>
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
                              ? t('recepcion.revision.bascula')
                              : t('recepcion.revision.manual')
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
                            {t('recepcion.escaneo.estadoOptimo')}
                          </MenuItem>
                          <MenuItem value={EstadoVisualProducto.ROTO}>
                            {t('recepcion.escaneo.estadoRoto')}
                          </MenuItem>
                          <MenuItem value={EstadoVisualProducto.DEFECTUOSO}>
                            {t('recepcion.revision.defectuoso')}
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
                            placeholder={t('recepcion.revision.justificante')}
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
          label={t('recepcion.revision.firma')}
          value={draft.observaciones}
          onChange={(e) =>
            setDraft({ ...draft, observaciones: e.target.value })
          }
          fullWidth
          multiline
          rows={2}
          placeholder={t('recepcion.revision.notasPlaceholder')}
        />
      </Box>
    </Box>
  );
};

export default PasoRevision;
