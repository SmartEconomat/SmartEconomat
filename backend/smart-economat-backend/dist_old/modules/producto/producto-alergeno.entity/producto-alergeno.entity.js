'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProductoAlergeno', {
  enumerable: true,
  get: function () {
    return ProductoAlergeno;
  },
});
const _typeorm = require('typeorm');
const _productoentity = require('../producto.entity/producto.entity');
const _productoenums = require('../enums/producto.enums');
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
let ProductoAlergeno = class ProductoAlergeno {};
_ts_decorate(
  [
    (0, _typeorm.PrimaryColumn)('uuid', {
      name: 'producto_id',
    }),
    _ts_metadata('design:type', String),
  ],
  ProductoAlergeno.prototype,
  'productoId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.PrimaryColumn)({
      type: 'enum',
      enum: _productoenums.Alergeno,
      name: 'alergeno',
    }),
    _ts_metadata(
      'design:type',
      typeof _productoenums.Alergeno === 'undefined'
        ? Object
        : _productoenums.Alergeno
    ),
  ],
  ProductoAlergeno.prototype,
  'alergeno',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _productoentity.Producto,
      (producto) => producto.alergenos,
      {
        onDelete: 'CASCADE',
      }
    ),
    (0, _typeorm.JoinColumn)({
      name: 'producto_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  ProductoAlergeno.prototype,
  'producto',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.CreateDateColumn)({
      type: 'timestamptz',
      name: 'created_at',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  ProductoAlergeno.prototype,
  'createdAt',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.UpdateDateColumn)({
      type: 'timestamptz',
      name: 'updated_at',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  ProductoAlergeno.prototype,
  'updatedAt',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.DeleteDateColumn)({
      type: 'timestamptz',
      name: 'deleted_at',
      nullable: true,
    }),
    _ts_metadata('design:type', Object),
  ],
  ProductoAlergeno.prototype,
  'deletedAt',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.VersionColumn)({
      name: 'version',
      default: 1,
    }),
    _ts_metadata('design:type', Number),
  ],
  ProductoAlergeno.prototype,
  'version',
  void 0
);
ProductoAlergeno = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'producto_alergeno',
    }),
  ],
  ProductoAlergeno
);
