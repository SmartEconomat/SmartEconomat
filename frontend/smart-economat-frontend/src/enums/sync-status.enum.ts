/**
 * Sync Status Enum - Estado de Sincronización
 *
 * Estados posibles para la sincronización de borradores y datos
 * en componentes como Recepción.
 *
 * @enum {string}
 */
export enum SyncStatusEnum {
  SAVING = 'saving',
  SYNCED = 'synced',
  ERROR = 'error',
  CONFLICT = 'conflict',
}

/**
 * Lista de valores válidos para SyncStatusEnum
 */
export const syncStatusValues = Object.values(SyncStatusEnum);
