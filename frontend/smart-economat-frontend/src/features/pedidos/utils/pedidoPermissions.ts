import { PedidoPermissions } from '../types/pedidos-ui.types';

/**
 * Construye el objeto de permisos para el módulo de pedidos.
 * Cada permiso es independiente para evitar escalación de privilegios:
 * un usuario con canEdit no obtiene automáticamente canCancel ni canApprove.
 */
export const buildPedidoPermissions = (
  canCreate: boolean,
  canEdit: boolean,
  canDelete: boolean,
  canCancel: boolean,
  canApprove: boolean
): PedidoPermissions => ({
  canCreate,
  canEdit,
  canDelete,
  canCancel,
  canApprove,
});
