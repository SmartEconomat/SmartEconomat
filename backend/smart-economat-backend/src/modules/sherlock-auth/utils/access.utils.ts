import {
  ELEVATED_ROLES,
  ROLE_PRIORITY,
  SYSTEM_ROLES,
  type SystemRoleName,
} from '../../../common/constants/system-roles.constants';

/**
 * Resuelve el rol principal de un usuario a partir de sus roles M:M.
 * Devuelve el nombre del rol con mayor prioridad según ROLE_PRIORITY.
 * Si no hay roles M:M asignados, usa el rol recibido como respaldo.
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

export type SherlockAuthRoleAlias = SystemRoleName;

export const normalizeSherlockAuthRole = (role?: string | null): string =>
  String(role ?? '')
    .trim()
    .toUpperCase();

export const isSherlockElevatedRole = (role?: string | null): boolean => {
  const normalized = normalizeSherlockAuthRole(role);
  return (ELEVATED_ROLES as readonly string[]).includes(normalized);
};

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

export interface SherlockEffectivePermissionsInput {
  role?: string | null;
  rolePermissions?: string[];
  directPermissions?: string[];
  excludedPermissions?: string[];
}

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
