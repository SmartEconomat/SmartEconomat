"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get RecepcionMessages () {
        return RecepcionMessages;
    },
    get getRecepcionMessage () {
        return getRecepcionMessage;
    }
});
const _languageenum = require("../../../../common/enums/languages/language.enum");
const RecepcionMessages = {
    ERRORS: {
        NOT_FOUND: 'Recepción no encontrada'
    },
    SWAGGER: {
        TAG: 'Recepcion Stock',
        CREATE_SUMMARY: 'Procesar recepción de stock vinculada a un pedido',
        CREATE_SUCCESS: 'Recepción procesada correctamente.',
        CREATE_BAD_REQUEST: 'Datos inválidos o error en el proceso.',
        DTO: {
            LINEA_PEDIDO_PRODUCTO_ID: 'ID del producto del pedido',
            LINEA_CANTIDAD_RECIBIDA: 'Cantidad recibida',
            LINEA_OBSERVACIONES: 'Observaciones de la línea',
            PEDIDO_ID: 'ID del pedido',
            N_ALBARAN: 'Número de albarán',
            LINEAS: 'Líneas de recepción'
        }
    }
};
function getRecepcionMessage(key, lang = _languageenum.LanguageEnum.ES, ...args) {
    if (lang !== _languageenum.LanguageEnum.ES) {
        console.warn(`Language '${lang}' not supported, falling back to 'es'.`);
    }
    const message = RecepcionMessages[key];
    if (typeof message === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        return message(...args);
    }
    return message;
}

//# sourceMappingURL=recepcion-messages.js.map