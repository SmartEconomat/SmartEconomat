"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreatePedidoDto", {
    enumerable: true,
    get: function() {
        return CreatePedidoDto;
    }
});
const _nestjsi18n = require("nestjs-i18n");
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _estadopedidoenum = require("../enums/estado-pedido.enum");
const _pedidoproductodto = require("./pedido-producto.dto");
const _createPedidoProductodto = require("./create-PedidoProducto.dto");
const _trimstringtransformer = require("../../../common/transformers/trim-string.transformer");
const _stringtodatetransformer = require("../../../common/transformers/string-to-date.transformer");
const _stringtonumbertransformer = require("../../../common/transformers/string-to-number.transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreatePedidoDto = class CreatePedidoDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)('7', {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID')
    }),
    _ts_metadata("design:type", String)
], CreatePedidoDto.prototype, "idUsuario", void 0);
_ts_decorate([
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.IsUUID)('7', {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ID_DEL_PROVEEDOR_DEBE_SER_UN_UUID_V_L')
    }),
    _ts_metadata("design:type", String)
], CreatePedidoDto.prototype, "proveedorId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classtransformer.Transform)(_stringtonumbertransformer.StringToNumberTransformer.transform),
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], CreatePedidoDto.prototype, "costeTotal", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_estadopedidoenum.EstadoPedido),
    _ts_metadata("design:type", typeof _estadopedidoenum.EstadoPedido === "undefined" ? Object : _estadopedidoenum.EstadoPedido)
], CreatePedidoDto.prototype, "estado", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_stringtodatetransformer.StringToDateTransformer.transform),
    (0, _classvalidator.IsDateString)({}, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_FECHA_DE_ENTREGA_DEBE_SER_UNA_FECHA_V')
    }),
    _ts_metadata("design:type", String)
], CreatePedidoDto.prototype, "fechaEntrega", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreatePedidoDto.prototype, "motivoCancelacion", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>_pedidoproductodto.PedidoProductoDto),
    _ts_metadata("design:type", Array)
], CreatePedidoDto.prototype, "pedidoProductos", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>_createPedidoProductodto.CreatePedidoProductoDto),
    _ts_metadata("design:type", Array)
], CreatePedidoDto.prototype, "productos", void 0);

//# sourceMappingURL=create-pedido.dto.js.map