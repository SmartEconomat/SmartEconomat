import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
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
import {
  formatBatchNumber,
  formatBatchReference,
  formatPedidoId,
} from '../utils/pedidoFormatters';

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
}

/**
 * @description Detail modal for a PedidoBatchDetail (either a PedidoUsuario or a PurchaseBatch).
 * Shows product lines, batch metadata, and conditional action buttons (approve, cancel, edit, reception, PDF).
 * @param props.detail - The batch/pedido detail to display, or null when the modal is closed
 * @param props.canEdit - Whether the edit action should be available
 * @param props.canApprove - Whether the approve action should be available
 * @param props.canCancel - Whether the cancel action should be available
 * @param props.onClose - Callback invoked when the modal is dismissed
 * @param props.onEdit - Optional callback invoked when the user clicks edit
 * @param props.onApprove - Optional callback invoked when the user approves
 * @param props.onCancel - Optional callback invoked when the user cancels
 * @param props.onRecepcion - Optional callback invoked when the user initiates reception
 * @returns DetailModal with batch information and context-sensitive action buttons
 */
const PurchaseBatchDetailModal: React.FC<PurchaseBatchDetailModalProps> = ({
  detail,
  canEdit = false,
  canApprove = false,
  canCancel = false,
  onClose,
  onEdit,
  onApprove,
  onCancel,
  onRecepcion,
}) => {
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
            : `Lote #${formatBatchNumber(batch as PurchaseBatch)} · ${formatBatchReference(batch as PurchaseBatch) || `ID ${formatPedidoId(batch.id)}`}`
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
                mode="pedido"
                showPdfActions={false}
              />
            ) : (
              <BatchPedidoLineasViewer
                batch={detail.data}
                mode="batch"
                showPdfActions={false}
              />
            )
          ) : null,
        },
      ]}
    />
  );
};

export default PurchaseBatchDetailModal;
