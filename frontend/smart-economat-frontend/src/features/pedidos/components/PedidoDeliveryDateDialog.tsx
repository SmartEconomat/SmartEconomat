import React from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmDialog from '../../../components/ui/ConfirmDialog';
import { Pedido } from '../../../services/pedido.types';
import { formatPedidoDate } from '../utils/pedidoFormatters';

interface PedidoDeliveryDateDialogProps {
  pedido: Pedido | null;
  onClose: () => void;
}

/**
 * Documentación en español.
 */
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
      title={t('pedidos.fechaEstimadaEntrega')}
      message={t('pedidos.fechaEntregaDialogMensaje', {
        fecha: formatPedidoDate(pedido?.fechaEntrega),
      })}
      confirmText={t('comun.entendido')}
      cancelText=""
      confirmColor="primary"
    />
  );
};

export default PedidoDeliveryDateDialog;
