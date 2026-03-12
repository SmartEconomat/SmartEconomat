"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecetaIngrediente", {
    enumerable: true,
    get: function() {
        return RecetaIngrediente;
    }
});
const _typeorm = require("typeorm");
const _recetaentity = require("../receta.entity/receta.entity");
const _productoentity = require("../../producto/producto.entity/producto.entity");
const _recetaenums = require("../enums/receta.enums");
const _baseentity = require("../../../common/entities/base.entity");
const _columnnumerictransformer = require("../../../common/transformers/column-numeric.transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let RecetaIngrediente = class RecetaIngrediente extends _baseentity.BaseEntity {
};
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'receta_id'
    }),
    _ts_metadata("design:type", String)
], RecetaIngrediente.prototype, "recetaId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'producto_id'
    }),
    _ts_metadata("design:type", String)
], RecetaIngrediente.prototype, "productoId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 12,
        scale: 4,
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], RecetaIngrediente.prototype, "cantidad", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        enum: _recetaenums.UnidadIngrediente
    }),
    _ts_metadata("design:type", typeof _recetaenums.UnidadIngrediente === "undefined" ? Object : _recetaenums.UnidadIngrediente)
], RecetaIngrediente.prototype, "unidad", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 5,
        scale: 2,
        default: 0,
        name: 'merma_aplicada',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], RecetaIngrediente.prototype, "mermaAplicada", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_recetaentity.Receta, (receta)=>receta.ingredientes, {
        onDelete: 'CASCADE'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'receta_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], RecetaIngrediente.prototype, "receta", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_productoentity.Producto, {
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'producto_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], RecetaIngrediente.prototype, "producto", void 0);
RecetaIngrediente = _ts_decorate([
    (0, _typeorm.Entity)('receta_ingrediente')
], RecetaIngrediente);

//# sourceMappingURL=receta-ingrediente.entity.js.map