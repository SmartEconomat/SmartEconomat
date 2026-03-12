"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Inventario", {
    enumerable: true,
    get: function() {
        return Inventario;
    }
});
const _typeorm = require("typeorm");
const _baseentity = require("../../../common/entities/base.entity");
const _columnnumerictransformer = require("../../../common/transformers/column-numeric.transformer");
const _productoproveedorentity = require("../../producto/producto-proveedor.entity/producto-proveedor.entity");
const _ubicacionentity = require("../../ubicacion/ubicacion.entity/ubicacion.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Inventario = class Inventario extends _baseentity.BaseEntity {
    /* --- Métodos de Dominio --- */ /**
   * Ajusta la cantidad actual de stock de forma segura.
   * Lanza un error si el stock resultante sería negativo.
   *
   * @param {number} delta - Cantidad a sumar (positiva) o restar (negativa).
   * @throws {Error} Si el stock resultante es menor a 0.
   */ ajustarCantidad(delta) {
        this.cantidadActual = Number(this.cantidadActual) + delta;
        if (this.cantidadActual < 0) {
            throw new Error(`Stock insuficiente. Actual: ${this.cantidadActual}, Delta: ${delta}`);
        }
    }
    /**
   * Verifica si el stock actual está por debajo del nivel mínimo (punto de pedido).
   * @returns {boolean} True si se debe reabastecer.
   */ esBajoStock() {
        return Number(this.cantidadActual) < Number(this.cantidadMinima);
    }
    /**
   * Verifica si el lote está próximo a caducar dentro de un umbral de días.
   * Utilizado para alertas de caducidad próxima.
   *
   * @param {number} [diasUmbral=7] - Número de días de margen.
   * @returns {boolean} True si caduca en 'diasUmbral' o menos (o ya ha caducado).
   */ proximoACaducar(diasUmbral = 7) {
        if (!this.fechaCaducidad) return false;
        const umbralFecha = new Date();
        umbralFecha.setDate(umbralFecha.getDate() + diasUmbral);
        return this.fechaCaducidad <= umbralFecha;
    }
};
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'producto_proveedor_id'
    }),
    _ts_metadata("design:type", String)
], Inventario.prototype, "productoProveedorId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'ubicacion_id'
    }),
    _ts_metadata("design:type", String)
], Inventario.prototype, "ubicacionId", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_productoproveedorentity.ProductoProveedor, (pp)=>pp.inventarios, {
        onDelete: 'RESTRICT',
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'producto_proveedor_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Inventario.prototype, "productoProveedor", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 12,
        scale: 3,
        name: 'cantidad_actual',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], Inventario.prototype, "cantidadActual", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 12,
        scale: 3,
        name: 'cantidad_minima',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], Inventario.prototype, "cantidadMinima", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 12,
        scale: 3,
        nullable: true,
        name: 'cantidad_maxima',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Object)
], Inventario.prototype, "cantidadMaxima", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_ubicacionentity.Ubicacion, (ubicacion)=>ubicacion.inventarios, {
        onDelete: 'RESTRICT',
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'ubicacion_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Inventario.prototype, "ubicacion", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'timestamptz',
        default: ()=>'CURRENT_TIMESTAMP',
        name: 'fecha_entrada'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Inventario.prototype, "fechaEntrada", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'timestamptz',
        nullable: true,
        name: 'fecha_caducidad'
    }),
    _ts_metadata("design:type", Object)
], Inventario.prototype, "fechaCaducidad", void 0);
Inventario = _ts_decorate([
    (0, _typeorm.Entity)({
        name: 'inventario'
    }),
    (0, _typeorm.Index)([
        'productoProveedorId'
    ]),
    (0, _typeorm.Index)([
        'ubicacionId'
    ]),
    (0, _typeorm.Index)([
        'fechaCaducidad'
    ]),
    (0, _typeorm.Index)([
        'ubicacionId',
        'fechaCaducidad'
    ]),
    (0, _typeorm.Check)(`"cantidad_actual" >= 0`),
    (0, _typeorm.Check)(`"cantidad_minima" >= 0`),
    (0, _typeorm.Check)(`"cantidad_maxima" IS NULL OR "cantidad_maxima" >= "cantidad_minima"`)
], Inventario);

//# sourceMappingURL=inventario.entity.js.map