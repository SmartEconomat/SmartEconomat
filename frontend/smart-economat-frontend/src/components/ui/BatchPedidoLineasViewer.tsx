import React from 'react';
import { useTranslation } from 'react-i18next';
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
  Stack,
  FormControlLabel,
  Checkbox,
  Button,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import {
  PedidoUsuario,
  PurchaseBatch,
  Pedido,
  EstadoPedido,
} from '../../services/pedido.types';
import StatusChip from './StatusChip';
import { downloadFile } from '../../services/api.service';
import { useToast } from '../../store/toast.hooks';
import CircularProgress from '@mui/material/CircularProgress';
import {
  formatPedidoId,
  formatPedidoListNumber,
} from '../../features/pedidos/utils/pedidoFormatters';

type PedidoWithAggregate = Pedido & {
  pedidoUsuario?: Pick<PedidoUsuario, 'id' | 'numeroGlobal'>;
  numeroPedidoVisible?: string;
  referenciaPedidoVisible?: string;
};

interface BatchProviderGroup {
  proveedor?: Pedido['proveedor'];
  pedidos: Pedido[];
  total: number;
}

interface InvolvedPedidoSummary {
  numeroPedidoProveedor?: string;
  numeroPedidoVisible?: string;
  id: string;
  proveedor?: string;
  usuario?: string;
  fecha: string;
  estado: EstadoPedido;
}

interface AggregatedProductGroup {
  pp: NonNullable<Pedido['pedidoProductos']>[number];
  totalCantidad: number;
  usuarios: Set<string>;
  numerosPedidoProveedor: Set<string>;
  referenciasPedidoVisible: Set<string>;
}

interface BatchPedidoLineasViewerProps {
  batch: PurchaseBatch | PedidoUsuario;
  mode?: 'batch' | 'pedido';
  showPdfActions?: boolean;
}

/**
 * Viewer for the product lines of a purchase batch or user order.
 *
 * Groups products by supplier, aggregates quantities across individual orders,
 * and optionally shows a summary table of all involved orders. Provides PDF
 * download with configurable options (include cancelled orders, page per supplier).
 *
 * @param props - See {@link BatchPedidoLineasViewerProps}.
 * @returns JSX element with grouped product tables, optional order summary, and print controls.
 * @example
 * <BatchPedidoLineasViewer batch={purchaseBatch} mode="batch" />
 */
