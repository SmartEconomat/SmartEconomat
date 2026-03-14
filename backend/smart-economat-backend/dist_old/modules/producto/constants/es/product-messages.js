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
    get ProductMessages () {
        return ProductMessages;
    },
    get getProductMessage () {
        return getProductMessage;
    }
});
const _languageenum = require("../../../../common/enums/languages/language.enum");
const ProductMessages = {
    NOT_FOUND: (id)=>`Producto con ID "${id}" no encontrado`
};
function getProductMessage(key, lang = _languageenum.LanguageEnum.ES, ...args) {
    if (lang !== _languageenum.LanguageEnum.ES) {
        console.warn(`Language '${lang}' not supported, falling back to 'es'.`);
    }
    const messageFn = ProductMessages[key];
    if (typeof messageFn === 'function') {
        return messageFn(...args);
    }
    return String(messageFn);
}

//# sourceMappingURL=product-messages.js.map