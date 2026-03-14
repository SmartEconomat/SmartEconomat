"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateRecetaDto", {
    enumerable: true,
    get: function() {
        return CreateRecetaDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _swagger = require("@nestjs/swagger");
const _recetaenums = require("../enums/receta.enums");
const _trimstringtransformer = require("../../../common/transformers/trim-string.transformer");
const _addingredientedto = require("./add-ingrediente.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreateRecetaDto = class CreateRecetaDto {
};
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(150),
    _ts_metadata("design:type", String)
], CreateRecetaDto.prototype, "nombre", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata("design:type", String)
], CreateRecetaDto.prototype, "instrucciones", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_recetaenums.TiempoReceta),
    _ts_metadata("design:type", typeof _recetaenums.TiempoReceta === "undefined" ? Object : _recetaenums.TiempoReceta)
], CreateRecetaDto.prototype, "tiempo", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_recetaenums.DificultadReceta),
    _ts_metadata("design:type", typeof _recetaenums.DificultadReceta === "undefined" ? Object : _recetaenums.DificultadReceta)
], CreateRecetaDto.prototype, "dificultad", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(50),
    (0, _classvalidator.Matches)(/^\d+ (minutos|horas|segundos)$/, {
        message: 'El tiempo de preparación debe seguir el formato: "10 minutos", "1 hora", etc.'
    }),
    _ts_metadata("design:type", String)
], CreateRecetaDto.prototype, "tiempoPreparacion", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'docs.ID_DEL_PRODUCTO_QUE_RESULTA_DE_LA_ELABOR'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)(),
    _ts_metadata("design:type", String)
], CreateRecetaDto.prototype, "productoResultadoId", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'docs.CANTIDAD_PRODUCIDA_POR_DEFECTO_RENDIMIEN'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0.001),
    _ts_metadata("design:type", Number)
], CreateRecetaDto.prototype, "rendimiento", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        enum: _recetaenums.UnidadIngrediente,
        description: 'docs.UNIDAD_DEL_PRODUCTO_RESULTANTE'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_recetaenums.UnidadIngrediente),
    _ts_metadata("design:type", typeof _recetaenums.UnidadIngrediente === "undefined" ? Object : _recetaenums.UnidadIngrediente)
], CreateRecetaDto.prototype, "unidadResultado", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'docs.D_AS_DE_CADUCIDAD_DEL_PRODUCTO_ELABORADO'
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    _ts_metadata("design:type", Number)
], CreateRecetaDto.prototype, "diasCaducidad", void 0);
_ts_decorate([
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ArrayMinSize)(1),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>_addingredientedto.AddIngredienteDto),
    _ts_metadata("design:type", Array)
], CreateRecetaDto.prototype, "ingredientes", void 0);

//# sourceMappingURL=create-receta.dto.js.map