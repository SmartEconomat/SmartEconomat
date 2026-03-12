"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RegisterUserDto", {
    enumerable: true,
    get: function() {
        return RegisterUserDto;
    }
});
const _nestjsi18n = require("nestjs-i18n");
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _usuarioenums = require("../../usuario/enums/usuario.enums");
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
let RegisterUserDto = class RegisterUserDto {
};
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata("design:type", String)
], RegisterUserDto.prototype, "username", void 0);
_ts_decorate([
    (0, _classvalidator.IsString)(),
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
], RegisterUserDto.prototype, "password", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_lowercasestringtransformer.LowercaseStringTransformer.transform),
    (0, _classvalidator.IsEmail)(),
    _ts_metadata("design:type", String)
], RegisterUserDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_usuarioenums.rolUsuario),
    _ts_metadata("design:type", typeof _usuarioenums.rolUsuario === "undefined" ? Object : _usuarioenums.rolUsuario)
], RegisterUserDto.prototype, "rol", void 0);

//# sourceMappingURL=register-user.dto.js.map