const BatchPedidoLineasViewer: React.FC<BatchPedidoLineasViewerProps> = ({
  batch,
  mode = 'batch',
  showPdfActions = true,
}) => {
  const { t } = useTranslation();
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
        `${mode === 'pedido' ? `/pedido-usuarios/${batch.id}/pdf` : `/purchase-batches/${batch.id}/pdf`}?${params.toString()}`,
        `${mode === 'pedido' ? 'pedido' : 'reporte-lote'}-${batch.id.slice(0, 8)}.pdf`
      );
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : t('batchLineas.downloadError')
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const groupedByProvider = React.useMemo(() => {
    const groups: Record<string, BatchProviderGroup> = {};

    batch.pedidos?.forEach((pedido) => {
      if (!incluirCancelados && pedido.estado === EstadoPedido.CANCELADO)
        return;

      const key = pedido.proveedor?.id ?? '__sin_proveedor__';
      if (!groups[key]) {
        groups[key] = {
          proveedor: pedido.proveedor,
          pedidos: [],
          total: 0,
        };
      }
      groups[key].pedidos.push(pedido);
      groups[key].total += Number(pedido.costeTotal ?? 0);
    });

    return Object.values(groups);
  }, [batch.pedidos, incluirCancelados]);

  const involvedPedidos = React.useMemo(() => {
    const list: InvolvedPedidoSummary[] = [];

    batch.pedidos?.forEach((p) => {
      if (!incluirCancelados && p.estado === EstadoPedido.CANCELADO) return;

      const pedido = p as PedidoWithAggregate;
      const numeroPedidoVisible =
        pedido.numeroPedidoVisible || pedido.pedidoUsuario?.numeroGlobal;

      list.push({
        numeroPedidoProveedor: formatPedidoListNumber(
          pedido,
          'pedido-proveedor'
        ),
        numeroPedidoVisible,
        id: pedido.id,
        proveedor: pedido.proveedor?.nombre,
        usuario: pedido.usuario?.nombre,
        fecha: pedido.fechaPedido,
        estado: pedido.estado,
      });
    });

    return list;
  }, [batch.pedidos, incluirCancelados]);

  const groupedProductsByProvider = React.useMemo(() => {
    return groupedByProvider.map((group) => {
      const productMap: Record<string, AggregatedProductGroup> = {};

      group.pedidos.forEach((pedido) => {
        pedido.pedidoProductos?.forEach((pp) => {
          const key = pp.productoProveedor?.id || pp.id;
          if (!productMap[key]) {
            productMap[key] = {
              pp,
              totalCantidad: 0,
              usuarios: new Set(),
              numerosPedidoProveedor: new Set(),
              referenciasPedidoVisible: new Set(),
            };
          }
          productMap[key].totalCantidad += Number(pp.cantidad || 0);
          if (pedido.usuario?.nombre) {
            productMap[key].usuarios.add(pedido.usuario.nombre);
          }

          const numeroPedidoProveedor = formatPedidoListNumber(
            pedido,
            'pedido-proveedor'
          );

          if (numeroPedidoProveedor) {
            productMap[key].numerosPedidoProveedor.add(numeroPedidoProveedor);
          }

          const pedidoConReferencias = pedido as PedidoWithAggregate;
          const referenciaPedidoVisible =
            pedidoConReferencias.referenciaPedidoVisible ||
            (pedidoConReferencias.numeroPedidoVisible ||
            pedidoConReferencias.pedidoUsuario?.numeroGlobal
              ? `PU-${String(
                  pedidoConReferencias.numeroPedidoVisible ||
                    pedidoConReferencias.pedidoUsuario?.numeroGlobal
                )}`
              : undefined);

          if (referenciaPedidoVisible) {
            productMap[key].referenciasPedidoVisible.add(
              referenciaPedidoVisible
            );
          }
        });
      });

      return {
        ...group,
        productosAgrupados: Object.values(productMap),
      };
    });
  }, [groupedByProvider]);

  if (!batch || !batch.pedidos || batch.pedidos.length === 0) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Typography color="text.secondary">
          {mode === 'pedido'
            ? t('batchLineas.noLines')
            : t('batchLineas.noPedidos')}
        </Typography>
      </Box>
    );
  }

  const totalBatch = batch.pedidos
    .filter((p) => incluirCancelados || p.estado !== EstadoPedido.CANCELADO)
    .reduce((sum, p) => sum + Number(p.costeTotal || 0), 0);

  const isAutomatedObservation = /^Lote semanal generado desde/i.test(
    batch.observaciones || ''
  );
  const hasCustomObservations =
    batch.observaciones &&
    !isAutomatedObservation &&
    batch.observaciones.trim() !== '';

  return (
    <Box sx={{ mt: 2 }}>
      {/* Solo mostramos observaciones si son personalizadas */}
      {hasCustomObservations && (
        <Box
          sx={{
            mb: 3,
            p: 2,
            bgcolor: 'info.lighter',
            borderLeft: '4px solid',
            borderColor: 'info.main',
            borderRadius: '0 4px 4px 0',
          }}
        >
          <Typography
            variant="caption"
            color="info.main"
            sx={{ fontWeight: 'bold', textTransform: 'uppercase' }}
          >
            {t('batchLineas.observations')}:
          </Typography>
          <Typography variant="body2" sx={{ mt: 0.5 }}>
            {batch.observaciones}
          </Typography>
        </Box>
      )}

      {groupedProductsByProvider.map((group) => (
        <Box key={group.proveedor?.id || 'unknown'} sx={{ mb: 4 }}>
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
                {group.proveedor?.nombre || t('batchLineas.unknownSupplier')}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('batchLineas.consolidatedOrders', {
                  count: group.pedidos.length,
                })}
              </Typography>
            </Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
              {t('batchLineas.subtotal')}: {group.total.toFixed(2)} €
            </Typography>
          </Box>

          <TableContainer component={Paper} variant="outlined" elevation={0}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('batchLineas.columns.productBrand')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('batchLineas.columns.orderedBy')}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 'bold', width: 90 }}
                  >
                    {t('batchLineas.columns.quantity')}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 'bold', width: 110 }}
                  >
                    {t('batchLineas.columns.unitPrice')}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{ fontWeight: 'bold', width: 110 }}
                  >
                    {t('batchLineas.columns.subtotal')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {group.productosAgrupados.map((item) => (
                  <TableRow key={item.pp.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.pp.productoProveedor?.producto?.nombre ||
                          t('batchLineas.unknown')}
                      </Typography>
                      {item.pp.productoProveedor?.marca && (
                        <Typography variant="caption" color="text.secondary">
                          {t('batchLineas.brand')}:{' '}
                          {item.pp.productoProveedor.marca}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ fontWeight: 500 }}>
                        {Array.from(item.usuarios).join(', ') || '—'}
                      </Typography>
                      {item.numerosPedidoProveedor.size > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          {t('batchLineas.supplierOrders')}: #
                          {Array.from(item.numerosPedidoProveedor).join(', #')}
                        </Typography>
                      )}
                      {item.referenciasPedidoVisible.size > 0 && (
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          display="block"
                          sx={{ fontSize: '0.7rem' }}
                        >
                          {t('batchLineas.visibleRef')}:{' '}
                          {Array.from(item.referenciasPedidoVisible).join(', ')}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">{item.totalCantidad}</TableCell>
                    <TableCell align="right">
                      {Number(item.pp.precioUnitario || 0).toFixed(2)} €
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      {(
                        Number(item.totalCantidad || 0) *
                        Number(item.pp.precioUnitario || 0)
                      ).toFixed(2)}{' '}
                      €
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      ))}

      <Divider sx={{ my: 4 }} />

      {mode === 'batch' && involvedPedidos.length > 0 && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
            {t('batchLineas.involvedOrders')}
          </Typography>
          <TableContainer component={Paper} variant="outlined" elevation={0}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.50' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('batchLineas.involvedColumns.supplierOrderNo')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('batchLineas.involvedColumns.supplier')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('batchLineas.involvedColumns.visibleRef')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('batchLineas.involvedColumns.user')}
                  </TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>
                    {t('batchLineas.involvedColumns.date')}
                  </TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {t('batchLineas.involvedColumns.status')}
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {involvedPedidos.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {p.numeroPedidoProveedor
                          ? `#${p.numeroPedidoProveedor}`
                          : formatPedidoId(p.id)}
                      </Typography>
                    </TableCell>
                    <TableCell>{p.proveedor || '—'}</TableCell>
                    <TableCell>
                      {p.numeroPedidoVisible
                        ? `PU-${p.numeroPedidoVisible}`
                        : '—'}
                    </TableCell>
                    <TableCell>{p.usuario || '—'}</TableCell>
                    <TableCell>
                      {new Date(p.fecha).toLocaleDateString('es-ES')}
                    </TableCell>
                    <TableCell align="center">
                      <StatusChip status={p.estado} size="small" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          mt: 4,
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2,
          border: '1px dashed',
          borderColor: 'divider',
        }}
      >
        <Box>
          <Typography
            variant="subtitle2"
            gutterBottom
            sx={{ fontWeight: 'bold', color: 'text.secondary' }}
          >
            {t('batchLineas.printOptions').toUpperCase()}
          </Typography>
          <Stack direction="row" spacing={3}>
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={incluirCancelados}
                  onChange={(e) => setIncluirCancelados(e.target.checked)}
                />
              }
              label={
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {t('batchLineas.includeCancelled')}
                </Typography>
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
                <Typography variant="caption" sx={{ fontWeight: 500 }}>
                  {t('batchLineas.pagePerSupplier')}
                </Typography>
              }
            />
          </Stack>
        </Box>

        <Stack direction="row" spacing={2} alignItems="center">
          {showPdfActions && (
            <Button
              variant="outlined"
              color="error"
              startIcon={
                isDownloading ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <PictureAsPdfIcon />
                )
              }
              onClick={handleDownloadPdf}
              disabled={isDownloading}
              size="small"
            >
              {t('batchLineas.downloadPdf')}
            </Button>
          )}
          <Box
            sx={{
              display: 'inline-flex',
              p: 2,
              px: 3,
              bgcolor: 'background.paper',
              color: 'secondary.main',
              border: '2px solid',
              borderColor: 'secondary.main',
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(216, 27, 96, 0.1)',
            }}
          >
            <Typography
              variant="h5"
              sx={{ fontWeight: 800, letterSpacing: -0.5 }}
            >
              {mode === 'pedido'
                ? `${t('batchLineas.total')}: `
                : `${t('batchLineas.totalPurchase')}: `}
              {totalBatch.toFixed(2)} €
            </Typography>
          </Box>
        </Stack>
      </Box>
    </Box>
  );
};

export default BatchPedidoLineasViewer;
