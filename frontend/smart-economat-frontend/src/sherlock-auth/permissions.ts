import type { User } from './types';
import { ELEVATED_ROLES } from './system-roles.constants';

/**
 * Expone "normalizeRole" en smart-economat-frontend (SPA).
 * @undefined {string | null | undefined} role - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
 */
export const normalizeRole = (role?: string | null): string =>
  String(role ?? '')
    .trim()
    .toUpperCase();

/**
 * Expone "isElevatedRole" en smart-economat-frontend (SPA).
 * @undefined {string | null | undefined} role - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const isElevatedRole = (role?: string | null): boolean => {
  const normalized = normalizeRole(role);
  return ELEVATED_ROLES.includes(normalized);
};

/**
 * Expone "buildPermissionsMap" en smart-economat-frontend (SPA).
 * @undefined {string[] | undefined} permissions - Entrada efectiva esperada por el contrato.
 * @undefined {Record<string, boolean>} Datos efectivos después de ejecutar la operación.
 */
export const buildPermissionsMap = (
  permissions?: string[]
): Record<string, boolean> =>
  (permissions ?? []).reduce(
    (acc, permission) => {
      if (permission) {
        acc[permission] = true;
      }
      return acc;
    },
    {} as Record<string, boolean>
  );

/**
 * Expone "hasPermission" en smart-economat-frontend (SPA).
 * @undefined {User | null} user - Entrada efectiva esperada por el contrato.
 * @undefined {string} permission - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const hasPermission = (
  user: User | null,
  permission: string
): boolean => {
  if (!user) return false;
  if (isElevatedRole(user.rol)) return true;
  return user.permisos?.includes(permission) ?? false;
};

/**
 * Expone "hasAllPermissions" en smart-economat-frontend (SPA).
 * @undefined {User | null} user - Entrada efectiva esperada por el contrato.
 * @undefined {string[]} permissions - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const hasAllPermissions = (
  user: User | null,
  permissions: string[]
): boolean =>
  permissions.every((permission) => hasPermission(user, permission));

/**
 * Expone "hasAnyPermission" en smart-economat-frontend (SPA).
 * @undefined {User | null} user - Entrada efectiva esperada por el contrato.
 * @undefined {string[]} permissions - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export const hasAnyPermission = (
  user: User | null,
  permissions: string[]
): boolean => permissions.some((permission) => hasPermission(user, permission));
