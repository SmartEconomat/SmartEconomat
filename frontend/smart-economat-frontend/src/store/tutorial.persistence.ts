/** Constantes públicas (TUTORIAL_COMPLETED_PREFERENCE_KEY) expuestas en smart-economat-frontend (SPA). */
export const TUTORIAL_COMPLETED_PREFERENCE_KEY = 'tutorialCompleted';
/** Constantes públicas (TUTORIAL_COMPLETED_STORAGE_KEY) expuestas en smart-economat-frontend (SPA). */
export const TUTORIAL_COMPLETED_STORAGE_KEY = 'sm_tutorial_completed';

/**
 * Expone "isBooleanTrue" en smart-economat-frontend (SPA).
 * @undefined {unknown} value - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export function isBooleanTrue(value: unknown): boolean {
  return value === true || value === 'true';
}

/**
 * Expone "isTutorialGloballyCompleted" en smart-economat-frontend (SPA).
 * @undefined {Record<string, unknown> | undefined} preferences - Entrada efectiva esperada por el contrato.
 * @undefined {boolean} Datos efectivos después de ejecutar la operación.
 */
export function isTutorialGloballyCompleted(
  preferences?: Record<string, unknown>
): boolean {
  return isBooleanTrue(preferences?.[TUTORIAL_COMPLETED_PREFERENCE_KEY]);
}
