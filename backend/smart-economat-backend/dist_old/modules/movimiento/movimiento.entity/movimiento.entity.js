'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get Movimiento() {
    return Movimiento;
  },
  get TipoMovimiento() {
    return _movimientoenums.TipoMovimiento;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _columnnumerictransformer = require('../../../common/transformers/column-numeric.transformer');
const _movimientoenums = require('../enums/movimiento.enums');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _inventarioentity = require('../../inventario/inventario.entity/inventario.entity');
const _productoproveedorentity = require('../../producto/producto-proveedor.entity/producto-proveedor.entity');
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
let Movimiento = class Movimiento extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'usuario_id',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Movimiento.prototype,
  'usuarioId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'inventario_id',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Movimiento.prototype,
  'inventarioId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'producto_proveedor_id',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Movimiento.prototype,
  'productoProveedorId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'enum',
      enum: _movimientoenums.TipoMovimiento,
    }),
    _ts_metadata(
      'design:type',
      typeof _movimientoenums.TipoMovimiento === 'undefined'
        ? Object
        : _movimientoenums.TipoMovimiento
    ),
  ],
  Movimiento.prototype,
  'tipo',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'numeric',
      precision: 12,
      scale: 3,
      transformer: new _columnnumerictransformer.ColumnNumericTransformer(),
    }),
    _ts_metadata('design:type', Number),
  ],
  Movimiento.prototype,
  'cantidad',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _usuarioentity.Usuario,
      (usuario) => usuario.movimientos,
      {
        nullable: true,
        onDelete: 'SET NULL',
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
  Movimiento.prototype,
  'usuario',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _inventarioentity.Inventario, {
      nullable: true,
      onDelete: 'SET NULL',
    }),
    (0, _typeorm.JoinColumn)({
      name: 'inventario_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Movimiento.prototype,
  'inventario',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _productoproveedorentity.ProductoProveedor, {
      nullable: true,
      onDelete: 'SET NULL',
    }),
    (0, _typeorm.JoinColumn)({
      name: 'producto_proveedor_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Movimiento.prototype,
  'productoProveedor',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 50,
      name: 'entidad_tipo',
    }),
    _ts_metadata('design:type', String),
  ],
  Movimiento.prototype,
  'entidad',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'uuid',
      name: 'entidad_id',
    }),
    _ts_metadata('design:type', String),
  ],
  Movimiento.prototype,
  'entidadId',
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
  Movimiento.prototype,
  'descripcion',
  void 0
);
Movimiento = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'movimiento',
    }),
    (0, _typeorm.Index)(['tipo']),
    (0, _typeorm.Index)(['usuarioId']),
    (0, _typeorm.Index)(['entidad', 'tipo']),
    (0, _typeorm.Index)(['entidadId']),
    (0, _typeorm.Index)(['entidadId', 'entidad']),
    (0, _typeorm.Index)(['inventarioId']),
    (0, _typeorm.Index)(['productoProveedorId']),
    (0, _typeorm.Check)(`"cantidad" >= 0`),
  ],
  Movimiento
);
