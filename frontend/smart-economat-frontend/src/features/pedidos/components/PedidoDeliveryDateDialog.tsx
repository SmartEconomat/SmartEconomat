import React from 'react';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { Pedido } from '../../../services/pedido.types';
import { formatPedidoDate } from '../utils/pedidoFormatters';
import { useTranslation } from 'react-i18next';

interface PedidoDeliveryDateDialogProps {
  pedido: Pedido | null;
  onClose: () => void;
}

const PedidoDeliveryDateDialog: React.FC<PedidoDeliveryDateDialogProps> = ({
  pedido,
  onClose,
}) => {
  const { t } = useTranslation();

  return (
    <ConfirmDialog
      isOpen={!!pedido}
      onClose={onClose}
      onConfirm={onClose}
      title={t('pedidos.deliveryDialog.title')}
      message={t('pedidos.deliveryDialog.message', {
        date: formatPedidoDate(pedido?.fechaEntrega),
      })}
      confirmText={t('pedidos.deliveryDialog.understood')}
      cancelText=""
      confirmColor="primary"
    />
  );
};

export default PedidoDeliveryDateDialog;
