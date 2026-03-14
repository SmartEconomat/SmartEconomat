'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'Archivo', {
  enumerable: true,
  get: function () {
    return Archivo;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
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
let Archivo = class Archivo extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 255,
    }),
    _ts_metadata('design:type', String),
  ],
  Archivo.prototype,
  'nombre',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 500,
    }),
    _ts_metadata('design:type', String),
  ],
  Archivo.prototype,
  'url',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'int',
    }),
    _ts_metadata('design:type', Number),
  ],
  Archivo.prototype,
  'tamano',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 100,
    }),
    _ts_metadata('design:type', String),
  ],
  Archivo.prototype,
  'mimeType',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Index)(),
    (0, _typeorm.Column)({
      type: 'boolean',
      default: false,
      name: 'is_deleted',
    }),
    _ts_metadata('design:type', Boolean),
  ],
  Archivo.prototype,
  'isDeleted',
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
  Archivo.prototype,
  'usuarioId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _usuarioentity.Usuario,
      (usuario) => usuario.archivos,
      {
        nullable: true,
      }
    ),
    (0, _typeorm.JoinColumn)({
      name: 'usuario_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Archivo.prototype,
  'usuario',
  void 0
);
Archivo = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'archivo',
    }),
  ],
  Archivo
);
