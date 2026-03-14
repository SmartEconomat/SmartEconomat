'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'IncidenciaResuelta', {
  enumerable: true,
  get: function () {
    return IncidenciaResuelta;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _incidenciaentity = require('../incidencia.entity/incidencia.entity');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _incidenciaenums = require('../enums/incidencia.enums');
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
let IncidenciaResuelta = class IncidenciaResuelta
  extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'incidencia_id',
    }),
    _ts_metadata('design:type', String),
  ],
  IncidenciaResuelta.prototype,
  'incidenciaId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'usuario_resolutor_id',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  IncidenciaResuelta.prototype,
  'usuarioResolutorId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _incidenciaentity.Incidencia, {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    (0, _typeorm.JoinColumn)({
      name: 'incidencia_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  IncidenciaResuelta.prototype,
  'incidencia',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _usuarioentity.Usuario, {
      onDelete: 'SET NULL',
      nullable: true,
    }),
    (0, _typeorm.JoinColumn)({
      name: 'usuario_resolutor_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  IncidenciaResuelta.prototype,
  'usuarioResolutor',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'enum',
      enum: _incidenciaenums.TipoResolucion,
      name: 'tipo_resolucion',
    }),
    _ts_metadata(
      'design:type',
      typeof _incidenciaenums.TipoResolucion === 'undefined'
        ? Object
        : _incidenciaenums.TipoResolucion
    ),
  ],
  IncidenciaResuelta.prototype,
  'tipoResolucion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'timestamptz',
      name: 'fecha_resolucion',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  IncidenciaResuelta.prototype,
  'fechaResolucion',
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
  IncidenciaResuelta.prototype,
  'observaciones',
  void 0
);
IncidenciaResuelta = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'incidencia_resuelta',
    }),
    (0, _typeorm.Index)(['incidenciaId']),
    (0, _typeorm.Index)(['usuarioResolutorId']),
  ],
  IncidenciaResuelta
);
