import { I18nContext } from 'nestjs-i18n';

/**
 * Constantes de mensajes de error
 * @deprecated Usar I18nHelper o I18nContext directamente para obtener mensajes traducidos
 *
 * Esta clase es mantenida por retrocompatibilidad pero debe migrarse a usar
 * I18nHelper o inyectar I18nService de nestjs-i18n
 */
const ERROR_MESSAGES = {
  get EMPTY_REQUEST() {
    const i18n = I18nContext.current();
    return (
      i18n?.translate('errors.EMPTY_REQUEST') ||
      'El cuerpo de la petición está vacío'
    );
  },
} as const;

export default ERROR_MESSAGES;
