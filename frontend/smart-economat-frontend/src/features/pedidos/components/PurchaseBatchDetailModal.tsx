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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
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
          : t('pedidos.batchDetail.downloadError')
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
          : t('pedidos.batchDetail.printError')
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
        isPedidoUsuarioDetail
          ? t('pedidos.batchDetail.orderTitle')
          : t('pedidos.batchDetail.purchaseTitle')
      }
      subtitle={
        batch
          ? isPedidoUsuarioDetail &&
            'numeroGlobal' in batch &&
            batch.numeroGlobal
            ? `${t('pedidos.batchDetail.orderPrefix')}${batch.numeroGlobal}`
            : `${t('pedidos.batchDetail.batchPrefix')}${formatBatchNumber(batch as PurchaseBatch)} · ${formatBatchReference(batch as PurchaseBatch) || `ID ${formatPedidoId(batch.id)}`}`
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
                {isDownloadingPdf
                  ? t('pedidos.batchDetail.downloading')
                  : t('pedidos.batchDetail.downloadPdf')}
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                startIcon={<PrintOutlinedIcon />}
                onClick={() => void handlePrintPdf()}
                disabled={isPrintingPdf || isDownloadingPdf}
              >
                {isPrintingPdf
                  ? t('pedidos.batchDetail.preparing')
                  : t('pedidos.batchDetail.printPdf')}
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
                    {t('pedidos.batchDetail.approvePedido')}
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
                    {t('pedidos.batchDetail.cancelPedido')}
                  </Button>
                )}
              {canEdit && onEdit && isPendingState && (
                <Button
                  variant="contained"
                  color="primary"
                  disableElevation
                  onClick={() => detail && onEdit(detail)}
                >
                  {isPedidoUsuarioDetail
                    ? t('pedidos.batchDetail.editPedido')
                    : t('pedidos.batchDetail.editCompra')}
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
                  {t('pedidos.batchDetail.recepcion')}
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
