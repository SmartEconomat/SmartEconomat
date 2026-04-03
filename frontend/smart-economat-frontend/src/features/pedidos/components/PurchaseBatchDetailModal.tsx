import React from 'react';
import { Box, Button, Stack, Tooltip } from '@mui/material';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import RestoreIcon from '@mui/icons-material/Restore';
import DetailModal from '../../../components/ui/DetailModal';
import BatchPedidoLineasViewer from '../../../components/ui/BatchPedidoLineasViewer';
import {
  downloadPedidoUsuarioPdf,
  downloadPurchaseBatchPdf,
  printPedidoUsuarioPdf,
  printPurchaseBatchPdf,
} from '../../../services/pedido.service';
import {
  EstadoLote,
  EstadoPedidoUsuario,
  PedidoBatchDetail,
  PurchaseBatch,
} from '../../../services/pedido.types';
import { useToast } from '../../../store/toast.hooks';
import { formatPedidoId } from '../utils/pedidoFormatters';
import { getNextBatchAction } from '../utils/purchaseBatchUtils';
import EditIcon from '@mui/icons-material/Edit';

interface PurchaseBatchDetailModalProps {
  detail: PedidoBatchDetail | null;
  canEdit?: boolean;
  canApprove?: boolean;
  canCancel?: boolean;
  onClose: () => void;
  onEdit?: (detail: PedidoBatchDetail) => void;
  onApprove?: (detail: PedidoBatchDetail) => void;
  onCancel?: (detail: PedidoBatchDetail) => void;
  onRecepcion?: (batch: PurchaseBatch) => void;
  canDistribucion?: boolean;
  onDistribucion?: (batch: PurchaseBatch) => void;
  onTramitar?: (batch: PurchaseBatch) => void;
}

const PurchaseBatchDetailModal: React.FC<PurchaseBatchDetailModalProps> = ({
  detail,
  canEdit = false,
  canApprove = false,
  canCancel = false,
  onClose,
  onEdit,
  onRestore,
  onRecepcion,
  onDistribucion,
  onTramitar,
}: PurchaseBatchDetailModalProps) {
  const _canEdit = canEdit ?? false;
  const _canRestore = canRestore ?? false;
  const _mode = mode ?? 'batch';
  const toast = useToast();
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [isPrintingPdf, setIsPrintingPdf] = React.useState(false);
  const batch = detail?.data ?? null;
  const isPedidoUsuarioDetail = detail?.entityType === 'pedido_usuario';

  const isPendingState =
    !!batch &&
    (isPedidoUsuarioDetail
      ? String(batch.estado) === EstadoPedidoUsuario.PENDIENTE
      : String(batch.estado) === EstadoLote.PENDIENTE);

  const batchPedidos =
    _mode === 'batch' && batch && 'pedidos' in batch
      ? (batch.pedidos ?? [])
      : [];
  const hasPedidosDistribuibles = batchPedidos.some(
    (pedido) => !!pedido.pedidoUsuarioId
  );
  const recepcionEstadosFinales = [
    EstadoPedido.RECIBIDO,
    EstadoPedido.INCIDENCIA,
    EstadoPedido.CANCELADO,
  ];
  const isRecepcionCompleted =
    _mode === 'batch' &&
    !!batch &&
    ((batch as PurchaseBatch).estado === EstadoLote.COMPLETADO ||
      (batchPedidos.length > 0 &&
        batchPedidos.every((pedido) =>
          recepcionEstadosFinales.includes(pedido.estado)
        )));

  const nextAction = getNextBatchAction(batch as PurchaseBatch, {
    hasPedidosDistribuibles,
    isRecepcionCompleted,
  });
  const NextActionIcon = nextAction.icon;

  const handleDownloadPdf = async () => {
    if (!batch) return;

    setIsDownloadingPdf(true);
    try {
      if (isPedidoUsuarioDetail) {
        await downloadPedidoUsuarioPdf(batch.id);
      } else {
        await downloadPurchaseBatchPdf(batch.id);
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo descargar el PDF del lote.'
      );
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintPdf = async () => {
    if (!batch) return;

    setIsPrintingPdf(true);
    try {
      if (isPedidoUsuarioDetail) {
        await printPedidoUsuarioPdf(batch.id);
      } else {
        await printPurchaseBatchPdf(batch.id);
      }
    } catch (error: unknown) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'No se pudo abrir la impresión del PDF del lote.'
      );
    } finally {
      setIsPrintingPdf(false);
    }
  };

  return (
    <DetailModal
      isOpen={!!detail}
      onClose={onClose}
      title={
        isPedidoUsuarioDetail ? 'Detalle del pedido' : 'Detalle de la compra'
      }
      subtitle={
        batch
          ? isPedidoUsuarioDetail &&
            'numeroGlobal' in batch &&
            batch.numeroGlobal
            ? `Pedido #${batch.numeroGlobal}`
            : `ID ${formatPedidoId(batch.id)}`
          : undefined
      }
      size="lg"
      actions={
        batch ? (
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
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              {isPedidoUsuarioDetail &&
                canApprove &&
                onApprove &&
                isPendingState && (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => detail && onApprove(detail)}
                  >
                    Aprobar pedido
                  </Button>
                )}
              {isPedidoUsuarioDetail &&
                canCancel &&
                onCancel &&
                isPendingState && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<CancelIcon />}
                    onClick={() => detail && onCancel(detail)}
                  >
                    Cancelar pedido
                  </Button>
                )}
              {canEdit && onEdit && isPendingState && (
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  onClick={() => detail && onEdit(detail)}
                >
                  {isPedidoUsuarioDetail ? 'Editar pedido' : 'Editar compra'}
                </Button>
              )}
              {!isPedidoUsuarioDetail && onRecepcion && batch && (
                <Button
                  variant="contained"
                  color="success"
                  disableElevation
                  startIcon={<LoginOutlinedIcon />}
                  onClick={() => onRecepcion(batch as PurchaseBatch)}
                >
                  Recepción
                </Button>
              )}
            </Stack>
          </Box>
        ) : undefined
      }
      sections={[
        {
          content: detail ? (
            detail.entityType === 'pedido_usuario' ? (
              <BatchPedidoLineasViewer
                batch={detail.data}
                entityType="pedido_usuario"
                showPdfActions={false}
              />
            ) : (
              <BatchPedidoLineasViewer
                batch={detail.data}
                entityType="purchase_batch"
                showPdfActions={false}
              />
            )
          ) : null,
        },
      ]}
    />
  );
}

export default PurchaseBatchDetailModal;
