/**
 * User Status Enum - Estado del Usuario
 *
 * Valores centralizados para los estados posibles de un usuario.
 * Utilizado en toda la aplicación para comparaciones y mapeos consistentes.
 *
 * @enum {string}
 *
 * @example
 * // Comparación segura de estados
 * if (user.estado === UserStatusEnum.ACTIVE) {
 *   // Usuario activo
 * }
 *
 * // Uso con traducción
 * const label = getEnumLabel(t, 'userStatus', UserStatusEnum.ACTIVE);
 */
export enum UserStatusEnum {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
}

/**
 * Lista de valores válidos para UserStatusEnum
 * Útil para validaciones y búsquedas
 */
export const userStatusValues = Object.values(UserStatusEnum);
