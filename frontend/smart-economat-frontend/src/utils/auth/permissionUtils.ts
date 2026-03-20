import { User } from '../../store/auth.types';

/**
 * Verifica si un usuario tiene un permiso específico.
 * @param user El objeto de usuario actual
 * @param permiso El código del permiso a verificar (ej: 'productos:crear')
 * @returns true si tiene el permiso o es SUPER_ADMIN
 */
export const hasPermission = (user: User | null, permiso: string): boolean => {
  if (!user) return false;

  // Super Admin tiene bypass total
  if (user.rol?.toUpperCase() === 'SUPER_ADMIN') return true;

  return user.permisos?.includes(permiso) || false;
};

/**
 * Verifica si el usuario tiene TODOS los permisos indicados.
 */
export const hasAllPermissions = (
  user: User | null,
  permisos: string[]
): boolean => {
  return permisos.every((p) => hasPermission(user, p));
};

/**
 * Verifica si el usuario tiene AL MENOS UNO de los permisos indicados.
 */
export const hasAnyPermission = (
  user: User | null,
  permisos: string[]
): boolean => {
  return permisos.some((p) => hasPermission(user, p));
};
