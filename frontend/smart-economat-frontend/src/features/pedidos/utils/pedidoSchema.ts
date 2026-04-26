import { DynamicField } from '../../../components/ui/DynamicFormModal';
import {
  EstadoPedido,
  EstadoPedidoUsuario,
} from '../../../services/pedido.types';

const isEditablePedidoStatus = (estado?: unknown): boolean =>
  estado === EstadoPedido.PENDIENTE_DE_APROBACION ||
  estado === EstadoPedidoUsuario.PENDIENTE;

/**
 * @description Returns the DynamicFormModal field schema for a pedido based on its current state.
 * When row is null (creation mode) a minimal schema is returned.
 * For existing pedidos the schema includes conditional fields for cancellation / incidence reasons
 * and disables the editable fields when the pedido is in a non-editable state.
 * @param row - Existing pedido data used to drive field visibility/disabled state, or null for creation
 * @returns Array of DynamicField definitions to pass to DynamicFormModal
 */
export const getPedidoSchema = (
  row: Record<string, unknown> | null,
  t: (key: string) => string
): DynamicField[] => {
  if (!row) {
    return [
      {
        name: 'pedidoProductos',
        label: t('pedidos.schema.detalleProductos'),
        type: 'orderLines',
        position: 'bottom',
      },
      {
        name: 'observaciones',
        label: t('pedidos.schema.observaciones'),
        type: 'textarea',
        position: 'bottom',
      },
    ];
  }

  const fields: DynamicField[] = [];

  if (row.estado === EstadoPedido.CANCELADO) {
    fields.push({
      name: 'motivoCancelacion',
      label: t('pedidos.schema.motivoCancelacion'),
      type: 'textarea',
      disabled: true,
      position: 'bottom',
    });
  }

  if (row.estado === EstadoPedido.INCIDENCIA) {
    fields.push({
      name: 'motivoIncidencia',
      label: t('pedidos.schema.motivoIncidencia'),
      type: 'textarea',
      disabled: true,
      position: 'bottom',
    });
  }

  fields.push({
    name: 'pedidoProductos',
    label: t('pedidos.schema.detalleProductos'),
    type: 'orderLines',
    position: 'bottom',
    disabled: Boolean(row.estado && !isEditablePedidoStatus(row.estado)),
  });

  fields.push({
    name: 'observaciones',
    label: t('pedidos.schema.observaciones'),
    type: 'textarea',
    position: 'bottom',
    disabled: Boolean(row.estado && !isEditablePedidoStatus(row.estado)),
  });

  return fields;
};
