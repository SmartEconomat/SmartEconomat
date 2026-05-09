import { DynamicField } from '../../../components/ui/DynamicFormModal';
import {
  EstadoPedido,
  EstadoPedidoUsuario,
} from '../../../services/pedido.types';

const isEditablePedidoStatus = (estado?: unknown): boolean =>
  estado === EstadoPedido.PENDIENTE_DE_APROBACION ||
  estado === EstadoPedidoUsuario.PENDIENTE;

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {Record<string, unknown> | null} row - Entrada efectiva esperada por el contrato.
 * @undefined {DynamicField[]} Datos efectivos después de ejecutar la operación.
 */
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
    disabled: Boolean(row.estado && !isEditablePedidoStatus(row.estado)),
  });

  fields.push({
    name: 'observaciones',
    label: 'Observaciones Generales',
    type: 'textarea',
    position: 'bottom',
    disabled: Boolean(row.estado && !isEditablePedidoStatus(row.estado)),
  });

  return fields;
};
