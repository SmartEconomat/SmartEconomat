'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RecepcionProducto', {
  enumerable: true,
  get: function () {
    return RecepcionProducto;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _columnnumerictransformer = require('../../../common/transformers/column-numeric.transformer');
const _recepcionentity = require('../recepcion.entity/recepcion.entity');
const _pedidoproductoentity = require('../../pedido/pedido-producto.entity/pedido-producto.entity');
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
let RecepcionProducto = class RecepcionProducto
  extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'recepcion_id',
    }),
    _ts_metadata('design:type', String),
  ],
  RecepcionProducto.prototype,
  'recepcionId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'pedido_producto_id',
    }),
    _ts_metadata('design:type', String),
  ],
  RecepcionProducto.prototype,
  'pedidoProductoId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _recepcionentity.Recepcion,
      (recepcion) => recepcion.recepcionProductos,
      {
        onDelete: 'CASCADE',
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
  RecepcionProducto.prototype,
  'recepcion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _pedidoproductoentity.PedidoProducto, {
      onDelete: 'RESTRICT',
      nullable: false,
    }),
    (0, _typeorm.JoinColumn)({
      name: 'pedido_producto_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  RecepcionProducto.prototype,
  'pedidoProducto',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'numeric',
      precision: 12,
      scale: 3,
      name: 'cantidad_recibida',
      transformer: new _columnnumerictransformer.ColumnNumericTransformer(),
    }),
    _ts_metadata('design:type', Number),
  ],
  RecepcionProducto.prototype,
  'cantidadRecibida',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'text',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  RecepcionProducto.prototype,
  'observaciones',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'fecha_recepcion',
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  RecepcionProducto.prototype,
  'fechaRecepcion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'is_weighed_with_scale',
      type: 'boolean',
      default: false,
    }),
    _ts_metadata('design:type', Boolean),
  ],
  RecepcionProducto.prototype,
  'isWeighedWithScale',
  void 0
);
RecepcionProducto = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'recepcion_producto',
    }),
    (0, _typeorm.Index)(['recepcionId']),
    (0, _typeorm.Index)(['pedidoProductoId']),
    (0, _typeorm.Check)(`"cantidad_recibida" >= 0`),
  ],
  RecepcionProducto
);
