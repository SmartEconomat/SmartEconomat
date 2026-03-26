import React from 'react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { Pedido } from '../../../services/pedido.types';
import { formatPedidoDate } from '../utils/pedidoFormatters';

interface PedidoDeliveryDateDialogProps {
  pedido: Pedido | null;
  onClose: () => void;
}

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
