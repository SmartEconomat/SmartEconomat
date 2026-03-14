'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProductoRepository', {
  enumerable: true,
  get: function () {
    return ProductoRepository;
  },
});
const _typeorm = require('typeorm');
const _productoentity = require('../producto.entity/producto.entity');
const _common = require('@nestjs/common');
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
let ProductoRepository = class ProductoRepository extends _typeorm.Repository {
  async existsByCodigoBarras(codigoBarras) {
    const count = await this.count({
      where: {
        codigoBarras,
      },
    });
    return count > 0;
  }
  constructor(dataSource) {
    (super(_productoentity.Producto, dataSource.createEntityManager()),
      (this.dataSource = dataSource));
  }
};
ProductoRepository = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm.DataSource === 'undefined' ? Object : _typeorm.DataSource,
    ]),
  ],
  ProductoRepository
);
