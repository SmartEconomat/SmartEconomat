"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateHistorialPrecioDto", {
    enumerable: true,
    get: function() {
        return CreateHistorialPrecioDto;
    }
});
const _nestjsi18n = require("nestjs-i18n");
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreateHistorialPrecioDto = class CreateHistorialPrecioDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)('7', {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN_1')
    }),
    _ts_metadata("design:type", String)
], CreateHistorialPrecioDto.prototype, "productoProveedorId", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)({}, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO')
    }),
    (0, _classvalidator.Min)(0, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_PRECIO_NO_PUEDE_SER_NEGATIVO')
    }),
    _ts_metadata("design:type", Number)
], CreateHistorialPrecioDto.prototype, "precio", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDate)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_FECHA_DEBE_SER_UNA_FECHA_V_LIDA')
    }),
    (0, _classtransformer.Type)(()=>Date),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], CreateHistorialPrecioDto.prototype, "fecha", void 0);

//# sourceMappingURL=create-historial-precio.dto.js.map