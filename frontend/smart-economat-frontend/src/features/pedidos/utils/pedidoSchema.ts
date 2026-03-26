import { DynamicField } from '../../../components/ui/DynamicFormModal';
import { EstadoPedido } from '../../../services/pedido.types';

export const getPedidoSchema = (
  row: Record<string, unknown> | null
): DynamicField[] => {
  if (!row) {
    return [
      {
        name: 'pedidoProductos',
        label: 'Detalle de Productos',
        type: 'orderLines',
        position: 'bottom',
      },
      {
        name: 'observaciones',
        label: 'Observaciones Generales',
        type: 'textarea',
        position: 'bottom',
      },
    ];
  }

  const fields: DynamicField[] = [];

  if (row.estado === EstadoPedido.CANCELADO) {
    fields.push({
      name: 'motivoCancelacion',
      label: 'Motivo de la Cancelación',
      type: 'textarea',
      disabled: true,
      position: 'bottom',
    });
  }

  if (row.estado === EstadoPedido.INCIDENCIA) {
    fields.push({
      name: 'motivoIncidencia',
      label: 'Motivo de la Incidencia',
      type: 'textarea',
      disabled: true,
      position: 'bottom',
    });
  }

  fields.push({
    name: 'pedidoProductos',
    label: 'Detalle de Productos',
    type: 'orderLines',
    position: 'bottom',
    disabled: Boolean(row.estado && row.estado !== EstadoPedido.PENDIENTE),
  });

  fields.push({
    name: 'observaciones',
    label: 'Observaciones Generales',
    type: 'textarea',
    position: 'bottom',
    disabled: Boolean(row.estado && row.estado !== EstadoPedido.PENDIENTE),
  });

  return fields;
};
