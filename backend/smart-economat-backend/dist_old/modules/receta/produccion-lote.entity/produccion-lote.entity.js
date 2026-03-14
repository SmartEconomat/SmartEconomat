'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProduccionLote', {
  enumerable: true,
  get: function () {
    return ProduccionLote;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _columnnumerictransformer = require('../../../common/transformers/column-numeric.transformer');
const _recetaentity = require('../receta.entity/receta.entity');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
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
let ProduccionLote = class ProduccionLote extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'receta_id',
    }),
    _ts_metadata('design:type', String),
  ],
  ProduccionLote.prototype,
  'recetaId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'usuario_id',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  ProduccionLote.prototype,
  'usuarioId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _recetaentity.Receta, {
      nullable: false,
      onDelete: 'RESTRICT',
    }),
    (0, _typeorm.JoinColumn)({
      name: 'receta_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  ProduccionLote.prototype,
  'receta',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _usuarioentity.Usuario, {
      nullable: true,
      onDelete: 'SET NULL',
    }),
    (0, _typeorm.JoinColumn)({
      name: 'usuario_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  ProduccionLote.prototype,
  'usuario',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'numeric',
      precision: 12,
      scale: 3,
      name: 'cantidad_producida',
      transformer: new _columnnumerictransformer.ColumnNumericTransformer(),
    }),
    _ts_metadata('design:type', Number),
  ],
  ProduccionLote.prototype,
  'cantidadProducida',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
      name: 'fecha_produccion',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  ProduccionLote.prototype,
  'fechaProduccion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'timestamptz',
      nullable: true,
      name: 'fecha_caducidad',
    }),
    _ts_metadata('design:type', Object),
  ],
  ProduccionLote.prototype,
  'fechaCaducidad',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'numeric',
      precision: 14,
      scale: 4,
      name: 'coste_total_real',
      transformer: new _columnnumerictransformer.ColumnNumericTransformer(),
    }),
    _ts_metadata('design:type', Number),
  ],
  ProduccionLote.prototype,
  'costeTotalReal',
  void 0
);
ProduccionLote = _ts_decorate(
  [
    (0, _typeorm.Entity)('produccion_lote'),
    (0, _typeorm.Index)(['recetaId']),
    (0, _typeorm.Index)(['usuarioId']),
    (0, _typeorm.Index)(['fechaProduccion']),
  ],
  ProduccionLote
);
