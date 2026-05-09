/**
 * Roles predefinidos del sistema. Actúan como valores inmutables para guards y lógica de acceso.
 */
export const SYSTEM_ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  PROFESOR: 'PROFESOR',
  ALUMNO: 'ALUMNO',
} as const;

/** Alias público (SystemRoleName) para simplificar payloads o props en smart-economat-frontend (SPA). */
export type SystemRoleName = (typeof SYSTEM_ROLES)[keyof typeof SYSTEM_ROLES];

/**
 * Roles con privilegios elevados que omiten restricciones de menor nivel.
 */
export const ELEVATED_ROLES: readonly string[] = [
  SYSTEM_ROLES.SUPER_ADMIN,
  SYSTEM_ROLES.ADMIN,
] as const;

/**
 * Mapeo numérico de prioridad de rol para resolución de permisos en conflicto.
 */
export const ROLE_PRIORITY: Record<string, number> = {
  [SYSTEM_ROLES.ALUMNO]: 0,
  [SYSTEM_ROLES.PROFESOR]: 1,
  [SYSTEM_ROLES.ADMIN]: 2,
  [SYSTEM_ROLES.SUPER_ADMIN]: 3,
};

/**
 * Devuelve el rol principal de un usuario basado en la prioridad.
 * Si no tiene roles asignados, retorna el rol de fallback o ALUMNO.
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
