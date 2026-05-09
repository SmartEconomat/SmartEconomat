import { ALL_PERMISSION_CODES, PERMISSIONS } from './permissions.constants';

/** Constantes públicas (ADMIN_RESTRICTED_PERMISSION_CODES) expuestas en smart-economat-backend (Nest). */
export const ADMIN_RESTRICTED_PERMISSION_CODES = [
  PERMISSIONS.roles.crear,
  PERMISSIONS.roles.eliminar,
  PERMISSIONS.permisos.crear,
  PERMISSIONS.permisos.eliminar,
] as const;

/** Constantes públicas (ADMIN_PERMISSION_CODES) expuestas en smart-economat-backend (Nest). */
export const ADMIN_PERMISSION_CODES = ALL_PERMISSION_CODES.filter(
  (code) => !ADMIN_RESTRICTED_PERMISSION_CODES.includes(code)
);
