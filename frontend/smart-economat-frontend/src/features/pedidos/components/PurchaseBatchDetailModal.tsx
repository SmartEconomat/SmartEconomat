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
  canRestore?: boolean;
  mode?: 'batch' | 'pedido';
  onClose: () => void;
  onEdit?: (batch: PurchaseBatch | PedidoUsuario) => void;
  onRestore?: (batch: PurchaseBatch | PedidoUsuario) => void;
  onRecepcion?: (batch: PurchaseBatch) => void;
  canDistribucion?: boolean;
  onDistribucion?: (batch: PurchaseBatch) => void;
  onTramitar?: (batch: PurchaseBatch) => void;
}

function PurchaseBatchDetailModal({
  batch,
  canEdit,
  canRestore,
  mode,
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
      if (_mode === 'pedido') {
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
      if (_mode === 'pedido') {
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
    <>
      <DetailModal
        isOpen={!!batch}
        onClose={onClose}
        title={
          _mode === 'pedido' ? 'Detalle del pedido ' : 'Detalle de la compra'
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
                    _canEdit &&
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

                  {_canRestore &&
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
                          disabled={
                            nextAction.disabled ||
                            (nextAction.action === 'tramitar' && !onTramitar)
                          }
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
                mode={_mode}
                showPdfActions={false}
              />
            ) : null,
          },
        ]}
      />
    </>
  );
}

export default PurchaseBatchDetailModal;
