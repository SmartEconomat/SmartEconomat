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
    get EstadoPedido () {
        return _estadopedidoenum.EstadoPedido;
    },
    get Pedido () {
        return Pedido;
    }
});
const _typeorm = require("typeorm");
const _baseentity = require("../../../common/entities/base.entity");
const _columnnumerictransformer = require("../../../common/transformers/column-numeric.transformer");
const _estadopedidoenum = require("../enums/estado-pedido.enum");
const _usuarioentity = require("../../usuario/usuario.entity/usuario.entity");
const _recepcionpedidoentity = require("../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity");
const _pedidoproductoentity = require("../pedido-producto.entity/pedido-producto.entity");
const _proveedorentity = require("../../proveedor/proveedor.entity/proveedor.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Pedido = class Pedido extends _baseentity.BaseEntity {
    /* --- Métodos de Dominio --- */ /**
   * Calcular coste total desde productos
   */ calcularTotal() {
        if (!this.pedidoProductos || this.pedidoProductos.length === 0) {
            return 0;
        }
        return this.pedidoProductos.reduce((total, pp)=>{
            return total + Number(pp.cantidad) * Number(pp.precioUnitario);
        }, 0);
    }
    /**
   * Marcar como entregado
   */ marcarComoEntregado() {
        this.estado = _estadopedidoenum.EstadoPedido.RECIBIDO;
        this.fechaEntrega = new Date();
    }
    /**
   * Cancelar pedido con motivo
   */ cancelar(motivo) {
        this.estado = _estadopedidoenum.EstadoPedido.CANCELADO;
        this.motivoCancelacion = motivo;
    }
};
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'usuario_id',
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Pedido.prototype, "usuarioId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'proveedor_id',
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Pedido.prototype, "proveedorId", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_usuarioentity.Usuario, (usuario)=>usuario.pedidos, {
        nullable: true,
        onDelete: 'SET NULL'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'usuario_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Pedido.prototype, "usuario", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_proveedorentity.Proveedor, (proveedor)=>proveedor.pedidos, {
        nullable: true,
        onDelete: 'RESTRICT'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'proveedor_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Pedido.prototype, "proveedor", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'timestamptz',
        default: ()=>'CURRENT_TIMESTAMP',
        name: 'fecha_pedido'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Pedido.prototype, "fechaPedido", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'timestamptz',
        nullable: true,
        name: 'fecha_entrega'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], Pedido.prototype, "fechaEntrega", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 14,
        scale: 4,
        default: 0,
        name: 'coste_total',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], Pedido.prototype, "costeTotal", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        enum: _estadopedidoenum.EstadoPedido,
        default: _estadopedidoenum.EstadoPedido.PENDIENTE
    }),
    _ts_metadata("design:type", typeof _estadopedidoenum.EstadoPedido === "undefined" ? Object : _estadopedidoenum.EstadoPedido)
], Pedido.prototype, "estado", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_pedidoproductoentity.PedidoProducto, (pp)=>pp.pedido, {
        cascade: true
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Pedido.prototype, "pedidoProductos", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_recepcionpedidoentity.RecepcionPedido, (rp)=>rp.pedido),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Pedido.prototype, "recepcionesPedido", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true,
        name: 'motivo_cancelacion'
    }),
    _ts_metadata("design:type", String)
], Pedido.prototype, "motivoCancelacion", void 0);
Pedido = _ts_decorate([
    (0, _typeorm.Entity)({
        name: 'pedido'
    }),
    (0, _typeorm.Index)([
        'estado'
    ]),
    (0, _typeorm.Index)([
        'fechaPedido'
    ]),
    (0, _typeorm.Index)([
        'usuarioId'
    ]),
    (0, _typeorm.Index)([
        'proveedorId'
    ]),
    (0, _typeorm.Index)([
        'estado',
        'createdAt'
    ]),
    (0, _typeorm.Check)(`"coste_total" >= 0`)
], Pedido);

//# sourceMappingURL=pedido.entity.js.map