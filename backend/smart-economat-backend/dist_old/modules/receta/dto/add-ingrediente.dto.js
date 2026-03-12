"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AddIngredienteDto", {
    enumerable: true,
    get: function() {
        return AddIngredienteDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _swagger = require("@nestjs/swagger");
const _recetaenums = require("../enums/receta.enums");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AddIngredienteDto = class AddIngredienteDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)('7'),
    _ts_metadata("design:type", String)
], AddIngredienteDto.prototype, "productoId", void 0);
_ts_decorate([
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0.01),
    _ts_metadata("design:type", Number)
], AddIngredienteDto.prototype, "cantidad", void 0);
_ts_decorate([
    (0, _classvalidator.IsEnum)(_recetaenums.UnidadIngrediente),
    _ts_metadata("design:type", typeof _recetaenums.UnidadIngrediente === "undefined" ? Object : _recetaenums.UnidadIngrediente)
], AddIngredienteDto.prototype, "unidad", void 0);
_ts_decorate([
    (0, _swagger.ApiPropertyOptional)({
        description: 'docs.PORCENTAJE_DE_MERMA_0_99_EJ_20_20_DE_P_R',
        default: 0
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    (0, _classvalidator.Max)(99),
    _ts_metadata("design:type", Number)
], AddIngredienteDto.prototype, "mermaAplicada", void 0);

//# sourceMappingURL=add-ingrediente.dto.js.map