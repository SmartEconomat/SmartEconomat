/**
 * Notification Priority Enum - Prioridad de Notificación
 *
 * Niveles de prioridad para notificaciones en el sistema.
 * Determina el estilo visual y el nivel de urgencia.
 *
 * @enum {string}
 */
export enum NotificationPriorityEnum {
  URGENT = 'urgent',
  PENDING = 'pending',
  INFO = 'info',
}

/**
 * Lista de valores válidos para NotificationPriorityEnum
 */
export const notificationPriorityValues = Object.values(
  NotificationPriorityEnum
);
