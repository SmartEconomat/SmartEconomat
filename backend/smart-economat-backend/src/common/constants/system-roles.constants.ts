/**
 * Constantes de roles del sistema.
 *
 * Estos nombres corresponden a los roles creados por las migraciones base.
 * Usar siempre estas constantes en vez de strings literales.
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PROFESOR: 'PROFESOR',
  ALUMNO: 'ALUMNO',
} as const;

export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

/** Roles con bypass total de permisos. */
export const ELEVATED_ROLES: readonly SystemRoleName[] = [
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
