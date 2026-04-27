import { DynamicField } from '../../../components/ui/DynamicFormModal';
import {
  EstadoPedido,
  EstadoPedidoUsuario,
} from '../../../services/pedido.types';

const isEditablePedidoStatus = (estado?: unknown): boolean =>
  estado === EstadoPedido.PENDIENTE_DE_APROBACION ||
  estado === EstadoPedidoUsuario.PENDIENTE;

export const getPedidoSchema = (
  row: Record<string, unknown> | null,
  t: (key: string) => string
): DynamicField[] => {
  if (!row) {
    return [
      {
        name: 'pedidoProductos',
        label: t('pedidos.fields.products'),
        type: 'orderLines',
        position: 'bottom',
      },
      {
        name: 'observaciones',
        label: t('pedidos.fields.observations'),
        type: 'textarea',
        position: 'bottom',
      },
    ];
  }

  const fields: DynamicField[] = [];

  if (row.estado === EstadoPedido.CANCELADO) {
    fields.push({
      name: 'motivoCancelacion',
      label: t('pedidos.fields.cancelReason'),
      type: 'textarea',
      disabled: true,
      position: 'bottom',
    });
  }

  if (row.estado === EstadoPedido.INCIDENCIA) {
    fields.push({
      name: 'motivoIncidencia',
      label: t('pedidos.fields.incidenceReason'),
      type: 'textarea',
      disabled: true,
      position: 'bottom',
    });
  }

  fields.push({
    name: 'pedidoProductos',
    label: t('pedidos.fields.products'),
    type: 'orderLines',
    position: 'bottom',
    disabled: Boolean(row.estado && !isEditablePedidoStatus(row.estado)),
  });

  fields.push({
    name: 'observaciones',
    label: t('pedidos.fields.observations'),
    type: 'textarea',
    position: 'bottom',
    disabled: Boolean(row.estado && !isEditablePedidoStatus(row.estado)),
  });

  return fields;
};
