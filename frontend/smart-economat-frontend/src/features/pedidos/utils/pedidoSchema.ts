import { DynamicField } from '../../../components/ui/DynamicFormModal';
import { EstadoPedido } from '../../../services/pedido.types';

export const getPedidoSchema = (
  row: Record<string, unknown> | null
): DynamicField[] => {
  const fields: DynamicField[] = [];

  // Solo mostrar la cabecera si estamos editando (hay row con ID)
  if (row?.id) {
    fields.push(
      {
        name: 'numeroGlobal',
        label: 'Número de Pedido',
        type: 'text',
        disabled: true,
        width: 3,
      },
      {
        name: 'id',
        label: 'ID de Pedido',
        type: 'text',
        disabled: true,
        width: 3,
      },
      {
        name: 'usuarioSolicitante',
        label: 'Solicitante',
        type: 'text',
        disabled: true,
        width: 3,
      },
      {
        name: 'fechaPedido',
        label: 'Fecha del Pedido',
        type: 'date',
        width: 3,
        disabled: Boolean(row?.estado && row.estado !== EstadoPedido.PENDIENTE),
      }
    );
  }

  // Si no hay row o no tiene ID, es un nuevo pedido
  if (!row?.id) {
    fields.push(
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
      }
    );
    return fields;
  }

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
