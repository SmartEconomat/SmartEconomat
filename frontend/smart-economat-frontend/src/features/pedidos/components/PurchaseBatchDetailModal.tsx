import React from 'react';
import { Box, Button, Stack } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
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
  EstadoPedido,
  PedidoUsuario,
  PurchaseBatch,
} from '../../../services/pedido.types';
import { useToast } from '../../../store/toast.hooks';
import { formatPedidoId } from '../utils/pedidoFormatters';

interface PurchaseBatchDetailModalProps {
  batch: PurchaseBatch | PedidoUsuario | null;
  canEdit?: boolean;
  canApprove?: boolean;
  canCancel?: boolean;
  mode?: 'batch' | 'pedido';
  onClose: () => void;
  onEdit?: (batch: PurchaseBatch | PedidoUsuario) => void;
  onApprove?: (batch: PurchaseBatch | PedidoUsuario) => void;
  onCancel?: (batch: PurchaseBatch | PedidoUsuario) => void;
}

const PurchaseBatchDetailModal: React.FC<PurchaseBatchDetailModalProps> = ({
  batch,
  canEdit = false,
  canApprove = false,
  canCancel = false,
  mode = 'batch',
  onClose,
  onEdit,
  onApprove,
  onCancel,
}) => {
  const toast = useToast();
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [isPrintingPdf, setIsPrintingPdf] = React.useState(false);

  const handleDownloadPdf = async () => {
    if (!batch) return;

    setIsDownloadingPdf(true);
    try {
      if (mode === 'pedido') {
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
      if (mode === 'pedido') {
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
      isOpen={!!batch}
      onClose={onClose}
      title={mode === 'pedido' ? 'Detalle del pedido ' : 'Detalle de la compra'}
      subtitle={
        batch
          ? 'numeroGlobal' in batch && batch.numeroGlobal
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
              {mode === 'pedido' &&
                canApprove &&
                onApprove &&
                String(batch.estado) === EstadoPedido.PENDIENTE && (
                  <Button
                    variant="outlined"
                    color="success"
                    startIcon={<CheckIcon />}
                    onClick={() => onApprove(batch)}
                  >
                    Aprobar pedido
                  </Button>
                )}
              {mode === 'pedido' &&
                canCancel &&
                onCancel &&
                String(batch.estado) === EstadoPedido.PENDIENTE && (
                  <Button
                    variant="outlined"
                    color="warning"
                    startIcon={<CancelIcon />}
                    onClick={() => onCancel(batch)}
                  >
                    Cancelar pedido
                  </Button>
                )}
              {canEdit &&
                onEdit &&
                String(batch.estado) === EstadoPedido.PENDIENTE && (
                  <Button
                    variant="contained"
                    color="primary"
                    disableElevation
                    onClick={() => onEdit(batch)}
                  >
                    Editar pedido
                  </Button>
                )}
            </Stack>
          </Box>
        ) : undefined
      }
      sections={[
        {
          content: batch ? (
            <BatchPedidoLineasViewer
              batch={batch}
              mode={mode}
              showPdfActions={false}
            />
          ) : null,
        },
      ]}
    />
  );
};

export default PurchaseBatchDetailModal;
