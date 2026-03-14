'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'Permiso', {
  enumerable: true,
  get: function () {
    return Permiso;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _rolentity = require('../../roles/entities/rol.entity');
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
let Permiso = class Permiso extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 100,
      unique: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Permiso.prototype,
  'codigo',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 150,
    }),
    _ts_metadata('design:type', String),
  ],
  Permiso.prototype,
  'nombre',
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
  Permiso.prototype,
  'descripcion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 50,
    }),
    _ts_metadata('design:type', String),
  ],
  Permiso.prototype,
  'modulo',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 50,
    }),
    _ts_metadata('design:type', String),
  ],
  Permiso.prototype,
  'accion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'boolean',
      default: true,
    }),
    _ts_metadata('design:type', Boolean),
  ],
  Permiso.prototype,
  'activo',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToMany)(
      () => _rolentity.Rol,
      (rol) => rol.permisos
    ),
    _ts_metadata('design:type', Array),
  ],
  Permiso.prototype,
  'roles',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToMany)('Usuario', 'permisosAdicionales'),
    _ts_metadata('design:type', Array),
  ],
  Permiso.prototype,
  'usuariosAdicionales',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToMany)('Usuario', 'permisosExcluidos'),
    _ts_metadata('design:type', Array),
  ],
  Permiso.prototype,
  'usuariosExcluidos',
  void 0
);
Permiso = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'permiso',
    }),
    (0, _typeorm.Index)('idx_permiso_codigo', ['codigo']),
    (0, _typeorm.Index)('idx_permiso_modulo', ['modulo']),
    (0, _typeorm.Index)('idx_permiso_activo', ['activo']),
  ],
  Permiso
);
