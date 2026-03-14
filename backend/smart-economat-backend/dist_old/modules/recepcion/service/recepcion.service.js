'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RecepcionService', {
  enumerable: true,
  get: function () {
    return RecepcionService;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _typeorm1 = require('typeorm');
const _recepcionentity = require('../recepcion.entity/recepcion.entity');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _movimientohelper = require('../../../common/helpers/movimiento.helper');
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
let RecepcionService = class RecepcionService {
  async create(dto, userId) {
    const usuario = await this.usuarioRepository.findOne({
      where: {
        id: dto.usuarioId,
      },
    });
    if (!usuario) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('USER_DOES_NOT_EXIST')
      );
    }
    const recepcion = this.recepcionRepository.create({
      fechaRecepcion: dto.fechaRecepcion,
      observaciones: dto.observaciones,
      usuario,
    });
    const savedRecepcion = await this.recepcionRepository.save(recepcion);
    await this.movimientoHelper.trackRecepcion(
      userId,
      savedRecepcion.id,
      0,
      undefined,
      undefined,
      `Recepción creada: ${savedRecepcion.observaciones || 'Sin observaciones'}`
    );
    return savedRecepcion;
  }
  async findAll(query) {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 100);
    const [data, total] = await this.recepcionRepository.findAndCount({
      relations: ['usuario'],
      withDeleted: false,
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
    const recepcion = await this.recepcionRepository.findOne({
      where: {
        id,
      },
      relations: [
        'usuario',
        'recepcionesPedidos',
        'recepcionesPedidos.pedido',
        'recepcionProductos',
        'recepcionProductos.pedidoProducto',
        'recepcionProductos.pedidoProducto.productoProveedor',
        'recepcionProductos.pedidoProducto.productoProveedor.producto',
      ],
    });
    if (!recepcion) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECEPTION_NOT_FOUND')
      );
    }
    return recepcion;
  }
  async update(id, dto) {
    const recepcion = await this.findOne(id);
    if (dto.usuarioId) {
      const usuario = await this.usuarioRepository.findOne({
        where: {
          id: dto.usuarioId,
        },
      });
      if (!usuario) {
        throw new _common.BadRequestException(
          _i18nhelper.I18nHelper.getError('USER_DOES_NOT_EXIST')
        );
      }
      recepcion.usuario = usuario;
    }
    this.recepcionRepository.merge(recepcion, dto);
    return await this.recepcionRepository.save(recepcion);
  }
  async remove(id) {
    const recepcion = await this.recepcionRepository.findOne({
      where: {
        id,
      },
      relations: ['recepcionesPedido', 'recepcionesProducto'],
    });
    if (!recepcion) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECEPTION_NOT_FOUND')
      );
    }
    if (
      recepcion.recepcionesPedidos?.length ||
      recepcion.recepcionProductos?.length
    ) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('RECEPTION_HAS_RELATIONS')
      );
    }
    await this.recepcionRepository.softDelete(id);
  }
  constructor(recepcionRepository, usuarioRepository, movimientoHelper) {
    this.recepcionRepository = recepcionRepository;
    this.usuarioRepository = usuarioRepository;
    this.movimientoHelper = movimientoHelper;
  }
};
RecepcionService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_recepcionentity.Recepcion)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_usuarioentity.Usuario)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
      typeof _movimientohelper.MovimientoHelper === 'undefined'
        ? Object
        : _movimientohelper.MovimientoHelper,
    ]),
  ],
  RecepcionService
);
