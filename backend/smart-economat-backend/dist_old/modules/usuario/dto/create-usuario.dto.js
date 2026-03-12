"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateUsuarioDto", {
    enumerable: true,
    get: function() {
        return CreateUsuarioDto;
    }
});
const _nestjsi18n = require("nestjs-i18n");
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _usuarioenums = require("../enums/usuario.enums");
const _trimstringtransformer = require("../../../common/transformers/trim-string.transformer");
const _lowercasestringtransformer = require("../../../common/transformers/lowercase-string.transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreateUsuarioDto = class CreateUsuarioDto {
};
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA')
    }),
    (0, _classvalidator.IsNotEmpty)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_NOMBRE_DE_USUARIO_ES_OBLIGATORIO')
    }),
    (0, _classvalidator.MaxLength)(100, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO')
    }),
    _ts_metadata("design:type", String)
], CreateUsuarioDto.prototype, "username", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_CONTRASE_A_DEBE_SER_UNA_CADENA_DE_TEX')
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
], CreateUsuarioDto.prototype, "password", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.ValidateIf)((o)=>o.email != null),
    (0, _classtransformer.Transform)(_lowercasestringtransformer.LowercaseStringTransformer.transform),
    (0, _classvalidator.IsEmail)({}, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.INVALID_EMAIL')
    }),
    (0, _classvalidator.MaxLength)(255, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_CORREO_ELECTR_NICO_NO_PUEDE_EXCEDER_L')
    }),
    _ts_metadata("design:type", Object)
], CreateUsuarioDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_usuarioenums.rolUsuario, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ROL_DE_USUARIO_NO_ES_V_LIDO')
    }),
    _ts_metadata("design:type", typeof _usuarioenums.rolUsuario === "undefined" ? Object : _usuarioenums.rolUsuario)
], CreateUsuarioDto.prototype, "rol", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_usuarioenums.UserStatus, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ESTADO_NO_ES_V_LIDO')
    }),
    _ts_metadata("design:type", typeof _usuarioenums.UserStatus === "undefined" ? Object : _usuarioenums.UserStatus)
], CreateUsuarioDto.prototype, "status", void 0);

//# sourceMappingURL=create-usuario.dto.js.map