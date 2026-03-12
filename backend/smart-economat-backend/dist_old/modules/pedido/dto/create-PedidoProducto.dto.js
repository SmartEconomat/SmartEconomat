"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreatePedidoProductoDto", {
    enumerable: true,
    get: function() {
        return CreatePedidoProductoDto;
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
let CreatePedidoProductoDto = class CreatePedidoProductoDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)('7', {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ID_DEL_PRODUCTOPROVEEDOR_DEBE_SER_UN')
    }),
    _ts_metadata("design:type", String)
], CreatePedidoProductoDto.prototype, "idProductoProveedor", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)({}, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_CANTIDAD_DEBE_SER_NUM_RICA')
    }),
    (0, _classvalidator.Min)(0.001, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_CANTIDAD_DEBE_SER_MAYOR_QUE_0')
    }),
    _ts_metadata("design:type", Number)
], CreatePedidoProductoDto.prototype, "cantidad", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)({}, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_PRECIO_UNITARIO_DEBE_SER_NUM_RICO')
    }),
    (0, _classvalidator.Min)(0, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_PRECIO_UNITARIO_NO_PUEDE_SER_NEGATIVO')
    }),
    _ts_metadata("design:type", Number)
], CreatePedidoProductoDto.prototype, "precioUnitario", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreatePedidoProductoDto.prototype, "observaciones", void 0);

//# sourceMappingURL=create-PedidoProducto.dto.js.map