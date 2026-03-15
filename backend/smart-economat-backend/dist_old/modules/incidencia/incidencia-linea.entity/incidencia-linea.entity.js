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
    get EstadoReclamacion () {
        return EstadoReclamacion;
    },
    get IncidenciaLinea () {
        return IncidenciaLinea;
    },
    get TipoDiferencia () {
        return TipoDiferencia;
    }
});
const _typeorm = require("typeorm");
const _baseentity = require("../../../common/entities/base.entity");
const _incidenciaentity = require("../incidencia.entity/incidencia.entity");
const _pedidoproductoentity = require("../../pedido/pedido-producto.entity/pedido-producto.entity");
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
var TipoDiferencia = /*#__PURE__*/ function(TipoDiferencia) {
    TipoDiferencia["FALTANTE"] = "FALTANTE";
    TipoDiferencia["EXCESO"] = "EXCESO";
    TipoDiferencia["DEFECTUOSO"] = "DEFECTUOSO";
    return TipoDiferencia;
}({});
var EstadoReclamacion = /*#__PURE__*/ function(EstadoReclamacion) {
    EstadoReclamacion["PENDIENTE"] = "PENDIENTE";
    EstadoReclamacion["RECLAMADO"] = "RECLAMADO";
    EstadoReclamacion["ABONADO"] = "ABONADO";
    EstadoReclamacion["REENVIADO"] = "REENVIADO";
    return EstadoReclamacion;
}({});
let IncidenciaLinea = class IncidenciaLinea extends _baseentity.BaseEntity {
};
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'incidencia_id'
    }),
    _ts_metadata("design:type", String)
], IncidenciaLinea.prototype, "incidenciaId", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        name: 'pedido_producto_id'
    }),
    _ts_metadata("design:type", String)
], IncidenciaLinea.prototype, "pedidoProductoId", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_incidenciaentity.Incidencia, (incidencia)=>incidencia.lineas, {
        onDelete: 'CASCADE',
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'incidencia_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], IncidenciaLinea.prototype, "incidencia", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_pedidoproductoentity.PedidoProducto, {
        onDelete: 'RESTRICT',
        nullable: false
    }),
    (0, _typeorm.JoinColumn)({
        name: 'pedido_producto_id'
    }),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], IncidenciaLinea.prototype, "pedidoProducto", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 12,
        scale: 3,
        name: 'cantidad_esperada',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], IncidenciaLinea.prototype, "cantidadEsperada", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 12,
        scale: 3,
        name: 'cantidad_recibida',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], IncidenciaLinea.prototype, "cantidadRecibida", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'numeric',
        precision: 12,
        scale: 3,
        name: 'diferencia',
        transformer: new _columnnumerictransformer.ColumnNumericTransformer()
    }),
    _ts_metadata("design:type", Number)
], IncidenciaLinea.prototype, "diferencia", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        enum: TipoDiferencia,
        name: 'tipo_diferencia'
    }),
    _ts_metadata("design:type", String)
], IncidenciaLinea.prototype, "tipoDiferencia", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'enum',
        enum: EstadoReclamacion,
        name: 'estado_reclamacion',
        default: "PENDIENTE"
    }),
    _ts_metadata("design:type", String)
], IncidenciaLinea.prototype, "estadoReclamacion", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'text',
        nullable: true
    }),
    _ts_metadata("design:type", String)
], IncidenciaLinea.prototype, "observaciones", void 0);
IncidenciaLinea = _ts_decorate([
    (0, _typeorm.Entity)({
        name: 'incidencia_linea'
    }),
    (0, _typeorm.Index)([
        'incidenciaId'
    ]),
    (0, _typeorm.Index)([
        'pedidoProductoId'
    ])
], IncidenciaLinea);

//# sourceMappingURL=incidencia-linea.entity.js.map