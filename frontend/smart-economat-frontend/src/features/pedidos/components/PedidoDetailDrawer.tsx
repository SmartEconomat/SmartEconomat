import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import DetailModal, { DetailSection } from '../../../components/ui/DetailModal';
import StatusChip from '../../../components/ui/StatusChip';
import {
  downloadPedidoPdf,
  printPedidoPdf,
} from '../../../services/pedido.service';
import { EstadoPedido, Pedido } from '../../../services/pedido.types';
import { useToast } from '../../../store/toast.hooks';
import {
  formatCurrency,
  formatPedidoDate,
  formatPedidoId,
  formatPedidoListNumber,
  getPedidoCreatorName,
  getPedidoProviderName,
} from '../utils/pedidoFormatters';

interface PedidoDetailDrawerProps {
  pedido: Pedido | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (pedido: Pedido) => void;
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
const PedidoDetailDrawer: React.FC<PedidoDetailDrawerProps> = ({
  pedido,
  canEdit,
  onClose,
  onEdit,
}) => {
  const { t } = useTranslation();
  const toast = useToast();
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [isPrintingPdf, setIsPrintingPdf] = React.useState(false);

  const handleDownloadPdf = async () => {
    if (!pedido) return;

    setIsDownloadingPdf(true);
    try {
      await downloadPedidoPdf(pedido.id);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('pedidos.detalle.errores.descargaPdf')
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!pedido) return;

    setIsPrintingPdf(true);
    try {
      await printPedidoPdf(pedido.id);
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : t('pedidos.detalle.errores.impresionPdf')
      );
    } finally {
      setIsPrintingPdf(false);
    }
  };

  const sections: DetailSection[] = [
    {
      title: t('pedidos.detalle.secciones.resumen'),
      fields: [
        {
          label: t('pedidos.detalle.campos.proveedor'),
          value: pedido ? getPedidoProviderName(pedido) : '—',
        },
        {
          label: t('pedidos.detalle.campos.estado'),
          value: pedido ? <StatusChip status={pedido.estado} /> : '—',
        },
        {
          label: t('pedidos.detalle.campos.creadoPor'),
          value: pedido ? getPedidoCreatorName(pedido) : '—',
        },
        {
          label: t('pedidos.detalle.campos.costeTotal'),
          value: pedido ? formatCurrency(pedido.costeTotal) : '—',
        },
        {
          label: t('pedidos.detalle.campos.fechaPedido'),
          value: pedido ? formatPedidoDate(pedido.fechaPedido) : '—',
        },
        {
          label: t('pedidos.detalle.campos.fechaEntrega'),
          value: pedido ? formatPedidoDate(pedido.fechaEntrega) : '—',
        },
      ],
    },
    {
      title: t('pedidos.detalle.secciones.lineas'),
      content: pedido?.pedidoProductos?.length ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>{t('pedidos.detalle.tabla.producto')}</TableCell>
              <TableCell align="right">
                {t('pedidos.detalle.tabla.cantidad')}
              </TableCell>
              <TableCell align="right">
                {t('pedidos.detalle.tabla.precio')}
              </TableCell>
              <TableCell align="right">
                {t('pedidos.detalle.tabla.subtotal')}
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pedido.pedidoProductos.map((line) => {
              const subtotal =
                Number(line.cantidad || 0) * Number(line.precioUnitario || 0);
              return (
                <TableRow key={line.id} hover>
                  <TableCell>
                    <Stack spacing={0.5}>
                      <Typography variant="body2" fontWeight={600}>
                        {line.productoProveedor?.producto?.nombre ||
                          t('pedidos.detalle.productoNoDisponible')}
                      </Typography>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        flexWrap="wrap"
                      >
                        {line.productoProveedor?.marca && (
                          <Chip
                            size="small"
                            label={t('pedidos.detalle.marca', {
                              marca: line.productoProveedor.marca,
                            })}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {line.productoProveedor?.producto?.unidad ||
                            t('pedidos.detalle.unidadFallback')}
                        </Typography>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell align="right">{line.cantidad}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(line.precioUnitario)}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(subtotal)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      ) : (
        <Typography color="text.secondary">
          {t('pedidos.detalle.sinLineas')}
        </Typography>
      ),
    },
    {
      title: t('pedidos.detalle.secciones.observaciones'),
      content: (
        <>
          <Typography variant="body2" color="text.secondary">
            {pedido?.observaciones || t('pedidos.detalle.sinObservaciones')}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">
            {t('pedidos.detalle.notaFechaEntrega')}
          </Typography>
        </>
      ),
    },
  ];

  const headerAlerts = (
    <Stack spacing={1.5}>
      {pedido?.estado === EstadoPedido.CANCELADO &&
        pedido.motivoCancelacion && (
          <Alert severity="warning">{pedido.motivoCancelacion}</Alert>
        )}

      {pedido?.estado === EstadoPedido.INCIDENCIA &&
        pedido.motivoIncidencia && (
          <Alert severity="error">{pedido.motivoIncidencia}</Alert>
        )}
    </Stack>
  );

  return (
    <DetailModal
      isOpen={!!pedido}
      onClose={onClose}
      title={t('pedidos.detalleTitulo')}
      subtitle={
        pedido
          ? t('pedidos.detalle.subtitulo', {
              numero: formatPedidoListNumber(pedido),
              id: formatPedidoId(pedido.id),
            })
          : undefined
      }
      size="lg"
      actions={
        pedido ? (
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 1.5,
              flexWrap: 'wrap',
            }}
          >
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<PictureAsPdfIcon />}
                onClick={() => void handleDownloadPdf()}
                disabled={isDownloadingPdf || isPrintingPdf}
              >
                {isDownloadingPdf
                  ? t('pedidos.detalle.acciones.descargando')
                  : t('pedidos.detalle.acciones.descargarPdf')}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<PrintOutlinedIcon />}
                onClick={() => void handlePrintPdf()}
                disabled={isPrintingPdf || isDownloadingPdf}
              >
                {isPrintingPdf
                  ? t('pedidos.detalle.acciones.preparandoImpresion')
                  : t('pedidos.detalle.acciones.imprimirPdf')}
              </Button>
            </Stack>

            {canEdit &&
              pedido.estado === EstadoPedido.PENDIENTE_DE_APROBACION && (
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  onClick={() => onEdit(pedido)}
                >
                  {t('pedidos.detalle.acciones.editarPedido')}
                </Button>
              )}
          </Box>
        ) : undefined
      }
      sections={[
        ...(pedido &&
        (pedido.estado === EstadoPedido.CANCELADO ||
          pedido.estado === EstadoPedido.INCIDENCIA)
          ? [
              {
                content: <Box sx={{ pt: 1 }}>{headerAlerts}</Box>,
              },
            ]
          : []),
        {
          content: (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              <Box>{sections[0].fields && <></>}</Box>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                  gap: { xs: 1, sm: 2 },
                }}
              >
                {sections[0].fields?.map((field, index) => (
                  <Box key={index}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        display: 'block',
                        mb: 0.25,
                      }}
                    >
                      {field.label}
                    </Typography>
                    <Box
                      sx={{
                        minHeight: 28,
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      {field.value}
                    </Box>
                  </Box>
                ))}
              </Box>
            </Paper>
          ),
        },
        {
          title: t('pedidos.detalle.secciones.lineas'),
          content: (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              {sections[1].content}
            </Paper>
          ),
        },
        {
          title: t('pedidos.detalle.secciones.observaciones'),
          content: (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              {sections[2].content}
            </Paper>
          ),
        },
      ]}
    />
  );
};

export default PedidoDetailDrawer;
