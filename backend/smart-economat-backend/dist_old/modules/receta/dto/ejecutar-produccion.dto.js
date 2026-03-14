"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "EjecutarProduccionDto", {
    enumerable: true,
    get: function() {
        return EjecutarProduccionDto;
    }
});
const _classvalidator = require("class-validator");
const _swagger = require("@nestjs/swagger");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let EjecutarProduccionDto = class EjecutarProduccionDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.UUID_DE_LA_RECETA_A_PRODUCIR'
    }),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], EjecutarProduccionDto.prototype, "recetaId", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.CANTIDAD_TOTAL_A_PRODUCIR'
    }),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0.001),
    _ts_metadata("design:type", Number)
], EjecutarProduccionDto.prototype, "cantidadProducida", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'docs.FECHA_DE_CADUCIDAD_MANUAL_DEL_LOTE_PRODU'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)(),
    _ts_metadata("design:type", String)
], EjecutarProduccionDto.prototype, "fechaCaducidadManual", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        description: 'docs.UUID_DE_LA_UBICACI_N_DE_ALMAC_N_DESTINO'
    }),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], EjecutarProduccionDto.prototype, "ubicacionDestinoId", void 0);

//# sourceMappingURL=ejecutar-produccion.dto.js.map