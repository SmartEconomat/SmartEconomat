'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RecepcionProductoService', {
  enumerable: true,
  get: function () {
    return RecepcionProductoService;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _typeorm1 = require('typeorm');
const _recepcionproductoentity = require('../recepcion-productos.entity/recepcion-producto.entity');
const _recepcionentity = require('../recepcion.entity/recepcion.entity');
const _pedidoproductoentity = require('../../pedido/pedido-producto.entity/pedido-producto.entity');
const _i18nhelper = require('../../../common/helpers/i18n.helper');
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
function _ts_param(paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
}
let RecepcionProductoService = class RecepcionProductoService {
  async create(dto) {
    const recepcion = await this.recepcionRepository.findOne({
      where: {
        id: dto.idRecepcion,
      },
    });
    if (!recepcion) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECEPTION_NOT_FOUND')
      );
    }
    const pedidoProducto = await this.pedidoProductoRepository.findOne({
      where: {
        id: dto.idPedidoProducto,
      },
    });
    if (!pedidoProducto) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('PEDIDO_PRODUCT_NOT_FOUND')
      );
    }
    const recepcionProducto = this.recepcionProductoRepository.create({
      recepcion,
      pedidoProducto,
      cantidadRecibida: dto.cantidadRecibida,
      observaciones: dto.observaciones,
      ...(dto.fechaRecepcion
        ? {
            fechaRecepcion: new Date(dto.fechaRecepcion),
          }
        : {}),
    });
    return await this.recepcionProductoRepository.save(recepcionProducto);
  }
  async findAll(query) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const [data, total] = await this.recepcionProductoRepository.findAndCount({
      relations: [
        'recepcion',
        'pedidoProducto',
        'pedidoProducto.productoProveedor',
        'pedidoProducto.productoProveedor.producto',
        'pedidoProducto.productoProveedor.proveedor',
      ],
      order: {
        fechaRecepcion: 'DESC',
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    const totalPages = Math.ceil(total / limit) || 1;
    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
  async findOne(id) {
    const recepcionProducto = await this.recepcionProductoRepository.findOne({
      where: {
        id,
      },
      relations: [
        'recepcion',
        'pedidoProducto',
        'pedidoProducto.productoProveedor',
        'pedidoProducto.productoProveedor.producto',
        'pedidoProducto.productoProveedor.proveedor',
      ],
    });
    if (!recepcionProducto) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECEPTION_PRODUCT_NOT_FOUND')
      );
    }
    return recepcionProducto;
  }
  async update(id, dto) {
    const recepcionProducto = await this.findOne(id);
    if (dto.idRecepcion) {
      const recepcion = await this.recepcionRepository.findOne({
        where: {
          id: dto.idRecepcion,
        },
      });
      if (!recepcion) {
        throw new _common.NotFoundException(
          _i18nhelper.I18nHelper.getError('RECEPTION_NOT_FOUND')
        );
      }
      recepcionProducto.recepcion = recepcion;
    }
    if (dto.idPedidoProducto) {
      const pedidoProducto = await this.pedidoProductoRepository.findOne({
        where: {
          id: dto.idPedidoProducto,
        },
      });
      if (!pedidoProducto) {
        throw new _common.NotFoundException(
          _i18nhelper.I18nHelper.getError('PEDIDO_PRODUCT_NOT_FOUND')
        );
      }
      recepcionProducto.pedidoProducto = pedidoProducto;
    }
    if (dto.cantidadRecibida !== undefined) {
      recepcionProducto.cantidadRecibida = dto.cantidadRecibida;
    }
    if (dto.observaciones !== undefined) {
      recepcionProducto.observaciones = dto.observaciones;
    }
    if (dto.fechaRecepcion) {
      recepcionProducto.fechaRecepcion = new Date(dto.fechaRecepcion);
    }
    return await this.recepcionProductoRepository.save(recepcionProducto);
  }
  async remove(id) {
    const recepcionProducto = await this.findOne(id);
    await this.recepcionProductoRepository.softDelete(recepcionProducto.id);
  }
  constructor(
    recepcionProductoRepository,
    recepcionRepository,
    pedidoProductoRepository
  ) {
    this.recepcionProductoRepository = recepcionProductoRepository;
    this.recepcionRepository = recepcionRepository;
    this.pedidoProductoRepository = pedidoProductoRepository;
  }
};
RecepcionProductoService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(
      0,
      (0, _typeorm.InjectRepository)(_recepcionproductoentity.RecepcionProducto)
    ),
    _ts_param(1, (0, _typeorm.InjectRepository)(_recepcionentity.Recepcion)),
    _ts_param(
      2,
      (0, _typeorm.InjectRepository)(_pedidoproductoentity.PedidoProducto)
    ),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
    ]),
  ],
  RecepcionProductoService
);
