import React from 'react';
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
  getPedidoCreatorName,
  getPedidoProviderName,
} from '../utils/pedidoFormatters';

interface PedidoDetailDrawerProps {
  pedido: Pedido | null;
  canEdit: boolean;
  onClose: () => void;
  onEdit: (pedido: Pedido) => void;
}

const PedidoDetailDrawer: React.FC<PedidoDetailDrawerProps> = ({
  pedido,
  canEdit,
  onClose,
  onEdit,
}) => {
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
          : 'No se pudo descargar el PDF del pedido.'
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
          : 'No se pudo abrir la impresión del PDF del pedido.'
      );
    } finally {
      setIsPrintingPdf(false);
    }
  };

  const sections: DetailSection[] = [
    {
      title: 'Resumen',
      fields: [
        {
          label: 'Proveedor',
          value: pedido ? getPedidoProviderName(pedido) : '—',
        },
        {
          label: 'Estado',
          value: pedido ? <StatusChip status={pedido.estado} /> : '—',
        },
        {
          label: 'Creado por',
          value: pedido ? getPedidoCreatorName(pedido) : '—',
        },
        {
          label: 'Coste total',
          value: pedido ? formatCurrency(pedido.costeTotal) : '—',
        },
        {
          label: 'Fecha del pedido',
          value: pedido ? formatPedidoDate(pedido.fechaPedido) : '—',
        },
        {
          label: 'Fecha estimada de entrega',
          value: pedido ? formatPedidoDate(pedido.fechaEntrega) : '—',
        },
      ],
    },
    {
      title: 'Líneas del pedido',
      content: pedido?.pedidoProductos?.length ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Producto</TableCell>
              <TableCell align="right">Cantidad</TableCell>
              <TableCell align="right">Precio</TableCell>
              <TableCell align="right">Subtotal</TableCell>
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
                          'Producto no disponible'}
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
                            label={`Marca: ${line.productoProveedor.marca}`}
                          />
                        )}
                        <Typography variant="caption" color="text.secondary">
                          {line.productoProveedor?.producto?.unidad || 'ud.'}
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
          No hay líneas disponibles para este pedido.
        </Typography>
      ),
    },
    {
      title: 'Observaciones',
      content: (
        <>
          <Typography variant="body2" color="text.secondary">
            {pedido?.observaciones || 'Sin observaciones registradas.'}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="caption" color="text.secondary">
            La fecha de entrega se calcula automáticamente en backend y no puede
            modificarse manualmente.
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
      title="Detalle del pedido"
      subtitle={pedido ? `ID ${formatPedidoId(pedido.id)}` : undefined}
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
                {isDownloadingPdf ? 'Descargando...' : 'Descargar PDF'}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<PrintOutlinedIcon />}
                onClick={() => void handlePrintPdf()}
                disabled={isPrintingPdf || isDownloadingPdf}
              >
                {isPrintingPdf ? 'Preparando impresión...' : 'Imprimir PDF'}
              </Button>
            </Stack>

            {canEdit && pedido.estado === EstadoPedido.PENDIENTE && (
              <Button
                variant="contained"
                color="primary"
                disableElevation
                onClick={() => onEdit(pedido)}
              >
                Editar pedido
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
          title: 'Líneas del pedido',
          content: (
            <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2 }}>
              {sections[1].content}
            </Paper>
          ),
        },
        {
          title: 'Observaciones',
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
