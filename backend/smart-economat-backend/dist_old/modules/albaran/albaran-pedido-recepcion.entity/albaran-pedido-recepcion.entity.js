"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AlbaranPedidoRecepcion", {
    enumerable: true,
    get: function() {
        return AlbaranPedidoRecepcion;
    }
});
const _typeorm = require("typeorm");
const _baseentity = require("../../../common/entities/base.entity");
const _albaranentity = require("../albaran.entity/albaran.entity");
const _recepcionpedidoentity = require("../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let AlbaranPedidoRecepcion = class AlbaranPedidoRecepcion extends _baseentity.BaseEntity {
};
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'albaran_id'
    }),
    _ts_metadata("design:type", String)
], AlbaranPedidoRecepcion.prototype, "albaranId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'recepcion_pedido_id'
    }),
    _ts_metadata("design:type", String)
], AlbaranPedidoRecepcion.prototype, "recepcionPedidoId", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_albaranentity.Albaran, (albaran)=>albaran.albaranPedidoRecepcion, {
        onDelete: 'CASCADE'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'albaran_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], AlbaranPedidoRecepcion.prototype, "albaran", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_recepcionpedidoentity.RecepcionPedido, {
        onDelete: 'CASCADE'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'recepcion_pedido_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], AlbaranPedidoRecepcion.prototype, "recepcionPedido", void 0);
AlbaranPedidoRecepcion = _ts_decorate([
    (0, _typeorm.Entity)('albaran_pedido_recepcion'),
    (0, _typeorm.Index)([
        'albaranId'
    ]),
    (0, _typeorm.Index)([
        'recepcionPedidoId'
    ])
], AlbaranPedidoRecepcion);

//# sourceMappingURL=albaran-pedido-recepcion.entity.js.map