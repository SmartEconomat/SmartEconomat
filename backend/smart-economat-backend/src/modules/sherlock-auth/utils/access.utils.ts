import {
  ELEVATED_ROLES,
  ROLE_PRIORITY,
  SYSTEM_ROLES,
  type SystemRoleName,
} from '../../../common/constants/system-roles.constants';

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Obtiene valores o vistas materializadas.
 * @undefined {{ nombre: string; }[] | null | undefined} roles - Entrada efectiva esperada por el contrato.
 * @undefined {string | null | undefined} fallbackRole - Entrada efectiva esperada por el contrato.
 * @undefined {string} Datos efectivos después de ejecutar la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export type SherlockAuthRoleAlias = SystemRoleName;

/**
 * Normaliza sherlock auth role para mantener consistencia.
 *
 * @param role Parámetro de entrada para la operación. Opcional.
 * @returns Valor resultante de la operación.
 */
export const normalizeSherlockAuthRole = (role?: string | null): string =>
  String(role ?? '')
    .trim()
    .toUpperCase();

/**
 * Determina si sherlock elevated role.
 *
 * @param role Parámetro de entrada para la operación. Opcional.
 * @returns Valor resultante de la operación.
 */
export const isSherlockElevatedRole = (role?: string | null): boolean => {
  const normalized = normalizeSherlockAuthRole(role);
  return (ELEVATED_ROLES as readonly string[]).includes(normalized);
};

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "uniqueStrings" en smart-economat-backend (Nest).
 * @undefined {(string | null | undefined)[]} values - Entrada efectiva esperada por el contrato.
 * @undefined {string[]} Datos efectivos después de ejecutar la operación.
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
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
export interface SherlockEffectivePermissionsInput {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  role?: string | null;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  rolePermissions?: string[];
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  directPermissions?: string[];
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  excludedPermissions?: string[];
}

/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
 */
/**
 * Expone "resolveSherlockEffectivePermissions" en smart-economat-backend (Nest).
 * @undefined {SherlockEffectivePermissionsInput} input - Entrada efectiva esperada por el contrato.
 * @undefined {string[]} Datos efectivos después de ejecutar la operación.
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
