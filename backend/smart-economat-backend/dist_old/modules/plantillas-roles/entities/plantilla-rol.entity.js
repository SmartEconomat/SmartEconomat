'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'PlantillaRol', {
  enumerable: true,
  get: function () {
    return PlantillaRol;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
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
let PlantillaRol = class PlantillaRol extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 100,
      unique: true,
    }),
    _ts_metadata('design:type', String),
  ],
  PlantillaRol.prototype,
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
  PlantillaRol.prototype,
  'descripcion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'boolean',
      default: true,
      name: 'es_editable',
    }),
    _ts_metadata('design:type', Boolean),
  ],
  PlantillaRol.prototype,
  'esEditable',
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
  PlantillaRol.prototype,
  'activo',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'uuid',
      nullable: true,
      name: 'plantilla_padre_id',
    }),
    _ts_metadata('design:type', String),
  ],
  PlantillaRol.prototype,
  'plantillaPadreId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => PlantillaRol,
      (plantilla) => plantilla.plantillasHijas,
      {
        nullable: true,
        onDelete: 'SET NULL',
      }
    ),
    (0, _typeorm.JoinColumn)({
      name: 'plantilla_padre_id',
    }),
    _ts_metadata('design:type', Object),
  ],
  PlantillaRol.prototype,
  'plantillaPadre',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => PlantillaRol,
      (plantilla) => plantilla.plantillaPadre
    ),
    _ts_metadata('design:type', Array),
  ],
  PlantillaRol.prototype,
  'plantillasHijas',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToMany)(() => _permisoentity.Permiso, {
      cascade: false,
    }),
    (0, _typeorm.JoinTable)({
      name: 'plantilla_rol_permiso',
      joinColumn: {
        name: 'plantilla_rol_id',
        referencedColumnName: 'id',
      },
      inverseJoinColumn: {
        name: 'permiso_id',
        referencedColumnName: 'id',
      },
    }),
    _ts_metadata('design:type', Array),
  ],
  PlantillaRol.prototype,
  'permisos',
  void 0
);
PlantillaRol = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'plantilla_rol',
    }),
    (0, _typeorm.Index)('idx_plantilla_nombre', ['nombre']),
    (0, _typeorm.Index)('idx_plantilla_activo', ['activo']),
  ],
  PlantillaRol
);
