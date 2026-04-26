import {
  ELEVATED_ROLES,
  ROLE_PRIORITY,
  SYSTEM_ROLES,
  type SystemRoleName,
} from '../../../common/constants/system-roles.constants';

/**
 * Documentación en español.
 */
export const getRolPrincipal = (
  roles?: Array<{ nombre: string }> | null,
  fallbackRole?: string | null
): string => {
  if (roles && roles.length > 0) {
    const sorted = [...roles].sort(
      (a, b) =>
        (ROLE_PRIORITY[b.nombre.toUpperCase()] ?? -1) -
        (ROLE_PRIORITY[a.nombre.toUpperCase()] ?? -1)
    );
    return sorted[0].nombre;
  }
  return fallbackRole ?? SYSTEM_ROLES.ALUMNO;
};

/**
 * Documentación en español.
 */
export type SherlockAuthRoleAlias = SystemRoleName;

/**
 * Documentación en español.
 */
export const normalizeSherlockAuthRole = (role?: string | null): string =>
  String(role ?? '')
    .trim()
    .toUpperCase();

/**
 * Documentación en español.
 */
export const isSherlockElevatedRole = (role?: string | null): boolean => {
  const normalized = normalizeSherlockAuthRole(role);
  return (ELEVATED_ROLES as readonly string[]).includes(normalized);
};

/**
 * Documentación en español.
 */
export const uniqueStrings = (
  values: Array<string | null | undefined>
): string[] => {
  return [
    ...new Set(
      values.filter(
        (value): value is string => !!value && value.trim().length > 0
      )
    ),
  ].map((value) => value.trim());
};

/**
 * Documentación en español.
 */
export interface SherlockEffectivePermissionsInput {
        /**
     * Documentación en español.
     */
  role?: string | null;
        /**
     * Documentación en español.
     */
  rolePermissions?: string[];
        /**
     * Documentación en español.
     */
  directPermissions?: string[];
        /**
     * Documentación en español.
     */
  excludedPermissions?: string[];
}

/**
 * Documentación en español.
 */
export const resolveSherlockEffectivePermissions = (
  input: SherlockEffectivePermissionsInput
): string[] => {
  const rolePermissions = input.rolePermissions ?? [];
  const directPermissions = input.directPermissions ?? [];
  const excludedPermissions = input.excludedPermissions ?? [];

  const merged = uniqueStrings([...rolePermissions, ...directPermissions]);
  const filtered = merged.filter(
    (permission) => !excludedPermissions.includes(permission)
  );

  if (isSherlockElevatedRole(input.role)) {
    return filtered;
  }

  return filtered;
};
