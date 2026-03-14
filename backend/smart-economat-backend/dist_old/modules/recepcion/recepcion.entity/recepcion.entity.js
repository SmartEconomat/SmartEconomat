'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get EstadoRecepcion() {
    return _estadorecepcionenum.EstadoRecepcion;
  },
  get Recepcion() {
    return Recepcion;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _estadorecepcionenum = require('../enums/estado-recepcion.enum');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _recepcionpedidoentity = require('../recepcion-pedido.entity/recepcion-pedido.entity');
const _recepcionproductoentity = require('../recepcion-productos.entity/recepcion-producto.entity');
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
let Recepcion = class Recepcion extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'usuario_id',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Recepcion.prototype,
  'usuarioId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _usuarioentity.Usuario,
      (usuario) => usuario.recepciones,
      {
        nullable: true,
        onDelete: 'SET NULL',
      }
    ),
    (0, _typeorm.JoinColumn)({
      name: 'usuario_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Recepcion.prototype,
  'usuario',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
      name: 'fecha_recepcion',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  Recepcion.prototype,
  'fechaRecepcion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'enum',
      enum: _estadorecepcionenum.EstadoRecepcion,
      default: _estadorecepcionenum.EstadoRecepcion.COMPLETADA,
    }),
    _ts_metadata(
      'design:type',
      typeof _estadorecepcionenum.EstadoRecepcion === 'undefined'
        ? Object
        : _estadorecepcionenum.EstadoRecepcion
    ),
  ],
  Recepcion.prototype,
  'estado',
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
  Recepcion.prototype,
  'observaciones',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      default: false,
    }),
    _ts_metadata('design:type', Boolean),
  ],
  Recepcion.prototype,
  'incidencia',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _recepcionpedidoentity.RecepcionPedido,
      (rp) => rp.recepcion,
      {
        cascade: true,
      }
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Recepcion.prototype,
  'recepcionesPedidos',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _recepcionproductoentity.RecepcionProducto,
      (rp) => rp.recepcion,
      {
        cascade: true,
      }
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Recepcion.prototype,
  'recepcionProductos',
  void 0
);
Recepcion = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'recepcion',
    }),
    (0, _typeorm.Index)(['usuarioId']),
    (0, _typeorm.Index)(['fechaRecepcion']),
    (0, _typeorm.Index)(['estado']),
  ],
  Recepcion
);
