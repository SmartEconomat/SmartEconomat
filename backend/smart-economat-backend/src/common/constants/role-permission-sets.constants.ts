import { ALL_PERMISSION_CODES, PERMISSIONS } from './permissions.constants';

export const ADMIN_RESTRICTED_PERMISSION_CODES = [
  PERMISSIONS.roles.crear,
  PERMISSIONS.roles.eliminar,
  PERMISSIONS.permisos.crear,
  PERMISSIONS.permisos.eliminar,
] as const;

export const ADMIN_PERMISSION_CODES = ALL_PERMISSION_CODES.filter(
  (code) => !ADMIN_RESTRICTED_PERMISSION_CODES.includes(code)
);
