import { PedidoPermissions } from '../types/pedidos-ui.types';

/**
 * @description Constructs a PedidoPermissions object from the three base CRUD flags.
 * The canCancel and canApprove flags are derived from canEdit.
 * @param canCreate - Whether the user may create new pedidos
 * @param canEdit - Whether the user may edit, cancel, and approve pedidos
 * @param canDelete - Whether the user may delete pedidos
 * @returns A fully populated PedidoPermissions object
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
