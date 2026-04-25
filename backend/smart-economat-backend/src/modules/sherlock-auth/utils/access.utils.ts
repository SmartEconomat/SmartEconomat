import {
  ELEVATED_ROLES,
  ROLE_PRIORITY,
  SYSTEM_ROLES,
  type SystemRoleName,
} from '../../../common/constants/system-roles.constants';

/**
 * Resolves the principal (highest-priority) role for a user from their M:M role list.
 *
 * Sorts the provided roles by descending priority according to {@link ROLE_PRIORITY}
 * and returns the name of the top-ranked role. If no roles are provided, falls back
 * to `fallbackRole` and, if that is also absent, to `SYSTEM_ROLES.ALUMNO`.
 *
 * @param {Array<{ nombre: string }> | null | undefined} roles - The user's assigned roles.
 * @param {string | null | undefined} fallbackRole - Legacy single-role field used as a backup.
 * @returns {string} The name of the principal role.
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

/** Type alias for system role names used throughout the Sherlock-Auth module. */
export type SherlockAuthRoleAlias = SystemRoleName;

/**
 * Normalizes a raw role string to its canonical upper-case trimmed form.
 *
 * @param {string | null | undefined} role - The raw role value to normalize.
 * @returns {string} Upper-case trimmed role string, or an empty string if falsy.
 */
export const normalizeSherlockAuthRole = (role?: string | null): string =>
  String(role ?? '')
    .trim()
    .toUpperCase();

/**
 * Returns `true` when the given role is considered an elevated (super-user) role.
 *
 * Elevated roles bypass all role and permission checks in the Sherlock guards.
 *
 * @param {string | null | undefined} role - The role to evaluate.
 * @returns {boolean} `true` if the role appears in {@link ELEVATED_ROLES}.
 */
export const isSherlockElevatedRole = (role?: string | null): boolean => {
  const normalized = normalizeSherlockAuthRole(role);
  return (ELEVATED_ROLES as readonly string[]).includes(normalized);
};

/**
 * Deduplicates and trims an array of strings, filtering out falsy and whitespace-only values.
 *
 * @param {Array<string | null | undefined>} values - The raw values to process.
 * @returns {string[]} A new array of unique, trimmed, non-empty strings.
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
 * Input for {@link resolveSherlockEffectivePermissions}.
 */
export interface SherlockEffectivePermissionsInput {
  /** The user's current role (used for elevated-role short-circuit). */
  role?: string | null;
  /** Permissions inherited from the user's assigned role. */
  rolePermissions?: string[];
  /** Permissions granted directly to the user. */
  directPermissions?: string[];
  /** Permissions explicitly revoked from the user. */
  excludedPermissions?: string[];
}

/**
 * Computes the effective permission set for a user by merging role-based and
 * direct permissions, then subtracting excluded ones.
 *
 * Note: elevated roles are currently handled by callers (guards) before reaching
 * this utility, so the function returns the merged set regardless of the role.
 *
 * @param {SherlockEffectivePermissionsInput} input - Sources of permissions and exclusions.
 * @returns {string[]} Deduplicated list of effective permissions after exclusions.
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
