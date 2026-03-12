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
    get calculateCheckDigit () {
        return calculateCheckDigit;
    },
    get generateEan13 () {
        return generateEan13;
    },
    get validateEan13 () {
        return validateEan13;
    }
});
const _i18nhelper = require("../helpers/i18n.helper");
function calculateCheckDigit(digits) {
    if (!/^\d{12}$/.test(digits)) {
        throw new Error(_i18nhelper.I18nHelper.getError('INPUT_MUST_BE_EXACTLY_12_DIGITS'));
    }
    let sum = 0;
    for(let i = 0; i < 12; i++){
        const digit = parseInt(digits[i], 10);
        const weight = i % 2 === 0 ? 1 : 3;
        sum += digit * weight;
    }
    const remainder = sum % 10;
    return remainder === 0 ? 0 : 10 - remainder;
}
function generateEan13(prefix = '200') {
    if (!/^\d+$/.test(prefix) || prefix.length > 12) {
        throw new Error('Prefix must contain only digits and be at most 12 characters long');
    }
    const remainingLength = 12 - prefix.length;
    let randomDigits = '';
    for(let i = 0; i < remainingLength; i++){
        randomDigits += Math.floor(Math.random() * 10).toString();
    }
    const base12Digits = prefix + randomDigits;
    const checkDigit = calculateCheckDigit(base12Digits);
    return base12Digits + checkDigit.toString();
}
function validateEan13(code) {
    if (!code || typeof code !== 'string' || !/^\d{13}$/.test(code)) {
        return false;
    }
    const base12Digits = code.substring(0, 12);
    const providedCheckDigit = parseInt(code[12], 10);
    try {
        const expectedCheckDigit = calculateCheckDigit(base12Digits);
        return providedCheckDigit === expectedCheckDigit;
    } catch  {
        return false;
    }
}

//# sourceMappingURL=ean13.util.js.map