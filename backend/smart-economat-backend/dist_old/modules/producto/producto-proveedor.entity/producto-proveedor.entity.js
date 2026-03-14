'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProductoProveedor', {
  enumerable: true,
  get: function () {
    return ProductoProveedor;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _columnnumerictransformer = require('../../../common/transformers/column-numeric.transformer');
const _productoentity = require('../producto.entity/producto.entity');
const _proveedorentity = require('../../proveedor/proveedor.entity/proveedor.entity');
const _pedidoproductoentity = require('../../pedido/pedido-producto.entity/pedido-producto.entity');
const _inventarioentity = require('../../inventario/inventario.entity/inventario.entity');
const _historialentity = require('../historial-precio-proveedor.entity/historial.entity');
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
let ProductoProveedor = class ProductoProveedor
  extends _baseentity.BaseEntity {};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'producto_id',
    }),
    _ts_metadata('design:type', String),
  ],
  ProductoProveedor.prototype,
  'productoId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'proveedor_id',
    }),
    _ts_metadata('design:type', String),
  ],
  ProductoProveedor.prototype,
  'proveedorId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _productoentity.Producto,
      (producto) => producto.proveedores,
      {
        onDelete: 'RESTRICT',
        nullable: false,
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
  ProductoProveedor.prototype,
  'producto',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 100,
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  ProductoProveedor.prototype,
  'marca',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'varchar',
      length: 130,
      nullable: true,
      name: 'codigo_barras',
    }),
    _ts_metadata('design:type', String),
  ],
  ProductoProveedor.prototype,
  'codigoBarras',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'numeric',
      precision: 10,
      scale: 2,
      nullable: true,
      name: 'precio_unitario',
      transformer: new _columnnumerictransformer.ColumnNumericTransformer(),
    }),
    _ts_metadata('design:type', Number),
  ],
  ProductoProveedor.prototype,
  'precioUnitario',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _proveedorentity.Proveedor,
      (proveedor) => proveedor.productos,
      {
        onDelete: 'RESTRICT',
        nullable: false,
      }
    ),
    (0, _typeorm.JoinColumn)({
      name: 'proveedor_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  ProductoProveedor.prototype,
  'proveedor',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _inventarioentity.Inventario,
      (inventario) => inventario.productoProveedor
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  ProductoProveedor.prototype,
  'inventarios',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _historialentity.HistorialPrecio,
      (historial) => historial.productoProveedor
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  ProductoProveedor.prototype,
  'historialPrecios',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _pedidoproductoentity.PedidoProducto,
      (pp) => pp.productoProveedor
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  ProductoProveedor.prototype,
  'pedidoProductos',
  void 0
);
ProductoProveedor = _ts_decorate(
  [
    (0, _typeorm.Unique)(['productoId', 'proveedorId']),
    (0, _typeorm.Entity)({
      name: 'producto_proveedor',
    }),
    (0, _typeorm.Index)(['productoId']),
    (0, _typeorm.Index)(['proveedorId']),
    (0, _typeorm.Check)(`"precio_unitario" IS NULL OR "precio_unitario" >= 0`),
  ],
  ProductoProveedor
);
