import React from 'react';
import { Box, Button, Stack, Tooltip } from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import PrintOutlinedIcon from '@mui/icons-material/PrintOutlined';
import RestoreIcon from '@mui/icons-material/Restore';
import DetailModal from '../../../components/ui/DetailModal';
import BatchPedidoLineasViewer from '../../../components/ui/BatchPedidoLineasViewer';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import {
  downloadPedidoUsuarioPdf,
  downloadPurchaseBatchPdf,
  printPedidoUsuarioPdf,
  printPurchaseBatchPdf,
} from '../../../services/pedido.service';
import {
  EstadoLote,
  EstadoPedido,
  PedidoUsuario,
  PurchaseBatch,
} from '../../../services/pedido.types';
import { useToast } from '../../../store/toast.hooks';
import { formatPedidoId } from '../utils/pedidoFormatters';
import { getNextBatchAction } from '../utils/purchaseBatchUtils';
import EditIcon from '@mui/icons-material/Edit';

interface PurchaseBatchDetailModalProps {
  batch: PurchaseBatch | PedidoUsuario | null;
  canEdit?: boolean;
  canApprove?: boolean;
  canCancel?: boolean;
  canRestore?: boolean;
  mode?: 'batch' | 'pedido';
  onClose: () => void;
  onEdit?: (batch: PurchaseBatch | PedidoUsuario) => void;
  onApprove?: (batch: PurchaseBatch | PedidoUsuario) => void;
  onCancel?: (batch: PurchaseBatch | PedidoUsuario) => void;
  onRestore?: (batch: PurchaseBatch | PedidoUsuario) => void;
  onRecepcion?: (batch: PurchaseBatch) => void;
  onTramitar?: (batch: PurchaseBatch) => void;
  canDistribucion?: boolean;
  onDistribucion?: (batch: PurchaseBatch) => void;
}

