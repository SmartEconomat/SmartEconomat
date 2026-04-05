/**
 * Constantes de roles del sistema.
 *
 * Mirror del backend: backend/.../common/constants/system-roles.constants.ts
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PROFESOR: 'PROFESOR',
  ALUMNO: 'ALUMNO',
} as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

/** Roles con bypass total de permisos. */
export const ELEVATED_ROLES: readonly string[] = [
  SYSTEM_ROLES.SUPER_ADMIN,
  SYSTEM_ROLES.ADMIN,
] as const;

/** Prioridad de roles (mayor índice = mayor prioridad). */
export const ROLE_PRIORITY: Record<string, number> = {
  [SYSTEM_ROLES.ALUMNO]: 0,
  [SYSTEM_ROLES.PROFESOR]: 1,
  [SYSTEM_ROLES.ADMIN]: 2,
  [SYSTEM_ROLES.SUPER_ADMIN]: 3,
};

/**
 * Resuelve el rol principal a partir de un array de roles.
 * Devuelve el nombre del rol con mayor prioridad.
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
