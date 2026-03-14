'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UbicacionService', {
  enumerable: true,
  get: function () {
    return UbicacionService;
  },
});
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _typeorm1 = require('typeorm');
const _ubicacionentity = require('../ubicacion.entity/ubicacion.entity');
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
let UbicacionService = class UbicacionService {
  async create(createUbicacionDto) {
    const existing = await this.ubicacionRepository.findOne({
      where: {
        nombre: createUbicacionDto.nombre,
      },
    });
    if (existing) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError(
          'YA_EXISTE_UNA_UBICACI_N_CON_ESTE_NOMBRE'
        )
      );
    }
    const nuevaUbicacion = this.ubicacionRepository.create(createUbicacionDto);
    return await this.ubicacionRepository.save(nuevaUbicacion);
  }
  async findAll() {
    return this.ubicacionRepository.find({
      order: {
        nombre: 'ASC',
      },
    });
  }
  async findOne(id) {
    const ubicacion = await this.ubicacionRepository.findOne({
      where: {
        id,
      },
    });
    if (!ubicacion) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('UBICACI_N_NO_ENCONTRADA')
      );
    }
    return ubicacion;
  }
  async update(id, updateUbicacionDto) {
    const ubicacion = await this.findOne(id);
    this.ubicacionRepository.merge(ubicacion, updateUbicacionDto);
    return await this.ubicacionRepository.save(ubicacion);
  }
  async remove(id) {
    const ubicacion = await this.findOne(id);
    await this.ubicacionRepository.softRemove(ubicacion);
  }
  async restore(id) {
    const ubicacion = await this.ubicacionRepository.findOne({
      where: {
        id,
      },
      withDeleted: true,
    });
    if (!ubicacion) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('UBICACI_N_NO_ENCONTRADA')
      );
    }
    return await this.ubicacionRepository.recover(ubicacion);
  }
  constructor(ubicacionRepository) {
    this.ubicacionRepository = ubicacionRepository;
  }
};
UbicacionService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_ubicacionentity.Ubicacion)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
    ]),
  ],
  UbicacionService
);
