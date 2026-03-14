'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'InventarioRepository', {
  enumerable: true,
  get: function () {
    return InventarioRepository;
  },
});
const _typeorm = require('typeorm');
const _common = require('@nestjs/common');
const _inventarioentity = require('../inventario.entity/inventario.entity');
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
let InventarioRepository = class InventarioRepository
  extends _typeorm.Repository
{
  async findByProductoProveedor(productoProveedorId) {
    return this.find({
      where: {
        productoProveedor: {
          id: productoProveedorId,
        },
      },
      relations: [
        'productoProveedor',
        'productoProveedor.producto',
        'productoProveedor.proveedor',
      ],
    });
  }
  async findStockBajo() {
    return this.createQueryBuilder('inventario')
      .where('inventario.cantidad_actual < inventario.cantidad_minima')
      .leftJoinAndSelect('inventario.productoProveedor', 'productoProveedor')
      .leftJoinAndSelect('productoProveedor.producto', 'producto')
      .leftJoinAndSelect('productoProveedor.proveedor', 'proveedor')
      .getMany();
  }
  async findCaducidadProxima(dias = 7) {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + dias);
    return this.find({
      where: {
        fechaCaducidad: (0, _typeorm.Between)(hoy, limite),
      },
    });
  }
  constructor(dataSource) {
    (super(_inventarioentity.Inventario, dataSource.createEntityManager()),
      (this.dataSource = dataSource));
  }
};
InventarioRepository = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm.DataSource === 'undefined' ? Object : _typeorm.DataSource,
    ]),
  ],
  InventarioRepository
);
