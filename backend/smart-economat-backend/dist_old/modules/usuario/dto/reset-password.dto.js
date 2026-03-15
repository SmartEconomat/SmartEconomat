"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ResetPasswordDto", {
    enumerable: true,
    get: function() {
        return ResetPasswordDto;
    }
});
const _nestjsi18n = require("nestjs-i18n");
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ResetPasswordDto = class ResetPasswordDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_CONTRASE_A_DEBE_SER_UNA_CADENA_DE_TEX')
    }),
    (0, _classvalidator.IsNotEmpty)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_CONTRASE_A_ES_OBLIGATORIA')
    }),
    (0, _classvalidator.IsStrongPassword)({
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
    }, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_CONTRASE_A_DEBE_TENER_AL_MENOS_8_CARA')
    }),
    _ts_metadata("design:type", String)
], ResetPasswordDto.prototype, "password", void 0);

//# sourceMappingURL=reset-password.dto.js.map