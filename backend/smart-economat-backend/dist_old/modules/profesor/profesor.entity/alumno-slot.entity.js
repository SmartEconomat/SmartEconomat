'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AlumnoSlot', {
  enumerable: true,
  get: function () {
    return AlumnoSlot;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _profesorentity = require('./profesor.entity');
const _alumnoentity = require('../../alumno/alumno.entity/alumno.entity');
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
let AlumnoSlot = class AlumnoSlot extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _profesorentity.Profesor,
      (profesor) => profesor.slots
    ),
    (0, _typeorm.JoinColumn)({
      name: 'profesor_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  AlumnoSlot.prototype,
  'profesor',
  void 0
);
_ts_decorate(
  [(0, _typeorm.Column)(), _ts_metadata('design:type', String)],
  AlumnoSlot.prototype,
  'aula',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'numero_clase',
    }),
    _ts_metadata('design:type', Number),
  ],
  AlumnoSlot.prototype,
  'numeroClase',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToOne)(
      () => _alumnoentity.Alumno,
      (alumno) => alumno.slot,
      {
        nullable: true,
      }
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  AlumnoSlot.prototype,
  'alumno',
  void 0
);
AlumnoSlot = _ts_decorate(
  [
    (0, _typeorm.Entity)('alumno_slot'),
    (0, _typeorm.Index)(
      'idx_slot_profesor_aula_clase',
      ['profesor', 'aula', 'numeroClase'],
      {
        unique: true,
      }
    ),
  ],
  AlumnoSlot
);
