'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'Rol', {
  enumerable: true,
  get: function () {
    return Rol;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _permisoentity = require('../../permisos/entities/permiso.entity');
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
let Rol = class Rol extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 100,
      unique: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Rol.prototype,
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
  Rol.prototype,
  'descripcion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'boolean',
      default: false,
      name: 'es_sistema',
    }),
    _ts_metadata('design:type', Boolean),
  ],
  Rol.prototype,
  'esSistema',
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
  Rol.prototype,
  'activo',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToMany)(
      () => _permisoentity.Permiso,
      (permiso) => permiso.roles,
      {
        cascade: false,
      }
    ),
    (0, _typeorm.JoinTable)({
      name: 'rol_permiso',
      joinColumn: {
        name: 'rol_id',
        referencedColumnName: 'id',
      },
      inverseJoinColumn: {
        name: 'permiso_id',
        referencedColumnName: 'id',
      },
    }),
    _ts_metadata('design:type', Array),
  ],
  Rol.prototype,
  'permisos',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToMany)(
      () => _usuarioentity.Usuario,
      (usuario) => usuario.roles
    ),
    _ts_metadata('design:type', Array),
  ],
  Rol.prototype,
  'usuarios',
  void 0
);
Rol = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'rol',
    }),
    (0, _typeorm.Index)('idx_rol_nombre', ['nombre']),
    (0, _typeorm.Index)('idx_rol_activo', ['activo']),
  ],
  Rol
);
