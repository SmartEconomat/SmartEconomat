import { PedidoPermissions } from '../types/pedidos-ui.types';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "buildPedidoPermissions" en smart-economat-frontend (SPA).
 * @undefined {boolean} canCreate - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} canEdit - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} canDelete - Entrada efectiva esperada por el contrato.
 * @undefined {PedidoPermissions} Datos efectivos después de ejecutar la operación.
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
