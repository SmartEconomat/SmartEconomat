import { PedidoPermissions } from '../types/pedidos-ui.types';

export const buildPedidoPermissions = (
  canCreate: boolean,
  canEdit: boolean,
  canDelete: boolean,
  canRestore: boolean,
  role?: string
): PedidoPermissions => {
  const isAdminOrTeacher =
    role === 'ADMINISTRADOR' || role === 'SUPER_ADMIN' || role === 'PROFESOR';
  const isManagement = role === 'ADMINISTRADOR' || role === 'SUPER_ADMIN';

  return {
    canCreate,
    canEdit,
    canDelete,
    canCancel: canEdit,
    canApprove: canEdit || isManagement,
    canRestore: canRestore || isAdminOrTeacher,
    canConsolidate: isManagement || role === 'PROFESOR',
  };
};
