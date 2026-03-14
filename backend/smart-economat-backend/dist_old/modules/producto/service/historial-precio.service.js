'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'HistorialPrecioService', {
  enumerable: true,
  get: function () {
    return HistorialPrecioService;
  },
});
const _common = require('@nestjs/common');
const _historialpreciorepository = require('../repository/historial-precio.repository');
const _productoproveedorentity = require('../producto-proveedor.entity/producto-proveedor.entity');
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _typeorm = require('typeorm');
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
let HistorialPrecioService = class HistorialPrecioService {
  async create(dto) {
    const productoProveedor = await this.dataSource.manager.findOne(
      _productoproveedorentity.ProductoProveedor,
      {
        where: {
          id: dto.productoProveedorId,
        },
      }
    );
    if (!productoProveedor) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
      );
    }
    if (dto.precio < 0) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('PRECIO_NO_NEGATIVO')
      );
    }
    const historial = this.historialPrecioRepository.create({
      productoProveedor,
      precio: dto.precio,
      ...(dto.fecha
        ? {
            fecha: dto.fecha,
          }
        : {}),
    });
    return this.historialPrecioRepository.save(historial);
  }
  async findAll(order = 'DESC') {
    return this.historialPrecioRepository.findAllWithRelations(order);
  }
  async findOne(id) {
    const historial =
      await this.historialPrecioRepository.findOneWithRelations(id);
    if (!historial) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('HISTORIAL_PRECIO_NOT_FOUND')
      );
    }
    return historial;
  }
  async update(id, dto) {
    const historial = await this.findOne(id);
    if (dto.productoProveedorId) {
      const productoProveedor = await this.dataSource.manager.findOne(
        _productoproveedorentity.ProductoProveedor,
        {
          where: {
            id: dto.productoProveedorId,
          },
        }
      );
      if (!productoProveedor) {
        throw new _common.NotFoundException(
          _i18nhelper.I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
        );
      }
      historial.productoProveedor = productoProveedor;
    }
    if (dto.precio !== undefined) {
      if (dto.precio === null) {
        throw new _common.BadRequestException(
          _i18nhelper.I18nHelper.getError('INVALID_DATA')
        );
      }
      if (dto.precio < 0) {
        throw new _common.BadRequestException(
          _i18nhelper.I18nHelper.getError('PRECIO_NO_NEGATIVO')
        );
      }
      historial.precio = dto.precio;
    }
    if (dto.fecha !== undefined) {
      historial.fecha = dto.fecha;
    }
    return this.historialPrecioRepository.save(historial);
  }
  async remove(id) {
    const historial = await this.findOne(id);
    await this.historialPrecioRepository.softRemove(historial);
  }
  constructor(historialPrecioRepository, dataSource) {
    this.historialPrecioRepository = historialPrecioRepository;
    this.dataSource = dataSource;
  }
};
HistorialPrecioService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _historialpreciorepository.HistorialPrecioRepository ===
      'undefined'
        ? Object
        : _historialpreciorepository.HistorialPrecioRepository,
      typeof _typeorm.DataSource === 'undefined' ? Object : _typeorm.DataSource,
    ]),
  ],
  HistorialPrecioService
);
