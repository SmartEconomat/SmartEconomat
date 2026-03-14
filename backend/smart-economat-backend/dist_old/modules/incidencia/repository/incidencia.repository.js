'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'IncidenciaRepository', {
  enumerable: true,
  get: function () {
    return IncidenciaRepository;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('typeorm');
const _incidenciaentity = require('../incidencia.entity/incidencia.entity');
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
let IncidenciaRepository = class IncidenciaRepository
  extends _typeorm.Repository
{
  findOneWithRelations(id) {
    return this.findOne({
      where: {
        id,
      },
      relations: [
        'recepcion',
        'pedido',
        'usuarioResolutor',
        'lineas',
        'lineas.pedidoProducto',
      ],
    });
  }
  findAllWithRelations() {
    return this.find({
      relations: ['recepcion', 'pedido', 'usuarioResolutor', 'lineas'],
      order: {
        createdAt: 'DESC',
      },
    });
  }
  constructor(dataSource) {
    (super(_incidenciaentity.Incidencia, dataSource.createEntityManager()),
      (this.dataSource = dataSource));
  }
};
IncidenciaRepository = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _typeorm.DataSource === 'undefined' ? Object : _typeorm.DataSource,
    ]),
  ],
  IncidenciaRepository
);
