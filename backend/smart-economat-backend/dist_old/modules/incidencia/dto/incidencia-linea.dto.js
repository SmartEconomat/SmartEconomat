"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "IncidenciaLineaDto", {
    enumerable: true,
    get: function() {
        return IncidenciaLineaDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _incidencialineaentity = require("../incidencia-linea.entity/incidencia-linea.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let IncidenciaLineaDto = class IncidenciaLineaDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.ID_DE_LA_L_NEA_DE_INCIDENCIA'
    }),
    _ts_metadata("design:type", String)
], IncidenciaLineaDto.prototype, "id", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.CANTIDAD_PEDIDA_ORIGINALMENTE_AL_PROVEED'
    }),
    _ts_metadata("design:type", Number)
], IncidenciaLineaDto.prototype, "cantidadEsperada", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.CANTIDAD_ESCANEADA_RECIBIDA_REALMENTE'
    }),
    _ts_metadata("design:type", Number)
], IncidenciaLineaDto.prototype, "cantidadRecibida", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.DIFERENCIA_DE_CANTIDADES'
    }),
    _ts_metadata("design:type", Number)
], IncidenciaLineaDto.prototype, "diferencia", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _incidencialineaentity.TipoDiferencia
    }),
    _ts_metadata("design:type", typeof _incidencialineaentity.TipoDiferencia === "undefined" ? Object : _incidencialineaentity.TipoDiferencia)
], IncidenciaLineaDto.prototype, "tipoDiferencia", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        enum: _incidencialineaentity.EstadoReclamacion
    }),
    _ts_metadata("design:type", typeof _incidencialineaentity.EstadoReclamacion === "undefined" ? Object : _incidencialineaentity.EstadoReclamacion)
], IncidenciaLineaDto.prototype, "estadoReclamacion", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.OBSERVACIONES_PARA_ESTA_L_NEA_EN_PARTICU',
        required: false
    }),
    _ts_metadata("design:type", String)
], IncidenciaLineaDto.prototype, "observaciones", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.ID_DEL_PRODUCTO_PEDIDO',
        required: false
    }),
    _ts_metadata("design:type", String)
], IncidenciaLineaDto.prototype, "pedidoProductoId", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.NOMBRE_DEL_PRODUCTO',
        required: false
    }),
    _ts_metadata("design:type", String)
], IncidenciaLineaDto.prototype, "nombreProducto", void 0);

//# sourceMappingURL=incidencia-linea.dto.js.map