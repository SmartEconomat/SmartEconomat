'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'HistorialPrecio', {
  enumerable: true,
  get: function () {
    return HistorialPrecio;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _columnnumerictransformer = require('../../../common/transformers/column-numeric.transformer');
const _productoproveedorentity = require('../producto-proveedor.entity/producto-proveedor.entity');
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
let HistorialPrecio = class HistorialPrecio extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'producto_proveedor_id',
    }),
    _ts_metadata('design:type', String),
  ],
  HistorialPrecio.prototype,
  'productoProveedorId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _productoproveedorentity.ProductoProveedor,
      (pp) => pp.historialPrecios,
      {
        onDelete: 'CASCADE',
        nullable: false,
      }
    ),
    (0, _typeorm.JoinColumn)({
      name: 'producto_proveedor_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  HistorialPrecio.prototype,
  'productoProveedor',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'numeric',
      precision: 10,
      scale: 2,
      nullable: false,
      transformer: new _columnnumerictransformer.ColumnNumericTransformer(),
    }),
    _ts_metadata('design:type', Number),
  ],
  HistorialPrecio.prototype,
  'precio',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'timestamptz',
      default: () => 'CURRENT_TIMESTAMP',
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  HistorialPrecio.prototype,
  'fecha',
  void 0
);
HistorialPrecio = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'historial_precio',
    }),
    (0, _typeorm.Index)(['productoProveedorId']),
    (0, _typeorm.Index)(['fecha']),
    (0, _typeorm.Check)(`"precio" >= 0`),
  ],
  HistorialPrecio
);
