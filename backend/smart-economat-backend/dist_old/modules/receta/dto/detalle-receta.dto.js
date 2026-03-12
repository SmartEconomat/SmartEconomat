"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
function _export(target, all) {
    for(var name in all)Object.defineProperty(target, name, {
        enumerable: true,
        get: Object.getOwnPropertyDescriptor(all, name).get
    });
}
_export(exports, {
    get DetalleRecetaDto () {
        return DetalleRecetaDto;
    },
    get IngredienteDetalleDto () {
        return IngredienteDetalleDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _recetaentity = require("../receta.entity/receta.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let IngredienteDetalleDto = class IngredienteDetalleDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], IngredienteDetalleDto.prototype, "cantidadNecesaria", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], IngredienteDetalleDto.prototype, "stockActual", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", Number)
], IngredienteDetalleDto.prototype, "cantidadFaltante", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], IngredienteDetalleDto.prototype, "unidad", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], IngredienteDetalleDto.prototype, "productoId", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)(),
    _ts_metadata("design:type", String)
], IngredienteDetalleDto.prototype, "productoNombre", void 0);
let DetalleRecetaDto = class DetalleRecetaDto {
};
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: ()=>_recetaentity.Receta
    }),
    _ts_metadata("design:type", typeof _recetaentity.Receta === "undefined" ? Object : _recetaentity.Receta)
], DetalleRecetaDto.prototype, "receta", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: [
            IngredienteDetalleDto
        ]
    }),
    _ts_metadata("design:type", Array)
], DetalleRecetaDto.prototype, "detalleIngredientes", void 0);
_ts_decorate([
    (0, _swagger.ApiProperty)({
        type: [
            String
        ]
    }),
    _ts_metadata("design:type", Array)
], DetalleRecetaDto.prototype, "alergenosConsolidados", void 0);

//# sourceMappingURL=detalle-receta.dto.js.map