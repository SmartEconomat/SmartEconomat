/**
 * Utilidades de Mapeo para UserStatus
 *
 * Funciones auxiliares para traducción y mapeo de estados de usuario
 * entre el backend (enums) y frontend (etiquetas traducidas).
 *
 * @module usuario-status.utils
 */

import { TFunction } from 'i18next';
import { UserStatusEnum } from '../enums/user-status.enum';

/**
 * Mapea un estado del backend a un enum válido
 *
 * @param backendStatus - Estado recibido del backend (puede ser cualquier string)
 * @returns Enum válido o undefined si no es reconocido
 *
 * @example
 * const status = mapUserStatusBackendToEnum('ACTIVE');
 * // → UserStatusEnum.ACTIVE
 */
export const mapUserStatusBackendToEnum = (
  backendStatus: string | undefined
): UserStatusEnum | undefined => {
  if (!backendStatus) return undefined;

  const normalized = backendStatus.trim().toUpperCase();

  if (normalized === UserStatusEnum.ACTIVE || normalized === 'ACTIVO') {
    return UserStatusEnum.ACTIVE;
  }

  if (normalized === UserStatusEnum.INACTIVE || normalized === 'INACTIVO') {
    return UserStatusEnum.INACTIVE;
  }

  if (normalized === UserStatusEnum.BLOCKED || normalized === 'BLOQUEADO') {
    return UserStatusEnum.BLOCKED;
  }

  return undefined;
};

/**
 * Obtiene la etiqueta traducida de un estado de usuario
 *
 * @param t - Función de traducción de i18next
 * @param status - Estado a traducir (enum o string)
 * @returns Etiqueta traducida
 *
 * @example
 * const label = getUserStatusLabel(t, UserStatusEnum.ACTIVE);
 * // → "Activo" (en español) o "Active" (en inglés)
 */
export const getUserStatusLabel = (
  t: TFunction,
  status: UserStatusEnum | string | undefined
): string => {
  if (!status) return '';

  const enumValue =
    typeof status === 'string' ? mapUserStatusBackendToEnum(status) : status;

  if (!enumValue) return String(status);

  const labelMap: Record<UserStatusEnum, string> = {
    [UserStatusEnum.ACTIVE]: t('usuario.status.activo'),
    [UserStatusEnum.INACTIVE]: t('usuario.status.inactivo'),
    [UserStatusEnum.BLOCKED]: t('usuario.status.bloqueado'),
  };

  return labelMap[enumValue] || String(enumValue);
};

/**
 * Alterna entre dos estados de usuario
 *
 * @param currentStatus - Estado actual
 * @returns El estado contrario
 *
 * @example
 * const next = toggleUserStatus(UserStatusEnum.ACTIVE);
 * // → UserStatusEnum.INACTIVE
 */
export const toggleUserStatus = (
  currentStatus: UserStatusEnum | string | undefined
): UserStatusEnum => {
  const enumValue =
    typeof currentStatus === 'string'
      ? mapUserStatusBackendToEnum(currentStatus)
      : currentStatus;

  return enumValue === UserStatusEnum.ACTIVE
    ? UserStatusEnum.INACTIVE
    : UserStatusEnum.ACTIVE;
};

/**
 * Convierte un estado a un color para UI
 *
 * @param status - Estado a convertir
 * @returns Nombre del color para Material-UI
 *
 * @example
 * const color = getUserStatusColor(UserStatusEnum.ACTIVE);
 * // → "success"
 */
export const getUserStatusColor = (
  status: UserStatusEnum | string | undefined
): 'success' | 'error' | 'warning' | 'default' => {
  const enumValue =
    typeof status === 'string' ? mapUserStatusBackendToEnum(status) : status;

  switch (enumValue) {
    case UserStatusEnum.ACTIVE:
      return 'success';
    case UserStatusEnum.INACTIVE:
      return 'error';
    case UserStatusEnum.BLOCKED:
      return 'warning';
    default:
      return 'default';
  }
};
