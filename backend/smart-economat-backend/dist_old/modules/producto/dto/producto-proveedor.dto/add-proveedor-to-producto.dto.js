"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AddProveedorToProductoDto", {
    enumerable: true,
    get: function() {
        return AddProveedorToProductoDto;
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
let AddProveedorToProductoDto = class AddProveedorToProductoDto {
};
_ts_decorate([
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UNA_CADENA')
    }),
    (0, _classvalidator.IsNotEmpty)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ID_DEL_PROVEEDOR_ES_OBLIGATORIO')
    }),
    _ts_metadata("design:type", String)
], AddProveedorToProductoDto.prototype, "proveedorId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_MARCA_DEBE_SER_UNA_CADENA_DE_TEXTO')
    }),
    _ts_metadata("design:type", String)
], AddProveedorToProductoDto.prototype, "marcaEspecifica", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UNA_CADENA')
    }),
    _ts_metadata("design:type", String)
], AddProveedorToProductoDto.prototype, "codigoBarras", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)({}, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_PRECIO_UNITARIO_DEBE_SER_UN_N_MERO')
    }),
    _ts_metadata("design:type", Number)
], AddProveedorToProductoDto.prototype, "precioUnitario", void 0);

//# sourceMappingURL=add-proveedor-to-producto.dto.js.map