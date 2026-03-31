import type { User } from './types';

const SHERLOCK_AUTH_ROLE_ALIASES = ['ADMIN', 'SUPER_ADMIN'] as const;

export const normalizeRole = (role?: string | null): string =>
  String(role ?? '')
    .trim()
    .toUpperCase();

export const isElevatedRole = (role?: string | null): boolean => {
  const normalized = normalizeRole(role);
  return SHERLOCK_AUTH_ROLE_ALIASES.includes(
    normalized as (typeof SHERLOCK_AUTH_ROLE_ALIASES)[number]
  );
};

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

export const hasPermission = (
  user: User | null,
  permission: string
): boolean => {
  if (!user) return false;
  if (isElevatedRole(user.rol)) return true;
  return user.permisos?.includes(permission) ?? false;
};

export const hasAllPermissions = (
  user: User | null,
  permissions: string[]
): boolean =>
  permissions.every((permission) => hasPermission(user, permission));

export const hasAnyPermission = (
  user: User | null,
  permissions: string[]
): boolean => permissions.some((permission) => hasPermission(user, permission));
