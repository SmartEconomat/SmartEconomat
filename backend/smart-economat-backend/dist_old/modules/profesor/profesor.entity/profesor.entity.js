'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'Profesor', {
  enumerable: true,
  get: function () {
    return Profesor;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _alumnoentity = require('../../alumno/alumno.entity/alumno.entity');
const _alumnoslotentity = require('./alumno-slot.entity');
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
let Profesor = class Profesor extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.OneToOne)(
      () => _usuarioentity.Usuario,
      (u) => u.profesor
    ),
    (0, _typeorm.JoinColumn)({
      name: 'user_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Profesor.prototype,
  'user',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      unique: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Profesor.prototype,
  'cial',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _alumnoslotentity.AlumnoSlot,
      (slot) => slot.profesor
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Profesor.prototype,
  'slots',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _alumnoentity.Alumno,
      (alumno) => alumno.profesor
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Profesor.prototype,
  'alumnos',
  void 0
);
Profesor = _ts_decorate(
  [
    (0, _typeorm.Entity)('profesor'),
    (0, _typeorm.Index)('idx_profesor_user', ['user'], {
      unique: true,
    }),
  ],
  Profesor
);
