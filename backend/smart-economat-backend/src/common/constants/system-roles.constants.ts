/**
 * Roles definidos por defecto en el sistema.
 * Estos roles tienen comportamientos y permisos base preconfigurados.
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PROFESOR: 'PROFESOR',
  ALUMNO: 'ALUMNO',
} as const;

/** Alias público (SystemRoleName) para simplificar payloads o props en smart-economat-backend (Nest). */
export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

/**
 * Roles con privilegios elevados que pueden gestionar otros usuarios y configuraciones globales.
 */
export const ELEVATED_ROLES: readonly SystemRoleName[] = [
  SYSTEM_ROLES.SUPER_ADMIN,
  SYSTEM_ROLES.ADMIN,
] as const;

/**
 * Nivel de jerarquía/prioridad de los roles.
 * Útil para validaciones donde un rol solo puede actuar sobre roles de menor prioridad.
 */
export const ROLE_PRIORITY: Record<string, number> = {
  [SYSTEM_ROLES.ALUMNO]: 0,
  [SYSTEM_ROLES.PROFESOR]: 1,
  [SYSTEM_ROLES.ADMIN]: 2,
  [SYSTEM_ROLES.SUPER_ADMIN]: 3,
};
