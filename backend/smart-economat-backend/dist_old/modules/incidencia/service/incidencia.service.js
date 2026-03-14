'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'IncidenciaService', {
  enumerable: true,
  get: function () {
    return IncidenciaService;
  },
});
const _common = require('@nestjs/common');
const _incidenciarepository = require('../repository/incidencia.repository');
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _typeorm = require('typeorm');
const _recepcionentity = require('../../recepcion/recepcion.entity/recepcion.entity');
const _typeorm1 = require('@nestjs/typeorm');
const _movimientohelper = require('../../../common/helpers/movimiento.helper');
const _incidenciaresueltaentity = require('../incidencia-resuelta.entity/incidencia-resuelta.entity');
const _incidenciaenums = require('../enums/incidencia.enums');
const _movimientoenums = require('../../movimiento/enums/movimiento.enums');
const _incidenciaresueltarepository = require('../repository/incidencia-resuelta.repository');
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
let IncidenciaService = class IncidenciaService {
  async create(dto) {
    const incidencia = this.incidenciaRepository.create({
      recepcion: {
        id: dto.recepcionId,
      },
      ...(dto.pedidoId
        ? {
            pedido: {
              id: dto.pedidoId,
            },
          }
        : {}),
      observacionesRecepcion: dto.observacionesRecepcion,
    });
    return this.incidenciaRepository.save(incidencia);
  }
  async findAll() {
    return this.incidenciaRepository.findAllWithRelations();
  }
  async findOne(id) {
    const incidencia = await this.incidenciaRepository.findOneWithRelations(id);
    if (!incidencia) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('INCIDENCIA_NOT_FOUND')
      );
    }
    return incidencia;
  }
  async update(id, dto) {
    const incidencia = await this.findOne(id);
    if (incidencia.estaResuelta()) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }
    this.incidenciaRepository.merge(incidencia, {
      ...(dto.recepcionId
        ? {
            recepcion: {
              id: dto.recepcionId,
            },
          }
        : {}),
      ...(dto.pedidoId
        ? {
            pedido: {
              id: dto.pedidoId,
            },
          }
        : {}),
      observacionesRecepcion: dto.observacionesRecepcion,
    });
    return this.incidenciaRepository.save(incidencia);
  }
  async remove(id) {
    const incidencia = await this.findOne(id);
    if (incidencia.estaResuelta()) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }
    await this.incidenciaRepository.remove(incidencia);
  }
  async resolverIncidencia(id, dto) {
    const incidencia = await this.findOne(id);
    if (incidencia.estaResuelta()) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }
    incidencia.resolver(dto.usuarioId, dto.observacionesResolucion);
    return this.incidenciaRepository.save(incidencia);
  }
  async reportarIncidencia(dto) {
    const recepcion = await this.recepcionRepository.findOne({
      where: {
        id: dto.recepcionId,
      },
    });
    if (!recepcion) {
      throw new _common.NotFoundException(
        _i18nhelper.I18nHelper.getError('RECEPTION_NOT_FOUND')
      );
    }

    recepcion.incidencia = true;
    await this.recepcionRepository.save(recepcion);
    const incidencia = this.incidenciaRepository.create({
      recepcion: {
        id: dto.recepcionId,
      },
      observacionesRecepcion: `Incidencia reportada de tipo: ${dto.tipo}`,
    });
    return this.incidenciaRepository.save(incidencia);
  }
  async resolverIncidenciaTransaccional(id, dto, usuarioId) {
    const incidencia = await this.findOne(id);
    if (incidencia.estaResuelta()) {
      throw new _common.BadRequestException(
        _i18nhelper.I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }
    return await this.dataSource.transaction(async (manager) => {
      const resolucion = manager.create(
        _incidenciaresueltaentity.IncidenciaResuelta,
        {
          incidenciaId: incidencia.id,
          usuarioResolutorId: usuarioId,
          tipoResolucion: dto.accion,
          fechaResolucion: new Date(),
          observaciones: dto.observaciones,
        }
      );
      await manager.save(resolucion);

      if (dto.accion === _incidenciaenums.TipoResolucion.DEVOLUCION) {
        await this.movimientoHelper.createMovimiento(
          usuarioId,
          _movimientoenums.TipoMovimiento.SALIDA_AJUSTE,
          'Incidencia',
          incidencia.id,
          0,
          undefined,
          undefined,
          `Ajuste por resolución de incidencia (${dto.accion}): ${dto.observaciones || ''}`
        );
      }

      incidencia.resolver(usuarioId, dto.observaciones);
      return await manager.save(incidencia);
    });
  }
  constructor(
    incidenciaRepository,
    incidenciaResueltaRepository,
    recepcionRepository,
    dataSource,
    movimientoHelper
  ) {
    this.incidenciaRepository = incidenciaRepository;
    this.incidenciaResueltaRepository = incidenciaResueltaRepository;
    this.recepcionRepository = recepcionRepository;
    this.dataSource = dataSource;
    this.movimientoHelper = movimientoHelper;
  }
};
IncidenciaService = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_param(2, (0, _typeorm1.InjectRepository)(_recepcionentity.Recepcion)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _incidenciarepository.IncidenciaRepository === 'undefined'
        ? Object
        : _incidenciarepository.IncidenciaRepository,
      typeof _incidenciaresueltarepository.IncidenciaResuelaRepository ===
      'undefined'
        ? Object
        : _incidenciaresueltarepository.IncidenciaResuelaRepository,
      typeof _typeorm.Repository === 'undefined' ? Object : _typeorm.Repository,
      typeof _typeorm.DataSource === 'undefined' ? Object : _typeorm.DataSource,
      typeof _movimientohelper.MovimientoHelper === 'undefined'
        ? Object
        : _movimientohelper.MovimientoHelper,
    ]),
  ],
  IncidenciaService
);
