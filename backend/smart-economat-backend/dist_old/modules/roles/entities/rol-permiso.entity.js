'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RolPermiso', {
  enumerable: true,
  get: function () {
    return RolPermiso;
  },
});
const _typeorm = require('typeorm');
const _rolentity = require('./rol.entity');
const _permisoentity = require('../../permisos/entities/permiso.entity');
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
let RolPermiso = class RolPermiso {};
_ts_decorate(
  [
    (0, _typeorm.PrimaryColumn)({
      type: 'uuid',
      name: 'rol_id',
    }),
    _ts_metadata('design:type', String),
  ],
  RolPermiso.prototype,
  'rolId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.PrimaryColumn)({
      type: 'uuid',
      name: 'permiso_id',
    }),
    _ts_metadata('design:type', String),
  ],
  RolPermiso.prototype,
  'permisoId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.CreateDateColumn)({
      type: 'timestamp',
      name: 'asignado_en',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  RolPermiso.prototype,
  'asignadoEn',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'uuid',
      nullable: true,
      name: 'asignado_por',
    }),
    _ts_metadata('design:type', String),
  ],
  RolPermiso.prototype,
  'asignadoPor',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _rolentity.Rol, {
      onDelete: 'CASCADE',
    }),
    (0, _typeorm.JoinColumn)({
      name: 'rol_id',
    }),
    _ts_metadata(
      'design:type',
      typeof _rolentity.Rol === 'undefined' ? Object : _rolentity.Rol
    ),
  ],
  RolPermiso.prototype,
  'rol',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _permisoentity.Permiso, {
      onDelete: 'CASCADE',
    }),
    (0, _typeorm.JoinColumn)({
      name: 'permiso_id',
    }),
    _ts_metadata(
      'design:type',
      typeof _permisoentity.Permiso === 'undefined'
        ? Object
        : _permisoentity.Permiso
    ),
  ],
  RolPermiso.prototype,
  'permiso',
  void 0
);
RolPermiso = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'rol_permiso',
    }),
    (0, _typeorm.Index)('idx_rol_permiso_rol', ['rolId']),
    (0, _typeorm.Index)('idx_rol_permiso_permiso', ['permisoId']),
  ],
  RolPermiso
);
