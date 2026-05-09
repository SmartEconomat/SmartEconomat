/**
 * Utilidades de Mapeo para NotificationPriority
 *
 * Funciones auxiliares para traducción y mapeo de prioridades de notificación.
 *
 * @module notification-priority.utils
 */

import { TFunction } from 'i18next';
import { NotificationPriorityEnum } from '../enums/notification-priority.enum';

/**
 * Obtiene la etiqueta traducida de una prioridad de notificación
 *
 * @param t - Función de traducción de i18next
 * @param priority - Prioridad de la notificación
 * @returns Etiqueta traducida
 *
 * @example
 * const label = getNotificationPriorityLabel(t, NotificationPriorityEnum.URGENT);
 * // → "Urgente" (en español) o "Urgent" (en inglés)
 */
export const getNotificationPriorityLabel = (
  t: TFunction,
  priority: NotificationPriorityEnum | string | undefined
): string => {
  if (!priority) return '';

  const labelMap: Record<NotificationPriorityEnum, string> = {
    [NotificationPriorityEnum.URGENT]: t('notificacion.prioridad.urgente'),
    [NotificationPriorityEnum.PENDING]: t('notificacion.prioridad.pendiente'),
    [NotificationPriorityEnum.INFO]: t('notificacion.prioridad.info'),
  };

  return labelMap[priority as NotificationPriorityEnum] || String(priority);
};

/**
 * Convierte una prioridad a un color para UI
 *
 * @param priority - Prioridad de la notificación
 * @returns Nombre del color para Material-UI
 *
 * @example
 * const color = getNotificationPriorityColor(NotificationPriorityEnum.URGENT);
 * // → "error"
 */
export const getNotificationPriorityColor = (
  priority: NotificationPriorityEnum | string | undefined
): 'error' | 'warning' | 'info' | 'success' | 'default' => {
  switch (priority) {
    case NotificationPriorityEnum.URGENT:
      return 'error';
    case NotificationPriorityEnum.PENDING:
      return 'warning';
    case NotificationPriorityEnum.INFO:
      return 'info';
    default:
      return 'default';
  }
};

/**
 * Obtiene el nivel de severidad numérico para ordenamiento
 *
 * @param priority - Prioridad de la notificación
 * @returns Número de severidad (mayor = más grave)
 *
 * @example
 * const severity = getNotificationSeverity(NotificationPriorityEnum.URGENT);
 * // → 3
 */
export const getNotificationSeverity = (
  priority: NotificationPriorityEnum | string | undefined
): number => {
  const severityMap: Record<NotificationPriorityEnum, number> = {
    [NotificationPriorityEnum.URGENT]: 3,
    [NotificationPriorityEnum.PENDING]: 2,
    [NotificationPriorityEnum.INFO]: 1,
  };

  return severityMap[priority as NotificationPriorityEnum] ?? 0;
};