const PurchaseBatchDetailModal: React.FC<PurchaseBatchDetailModalProps> = ({
  batch,
  canEdit = false,
  canApprove = false,
  canCancel = false,
  canRestore = false,
  mode = 'batch',
  onClose,
  onEdit,
  onApprove,
  onCancel,
  onRestore,
  onRecepcion,
  onTramitar,
  onDistribucion,
}) => {
  const toast = useToast();
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [isPrintingPdf, setIsPrintingPdf] = React.useState(false);
  const [showTramitarConfirm, setShowTramitarConfirm] = React.useState(false);

  const batchPedidos =
    mode === 'batch' && batch && 'pedidos' in batch
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
    mode === 'batch' &&
    !!batch &&
    ((batch as PurchaseBatch).estado === EstadoLote.COMPLETADO ||
      (batchPedidos.length > 0 &&
        batchPedidos.every((pedido) =>
          recepcionEstadosFinales.includes(pedido.estado)
        )));

  const isPending =
    mode === 'batch' &&
    !!batch &&
    (batch as PurchaseBatch).estado === EstadoLote.PENDIENTE;

  const nextAction = getNextBatchAction(batch as PurchaseBatch, {
    hasPedidosDistribuibles,
    isRecepcionCompleted,
  });
  const NextActionIcon = nextAction.icon;

  const [pendingActionAfterConfirm, setPendingActionAfterConfirm] =
    React.useState<'download' | 'print' | null>(null);

  const handleDownloadPdf = async (skipConfirm = false) => {
    if (!batch) return;

    // Si el lote está pendiente y descargamos el PDF, preguntamos si queremos tramitarlo
    if (!skipConfirm && isPending && onTramitar) {
      setPendingActionAfterConfirm('download');
      setShowTramitarConfirm(true);
      return;
    }

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
      setPendingActionAfterConfirm(null);
    }
  };

  const handlePrintPdf = async (skipConfirm = false) => {
    if (!batch) return;

    // Si el lote está pendiente e imprimimos, también preguntamos
    if (!skipConfirm && isPending && onTramitar) {
      setPendingActionAfterConfirm('print');
      setShowTramitarConfirm(true);
      return;
    }

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
      setPendingActionAfterConfirm(null);
    }
  };

  const handleConfirmTramitar = async () => {
    if (batch && mode === 'batch' && onTramitar) {
      await onTramitar(batch as PurchaseBatch);
      setShowTramitarConfirm(false);

      // Tras tramitar, procedemos con la acción que estaba pendiente
      if (pendingActionAfterConfirm === 'print') {
        await handlePrintPdf(true);
      } else {
        await handleDownloadPdf(true);
      }
    }
  };

  const handleCancelConfirm = async () => {
    setShowTramitarConfirm(false);
    // Si cancela la tramitación, igual ejecutamos la acción original (descarga o impresión)
    if (pendingActionAfterConfirm === 'print') {
      await handlePrintPdf(true);
    } else {
      await handleDownloadPdf(true);
    }
  };

  return (
    <>
      <DetailModal
        isOpen={!!batch}
        onClose={onClose}
        title={
          mode === 'pedido' ? 'Detalle del pedido ' : 'Detalle de la compra'
        }
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
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 2,
                }}
              >
                {/* Lado izquierdo: Administración y Documentos */}
                <Stack
                  direction="row"
                  spacing={1.5}
                  flexWrap="wrap"
                  alignItems="center"
                >
                  {nextAction.action === 'tramitar' &&
                    canEdit &&
                    onEdit &&
                    String(batch.estado) === EstadoPedido.PENDIENTE && (
                      <Button
                        variant="contained"
                        color="success"
                        disableElevation
                        startIcon={<EditIcon />}
                        onClick={() => onEdit(batch)}
                        sx={{ fontWeight: 'bold', height: '40px' }}
                      >
                        Editar
                      </Button>
                    )}

                  {/* Otros Administrativos (Aprobar, Cancelar, Revertir) si aplican */}
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
                        Aprobar
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
                        Cancelar
                      </Button>
                    )}

                  {canRestore &&
                    onRestore &&
                    String(batch.estado) === EstadoPedido.CANCELADO && (
                      <Button
                        variant="outlined"
                        color="info"
                        startIcon={<RestoreIcon />}
                        onClick={() => onRestore(batch)}
                      >
                        Revertir
                      </Button>
                    )}

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Button
                      variant="outlined"
                      color="secondary"
                      startIcon={<PictureAsPdfIcon />}
                      onClick={() => void handleDownloadPdf()}
                      disabled={isDownloadingPdf || isPrintingPdf}
                      sx={{
                        height: '40px',
                        borderColor: 'secondary.main',
                        color: 'secondary.main',
                      }}
                    >
                      {isDownloadingPdf ? '...' : 'PDF'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="inherit"
                      startIcon={<PrintOutlinedIcon />}
                      onClick={() => void handlePrintPdf()}
                      disabled={isPrintingPdf || isDownloadingPdf}
                      sx={{ height: '40px', borderColor: 'grey.400' }}
                    >
                      {isPrintingPdf ? '...' : 'Imprimir'}
                    </Button>
                  </Stack>
                </Stack>

                {/* Lado derecho: Acción Logística (Siguiente Paso) */}
                <Box>
                  {nextAction.action !== 'none' && (
                    <Tooltip title={nextAction.tooltip || ''}>
                      <span>
                        <Button
                          variant="contained"
                          color={nextAction.color}
                          disableElevation
                          startIcon={<NextActionIcon />}
                          onClick={() => {
                            if (nextAction.action === 'tramitar')
                              onTramitar?.(batch as PurchaseBatch);
                            if (nextAction.action === 'recepcion')
                              onRecepcion?.(batch as PurchaseBatch);
                            if (nextAction.action === 'distribucion')
                              onDistribucion?.(batch as PurchaseBatch);
                          }}
                          disabled={nextAction.disabled}
                          sx={{
                            fontWeight: 'bold',
                            height: '40px',
                            px: 4,
                            ml: 2,
                          }}
                        >
                          {nextAction.label}
                        </Button>
                      </span>
                    </Tooltip>
                  )}
                </Box>
              </Box>
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

      <ConfirmDialog
        isOpen={showTramitarConfirm}
        onClose={() => setShowTramitarConfirm(false)}
        onConfirm={handleConfirmTramitar}
        onCancel={handleCancelConfirm}
        title="Tramitar lote de compra"
        message="¿Deseas marcar este lote como 'Tramitado' ahora mismo? Esto indicará que el pedido ya ha sido realizado a los proveedores."
        confirmText="Sí, tramitar"
        cancelText="No, solo continuar"
        confirmColor="info"
      />
    </>
  );
};

export default PurchaseBatchDetailModal;
