'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'Alumno', {
  enumerable: true,
  get: function () {
    return Alumno;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _profesorentity = require('../../profesor/profesor.entity/profesor.entity');
const _alumnoslotentity = require('../../profesor/profesor.entity/alumno-slot.entity');
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
let Alumno = class Alumno extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.OneToOne)(
      () => _usuarioentity.Usuario,
      (u) => u.alumno
    ),
    (0, _typeorm.JoinColumn)({
      name: 'user_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Alumno.prototype,
  'user',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToOne)(
      () => _alumnoslotentity.AlumnoSlot,
      (slot) => slot.alumno
    ),
    (0, _typeorm.JoinColumn)({
      name: 'slot_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Alumno.prototype,
  'slot',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _profesorentity.Profesor,
      (profesor) => profesor.alumnos
    ),
    (0, _typeorm.JoinColumn)({
      name: 'profesor_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Alumno.prototype,
  'profesor',
  void 0
);
Alumno = _ts_decorate(
  [
    (0, _typeorm.Entity)('alumno'),
    (0, _typeorm.Index)('idx_alumno_user', ['user'], {
      unique: true,
    }),
    (0, _typeorm.Index)('idx_alumno_slot', ['slot'], {
      unique: true,
    }),
  ],
  Alumno
);
