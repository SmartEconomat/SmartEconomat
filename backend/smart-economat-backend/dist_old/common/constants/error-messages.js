"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "default", {
    enumerable: true,
    get: function() {
        return _default;
    }
});
const _nestjsi18n = require("nestjs-i18n");
/**
 * Constantes de mensajes de error
 * @deprecated Usar I18nHelper o I18nContext directamente para obtener mensajes traducidos
 *
 * Esta clase es mantenida por retrocompatibilidad pero debe migrarse a usar
 * I18nHelper o inyectar I18nService de nestjs-i18n
 */ const ERROR_MESSAGES = {
    get EMPTY_REQUEST () {
        const i18n = _nestjsi18n.I18nContext.current();
        return i18n?.translate('errors.EMPTY_REQUEST') || 'El cuerpo de la petición está vacío';
    }
};
const _default = ERROR_MESSAGES;

//# sourceMappingURL=error-messages.js.map