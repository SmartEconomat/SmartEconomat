'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'IncidenciaResuelaService', {
  enumerable: true,
  get: function () {
    return IncidenciaResuelaService;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _typeorm1 = require('typeorm');
const _incidenciaresueltarepository = require('../repository/incidencia-resuelta.repository');
const _incidenciaentity = require('../incidencia.entity/incidencia.entity');
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
let IncidenciaResuelaService = class IncidenciaResuelaService {
  async create(dto) {
    const incidencia = await this.incidenciaRepository.findOne({
      where: {
        id: dto.idIncidencia,
      },
    });
    if (!incidencia) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('INCIDENCIA_NOT_FOUND')
      );
    }
    const resolucionExistente =
      await this.incidenciaResuelaRepository.findByIncidencia(dto.idIncidencia);
    if (resolucionExistente) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }
    incidencia.resolver(dto.idUsuarioResolutor ?? '', dto.observaciones);
    await this.incidenciaRepository.save(incidencia);
    const resolucion = this.incidenciaResuelaRepository.create({
      incidencia: {
        id: dto.idIncidencia,
      },
      usuarioResolutor: dto.idUsuarioResolutor
        ? {
            id: dto.idUsuarioResolutor,
          }
        : null,
      tipoResolucion: dto.tipoResolucion,
      fechaResolucion: new Date(),
      observaciones: dto.observaciones,
    });
    return this.incidenciaResuelaRepository.save(resolucion);
  }
  async findAll() {
    return this.incidenciaResuelaRepository.find({
      relations: ['incidencia', 'usuarioResolutor'],
    });
  }
  async findOne(id) {
    const resolucion = await this.incidenciaResuelaRepository.findOne({
      where: {
        id,
      },
      relations: ['incidencia', 'usuarioResolutor'],
    });
    if (!resolucion) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('INCIDENCIA_RESUELTA_NOT_FOUND')
      );
    }
    return resolucion;
  }
  async update(id, dto) {
    const resolucion = await this.findOne(id);
    this.incidenciaResuelaRepository.merge(resolucion, {
      tipoResolucion: dto.tipoResolucion,
      observaciones: dto.observaciones,
      usuarioResolutor: dto.idUsuarioResolutor
        ? {
            id: dto.idUsuarioResolutor,
          }
        : resolucion.usuarioResolutor,
    });
    return this.incidenciaResuelaRepository.save(resolucion);
  }
  async remove(id) {
    const resolucion = await this.findOne(id);
    const incidencia = resolucion.incidencia;
    incidencia.fechaResolucion = null;
    incidencia.usuarioResolutor = undefined;
    incidencia.observacionesResolucion = undefined;
    await this.incidenciaRepository.save(incidencia);
    await this.incidenciaResuelaRepository.remove(resolucion);
  }
  constructor(incidenciaResuelaRepository, incidenciaRepository) {
    this.incidenciaResuelaRepository = incidenciaResuelaRepository;
    this.incidenciaRepository = incidenciaRepository;
  }
};
IncidenciaResuelaService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(1, (0, _typeorm.InjectRepository)(_incidenciaentity.Incidencia)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _incidenciaresueltarepository.IncidenciaResuelaRepository ===
      'undefined'
        ? Object
        : _incidenciaresueltarepository.IncidenciaResuelaRepository,
      typeof _typeorm1.Repository === 'undefined'
        ? Object
        : _typeorm1.Repository,
    ]),
  ],
  IncidenciaResuelaService
);
