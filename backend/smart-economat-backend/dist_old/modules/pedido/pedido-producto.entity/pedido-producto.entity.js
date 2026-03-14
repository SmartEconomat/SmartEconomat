"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PedidoProducto", {
    enumerable: true,
    get: function() {
        return PedidoProducto;
    }
});
const _typeorm = require("typeorm");
const _baseentity = require("../../../common/entities/base.entity");
const _columnnumerictransformer = require("../../../common/transformers/column-numeric.transformer");
const _pedidoentity = require("../pedido.entity/pedido.entity");
const _productoproveedorentity = require("../../producto/producto-proveedor.entity/producto-proveedor.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PedidoProducto = class PedidoProducto extends _baseentity.BaseEntity {
    /* --- Métodos de Dominio --- */ /**
   * Calcular subtotal (cantidad * precio)
   */ get subtotal() {
        return Number(this.cantidad) * Number(this.precioUnitario);
    }
};
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'pedido_id'
    }),
    _ts_metadata("design:type", String)
], PedidoProducto.prototype, "pedidoId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'producto_proveedor_id'
    }),
    _ts_metadata("design:type", String)
], PedidoProducto.prototype, "productoProveedorId", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_pedidoentity.Pedido, (pedido)=>pedido.pedidoProductos, {
        onDelete: 'RESTRICT',
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'pedido_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], PedidoProducto.prototype, "pedido", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_productoproveedorentity.ProductoProveedor, (pp)=>pp.pedidoProductos, {
        onDelete: 'RESTRICT',
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'producto_proveedor_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], PedidoProducto.prototype, "productoProveedor", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 12,
        scale: 3,
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], PedidoProducto.prototype, "cantidad", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 12,
        scale: 4,
        name: 'precio_unitario',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], PedidoProducto.prototype, "precioUnitario", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", String)
], PedidoProducto.prototype, "observaciones", void 0);
PedidoProducto = _ts_decorate([
    (0, _typeorm.Entity)({
        name: 'pedido_producto'
    }),
    (0, _typeorm.Index)([
        'pedidoId'
    ]),
    (0, _typeorm.Index)([
        'productoProveedorId'
    ]),
    (0, _typeorm.Check)(`"cantidad" > 0`),
    (0, _typeorm.Check)(`"precio_unitario" >= 0`)
], PedidoProducto);

//# sourceMappingURL=pedido-producto.entity.js.map