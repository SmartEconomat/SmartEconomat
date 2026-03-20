import React from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Divider,
  Alert,
  IconButton,
  Tooltip,
  Stack,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  PurchaseBatch,
  Pedido,
  EstadoPedido,
} from '../../services/pedido.types';
import StatusChip from './StatusChip';
import { downloadFile } from '../../services/api.service';
import { useToast } from '../../store/toast.hooks';
import CircularProgress from '@mui/material/CircularProgress';

interface BatchPedidoLineasViewerProps {
  batch: PurchaseBatch;
}

const BatchPedidoLineasViewer: React.FC<BatchPedidoLineasViewerProps> = ({
  batch,
}) => {
  const toast = useToast();
  const [incluirCancelados, setIncluirCancelados] = React.useState(true);
  const [paginaPorProveedor, setPaginaPorProveedor] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    const params = new URLSearchParams({
      incluirCancelados: incluirCancelados.toString(),
      paginaPorProveedor: paginaPorProveedor.toString(),
    });

    try {
      await downloadFile(
        `/purchase-batches/${batch.id}/pdf?${params.toString()}`,
        `reporte-lote-${batch.id.slice(0, 8)}.pdf`
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Error al descargar el PDF'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  if (!batch || !batch.pedidos || batch.pedidos.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          No hay pedidos en este lote.
        </Typography>
      </Box>
    );
  }

  const totalBatch = batch.pedidos
    .filter((p) => incluirCancelados || p.estado !== EstadoPedido.CANCELADO)
    .reduce((sum, p) => sum + Number(p.costeTotal || 0), 0);

  return (
    <Box sx={{ mt: 2 }}>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 2,
          p: 2,
          bgcolor: 'action.hover',
          borderRadius: 1,
        }}
      >
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Observaciones Generales:
          </Typography>
          <Typography variant="body1">
            {batch.observaciones || 'Sin observaciones.'}
          </Typography>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={incluirCancelados}
                onChange={(e) => setIncluirCancelados(e.target.checked)}
              />
            }
            label={
              <Typography variant="caption">Incluir cancelados</Typography>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                size="small"
                checked={paginaPorProveedor}
                onChange={(e) => setPaginaPorProveedor(e.target.checked)}
              />
            }
            label={
              <Typography variant="caption">Pág. por proveedor</Typography>
            }
          />
          <Tooltip title="Descargar Reporte PDF">
            <IconButton
              color="error"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                <PictureAsPdfIcon />
              )}
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {batch.pedidos
        .filter((p) => incluirCancelados || p.estado !== EstadoPedido.CANCELADO)
        .map((pedido: Pedido) => (
          <Box key={pedido.id} sx={{ mb: 4 }}>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'end',
                mb: 1,
                borderBottom: '2px solid',
                borderColor: 'primary.light',
                pb: 1,
              }}
            >
              <Box>
                <Typography
                  variant="h6"
                  color="primary.main"
                  sx={{ fontWeight: 'bold' }}
                >
                  {pedido.proveedor?.nombre || 'Proveedor Desconocido'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ID Pedido: {pedido.id.split('-')[0]}... | Estado:
                </Typography>
                <StatusChip
                  status={pedido.estado}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Subtotal: {Number(pedido.costeTotal || 0).toFixed(2)} €
              </Typography>
            </Box>

            {pedido.estado === EstadoPedido.CANCELADO &&
              pedido.motivoCancelacion && (
                <Alert severity="warning" sx={{ mb: 2, py: 0 }}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                    Motivo de cancelación:
                  </Typography>{' '}
                  <Typography variant="caption">
                    {pedido.motivoCancelacion}
                  </Typography>
                </Alert>
              )}

            <TableContainer component={Paper} variant="outlined" elevation={0}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      Producto / Marca
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 'bold', width: 100 }}
                    >
                      Cantidad
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 'bold', width: 120 }}
                    >
                      Precio Unid.
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{ fontWeight: 'bold', width: 120 }}
                    >
                      Subtotal
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pedido.pedidoProductos?.map((pp) => (
                    <TableRow key={pp.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          {pp.productoProveedor?.producto?.nombre ||
                            'Desconocido'}
                        </Typography>
                        {pp.productoProveedor?.marca && (
                          <Typography variant="caption" color="text.secondary">
                            Marca: {pp.productoProveedor.marca}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{pp.cantidad}</TableCell>
                      <TableCell align="right">
                        {Number(pp.precioUnitario || 0).toFixed(2)} €
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        {(
                          Number(pp.cantidad || 0) *
                          Number(pp.precioUnitario || 0)
                        ).toFixed(2)}{' '}
                        €
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {pedido.observaciones && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 1, display: 'block' }}
              >
                * Observaciones: {pedido.observaciones}
              </Typography>
            )}
          </Box>
        ))}

      <Divider sx={{ my: 3 }} />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
          borderRadius: 2,
          boxShadow: 2,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
          TOTAL LOTE DE COMPRA: {totalBatch.toFixed(2)} €
        </Typography>
      </Box>
    </Box>
  );
};

export default BatchPedidoLineasViewer;
