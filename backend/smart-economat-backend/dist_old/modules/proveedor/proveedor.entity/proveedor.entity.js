"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Proveedor", {
    enumerable: true,
    get: function() {
        return Proveedor;
    }
});
const _typeorm = require("typeorm");
const _baseentity = require("../../../common/entities/base.entity");
const _productoproveedorentity = require("../../producto/producto-proveedor.entity/producto-proveedor.entity");
const _pedidoentity = require("../../pedido/pedido.entity/pedido.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Proveedor = class Proveedor extends _baseentity.BaseEntity {
};
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 100
    }),
    _ts_metadata("design:type", String)
], Proveedor.prototype, "nombre", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 100,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Proveedor.prototype, "contacto", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 50,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Proveedor.prototype, "telefono", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Proveedor.prototype, "email", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Proveedor.prototype, "direccion", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 20,
        nullable: true,
        unique: true
    }),
    _ts_metadata("design:type", String)
], Proveedor.prototype, "nif", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_productoproveedorentity.ProductoProveedor, (pp)=>pp.proveedor),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Proveedor.prototype, "productos", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_pedidoentity.Pedido, (pedido)=>pedido.proveedor),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Proveedor.prototype, "pedidos", void 0);
Proveedor = _ts_decorate([
    (0, _typeorm.Entity)({
        name: 'proveedor'
    }),
    (0, _typeorm.Index)([
        'nombre'
    ]),
    (0, _typeorm.Index)([
        'nif'
    ])
], Proveedor);

//# sourceMappingURL=proveedor.entity.js.map