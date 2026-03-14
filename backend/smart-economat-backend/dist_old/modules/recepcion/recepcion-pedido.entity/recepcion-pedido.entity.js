'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RecepcionPedido', {
  enumerable: true,
  get: function () {
    return RecepcionPedido;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _pedidoentity = require('../../pedido/pedido.entity/pedido.entity');
const _recepcionentity = require('../recepcion.entity/recepcion.entity');
const _albaranpedidorecepcionentity = require('../../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity');
function _ts_decorate(decorators, target, key, desc) {
  var c = arguments.length,
    r =
      c < 3
        ? target
        : desc === null
          ? (desc = Object.getOwnPropertyDescriptor(target, key))
          : desc,
    d;
  if (typeof Reflect === 'object' && typeof Reflect.decorate === 'function')
    r = Reflect.decorate(decorators, target, key, desc);
  else
    for (var i = decorators.length - 1; i >= 0; i--)
      if ((d = decorators[i]))
        r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return (c > 3 && r && Object.defineProperty(target, key, r), r);
}
function _ts_metadata(k, v) {
  if (typeof Reflect === 'object' && typeof Reflect.metadata === 'function')
    return Reflect.metadata(k, v);
}
let RecepcionPedido = class RecepcionPedido extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'recepcion_id',
    }),
    _ts_metadata('design:type', String),
  ],
  RecepcionPedido.prototype,
  'recepcionId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'pedido_id',
    }),
    _ts_metadata('design:type', String),
  ],
  RecepcionPedido.prototype,
  'pedidoId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _recepcionentity.Recepcion,
      (recepcion) => recepcion.recepcionesPedidos,
      {
        onDelete: 'RESTRICT',
        nullable: false,
      }
    ),
    (0, _typeorm.JoinColumn)({
      name: 'recepcion_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  RecepcionPedido.prototype,
  'recepcion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _pedidoentity.Pedido,
      (pedido) => pedido.recepcionesPedido,
      {
        onDelete: 'RESTRICT',
        nullable: false,
      }
    ),
    (0, _typeorm.JoinColumn)({
      name: 'pedido_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  RecepcionPedido.prototype,
  'pedido',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'fecha_vinculacion',
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  RecepcionPedido.prototype,
  'fechaVinculacion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _albaranpedidorecepcionentity.AlbaranPedidoRecepcion,
      (apr) => apr.recepcionPedido
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  RecepcionPedido.prototype,
  'albaranPedidoRecepcion',
  void 0
);
RecepcionPedido = _ts_decorate(
  [
    (0, _typeorm.Unique)(['recepcionId', 'pedidoId']),
    (0, _typeorm.Entity)({
      name: 'recepcion_pedido',
    }),
    (0, _typeorm.Index)(['recepcionId']),
    (0, _typeorm.Index)(['pedidoId']),
  ],
  RecepcionPedido
);
