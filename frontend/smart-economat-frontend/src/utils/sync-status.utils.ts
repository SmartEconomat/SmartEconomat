/**
 * Utilidades de Mapeo para SyncStatus
 *
 * Funciones auxiliares para traducción y mapeo de estados de sincronización.
 * Utilizado en componentes como Recepción donde se sincroniza con el servidor.
 *
 * @module sync-status.utils
 */

import { TFunction } from 'i18next';
import { SyncStatusEnum } from '../enums/sync-status.enum';

/**
 * Obtiene la etiqueta traducida de un estado de sincronización
 *
 * @param t - Función de traducción de i18next
 * @param status - Estado de sincronización
 * @returns Etiqueta traducida
 *
 * @example
 * const label = getSyncStatusLabel(t, SyncStatusEnum.SAVING);
 * // → "Guardando..." (en español) o "Saving..." (en inglés)
 */
export const getSyncStatusLabel = (
  t: TFunction,
  status: SyncStatusEnum | string | undefined
): string => {
  if (!status) return '';

  const labelMap: Record<SyncStatusEnum, string> = {
    [SyncStatusEnum.SAVING]: t('recepcion.sync.saving'),
    [SyncStatusEnum.SYNCED]: t('recepcion.sync.synced'),
    [SyncStatusEnum.ERROR]: t('recepcion.sync.error'),
    [SyncStatusEnum.CONFLICT]: t('recepcion.sync.conflict'),
  };

  return labelMap[status as SyncStatusEnum] || String(status);
};

/**
 * Obtiene el tooltip traducido de un estado de sincronización
 *
 * @param t - Función de traducción de i18next
 * @param status - Estado de sincronización
 * @param errorMessage - Mensaje de error personalizado (solo para estado ERROR)
 * @returns Tooltip traducido
 *
 * @example
 * const tooltip = getSyncStatusTooltip(t, SyncStatusEnum.ERROR, 'Connection timeout');
 */
export const getSyncStatusTooltip = (
  t: TFunction,
  status: SyncStatusEnum | string | undefined,
  errorMessage?: string
): string => {
  if (!status) return '';

  const tooltipMap: Record<SyncStatusEnum, string> = {
    [SyncStatusEnum.SAVING]: t('recepcion.sync.savingTooltip'),
    [SyncStatusEnum.SYNCED]: t('recepcion.sync.syncedTooltip'),
    [SyncStatusEnum.ERROR]: errorMessage || t('recepcion.sync.errorTooltip'),
    [SyncStatusEnum.CONFLICT]: t('recepcion.sync.conflictTooltip'),
  };

  return tooltipMap[status as SyncStatusEnum] || String(status);
};

/**
 * Convierte un estado de sincronización a un color para UI
 *
 * @param status - Estado de sincronización
 * @returns Nombre del color para Material-UI Chip
 *
 * @example
 * const color = getSyncStatusColor(SyncStatusEnum.SAVING);
 * // → "warning"
 */
export const getSyncStatusColor = (
  status: SyncStatusEnum | string | undefined
): 'success' | 'error' | 'warning' | 'info' | undefined => {
  switch (status) {
    case SyncStatusEnum.SAVING:
      return 'warning';
    case SyncStatusEnum.SYNCED:
      return 'success';
    case SyncStatusEnum.ERROR:
      return 'error';
    case SyncStatusEnum.CONFLICT:
      return 'warning';
    default:
      return undefined;
  }
};
