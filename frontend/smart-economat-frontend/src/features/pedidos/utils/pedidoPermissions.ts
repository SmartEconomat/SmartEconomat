import { PedidoPermissions } from '../types/pedidos-ui.types';

/**
 * Documentación en español.
 */
export const buildPedidoPermissions = (
  canCreate: boolean,
  canEdit: boolean,
  canDelete: boolean
): PedidoPermissions => ({
  canCreate,
  canEdit,
  canDelete,
  canCancel: canEdit,
  canApprove: canEdit,
});
