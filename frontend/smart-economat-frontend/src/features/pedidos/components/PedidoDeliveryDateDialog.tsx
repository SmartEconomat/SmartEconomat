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
 * @description Informational dialog showing the estimated delivery date for a pedido.
 * The date is read-only and computed automatically by the system.
 * @param props.pedido - The pedido whose delivery date should be displayed, or null when closed
 * @param props.onClose - Callback invoked when the user dismisses the dialog
 * @returns ConfirmDialog with a single confirm button displaying the delivery date
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
