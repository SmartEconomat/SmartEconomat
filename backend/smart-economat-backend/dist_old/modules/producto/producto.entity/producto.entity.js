"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Producto", {
    enumerable: true,
    get: function() {
        return Producto;
    }
});
const _typeorm = require("typeorm");
const _baseentity = require("../../../common/entities/base.entity");
const _columnnumerictransformer = require("../../../common/transformers/column-numeric.transformer");
const _productoenums = require("../enums/producto.enums");
const _productoalergenoentity = require("../producto-alergeno.entity/producto-alergeno.entity");
const _productoproveedorentity = require("../producto-proveedor.entity/producto-proveedor.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Producto = class Producto extends _baseentity.BaseEntity {
};
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 100
    }),
    _ts_metadata("design:type", String)
], Producto.prototype, "nombre", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Producto.prototype, "marca", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Producto.prototype, "descripcion", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        enum: _productoenums.UnidadMedida,
        nullable: true
    }),
    _ts_metadata("design:type", typeof _productoenums.UnidadMedida === "undefined" ? Object : _productoenums.UnidadMedida)
], Producto.prototype, "unidad", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'timestamptz',
        nullable: true,
        name: 'fecha_caducidad'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Producto.prototype, "fechaCaducidad", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 200,
        nullable: true,
        name: 'path_img'
    }),
    _ts_metadata("design:type", String)
], Producto.prototype, "pathImg", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        enum: _productoenums.TipoProducto,
        nullable: true
    }),
    _ts_metadata("design:type", typeof _productoenums.TipoProducto === "undefined" ? Object : _productoenums.TipoProducto)
], Producto.prototype, "tipo", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 13,
        unique: true,
        nullable: true,
        name: 'codigo_barras'
    }),
    _ts_metadata("design:type", String)
], Producto.prototype, "codigoBarras", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 10,
        scale: 2,
        default: 0,
        name: 'contenido',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], Producto.prototype, "contenido", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_productoalergenoentity.ProductoAlergeno, (pa)=>pa.producto, {
        cascade: true
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Producto.prototype, "alergenos", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_productoproveedorentity.ProductoProveedor, (pp)=>pp.producto),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Producto.prototype, "proveedores", void 0);
Producto = _ts_decorate([
    (0, _typeorm.Entity)({
        name: 'producto'
    }),
    (0, _typeorm.Index)([
        'nombre'
    ]),
    (0, _typeorm.Index)([
        'codigoBarras'
    ]),
    (0, _typeorm.Check)(`"fecha_caducidad" IS NULL OR "fecha_caducidad" > "created_at"`)
], Producto);

//# sourceMappingURL=producto.entity.js.map