import React from 'react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { Pedido } from '../../../services/pedido.types';
import { formatPedidoDate } from '../utils/pedidoFormatters';

interface PedidoDeliveryDateDialogProps {
  pedido: Pedido | null;
  onClose: () => void;
}

/**
 * @description Informational dialog showing the estimated delivery date for a pedido.
 * The date is read-only and computed automatically by the system.
 * @param props.pedido - The pedido whose delivery date should be displayed, or null when closed
 * @param props.onClose - Callback invoked when the user dismisses the dialog
 * @returns ConfirmDialog with a single "Entendido" button displaying the delivery date
 */
const PedidoDeliveryDateDialog: React.FC<PedidoDeliveryDateDialogProps> = ({
  pedido,
  onClose,
}) => (
  <ConfirmDialog
    isOpen={!!pedido}
    onClose={onClose}
    onConfirm={onClose}
    title="Fecha estimada de entrega"
    message={`La fecha prevista para este pedido es ${formatPedidoDate(
      pedido?.fechaEntrega
    )}. Este valor se calcula automáticamente por el sistema y no admite edición manual.`}
    confirmText="Entendido"
    cancelText=""
    confirmColor="primary"
  />
);

export default PedidoDeliveryDateDialog;
