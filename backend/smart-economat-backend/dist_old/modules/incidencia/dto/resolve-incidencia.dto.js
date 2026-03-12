"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ResolveIncidenciaDto", {
    enumerable: true,
    get: function() {
        return ResolveIncidenciaDto;
    }
});
const _classvalidator = require("class-validator");
const _incidenciaenums = require("../enums/incidencia.enums");
const _nestjsi18n = require("nestjs-i18n");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ResolveIncidenciaDto = class ResolveIncidenciaDto {
};
_ts_decorate([
    (0, _classvalidator.IsNotEmpty)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.REQUIRED')
    }),
    (0, _classvalidator.IsEnum)(_incidenciaenums.TipoResolucion, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.INVALID_ENUM')
    }),
    _ts_metadata("design:type", typeof _incidenciaenums.TipoResolucion === "undefined" ? Object : _incidenciaenums.TipoResolucion)
], ResolveIncidenciaDto.prototype, "accion", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.MUST_BE_STRING')
    }),
    _ts_metadata("design:type", String)
], ResolveIncidenciaDto.prototype, "observaciones", void 0);

//# sourceMappingURL=resolve-incidencia.dto.js.map