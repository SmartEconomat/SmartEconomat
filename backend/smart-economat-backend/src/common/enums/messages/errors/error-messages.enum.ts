/**
 * @module ErrorMessages
 * Centralized catalog of error message keys used across the application.
 * These keys are resolved against the active i18n translation files at runtime.
 */

/**
 * Immutable map of error message keys.
 * Values should match keys defined in the i18n translation JSON files under the `errors` section.
 *
 * @constant
 * @example
 * throw new NotFoundException(I18nHelper.getError(ErrorMessages.NOT_FOUND));
 */
export const ErrorMessages = {
  /** Key for a generic "resource not found" error message. */
  NOT_FOUND: 'NOT_FOUND',
} as const;
