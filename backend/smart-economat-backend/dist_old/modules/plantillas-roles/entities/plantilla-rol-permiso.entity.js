'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'PlantillaRolPermiso', {
  enumerable: true,
  get: function () {
    return PlantillaRolPermiso;
  },
});
const _typeorm = require('typeorm');
const _plantillarolentity = require('./plantilla-rol.entity');
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
let PlantillaRolPermiso = class PlantillaRolPermiso {};
_ts_decorate(
  [
    (0, _typeorm.PrimaryColumn)({
      type: 'uuid',
      name: 'plantilla_rol_id',
    }),
    _ts_metadata('design:type', String),
  ],
  PlantillaRolPermiso.prototype,
  'plantillaRolId',
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
  PlantillaRolPermiso.prototype,
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
  PlantillaRolPermiso.prototype,
  'asignadoEn',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _plantillarolentity.PlantillaRol, {
      onDelete: 'CASCADE',
    }),
    (0, _typeorm.JoinColumn)({
      name: 'plantilla_rol_id',
    }),
    _ts_metadata(
      'design:type',
      typeof _plantillarolentity.PlantillaRol === 'undefined'
        ? Object
        : _plantillarolentity.PlantillaRol
    ),
  ],
  PlantillaRolPermiso.prototype,
  'plantillaRol',
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
  PlantillaRolPermiso.prototype,
  'permiso',
  void 0
);
PlantillaRolPermiso = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'plantilla_rol_permiso',
    }),
    (0, _typeorm.Index)('idx_plantilla_permiso_plantilla', ['plantillaRolId']),
    (0, _typeorm.Index)('idx_plantilla_permiso_permiso', ['permisoId']),
  ],
  PlantillaRolPermiso
);
