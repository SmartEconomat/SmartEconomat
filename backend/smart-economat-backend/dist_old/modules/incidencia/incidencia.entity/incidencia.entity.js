'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'Incidencia', {
  enumerable: true,
  get: function () {
    return Incidencia;
  },
});
const _typeorm = require('typeorm');
const _baseentity = require('../../../common/entities/base.entity');
const _usuarioentity = require('../../usuario/usuario.entity/usuario.entity');
const _recepcionentity = require('../../recepcion/recepcion.entity/recepcion.entity');
const _pedidoentity = require('../../pedido/pedido.entity/pedido.entity');
const _incidencialineaentity = require('../incidencia-linea.entity/incidencia-linea.entity');
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
let Incidencia = class Incidencia extends _baseentity.BaseEntity {
  /* --- Métodos de Dominio --- */ /**
   * Marca la incidencia como resuelta, asignando fecha, responsable y observaciones.
   *
   * @param {string} usuarioId - ID del usuario que resuelve.
   * @param {string} [observaciones] - Comentarios opcionales sobre la resolución.
   */ resolver(usuarioId, observaciones) {
    this.fechaResolucion = new Date();
    this.usuarioResolutorId = usuarioId;
    if (observaciones) {
      this.observacionesResolucion = observaciones;
    }
  }
  /**
   * Verifica si la incidencia ya ha sido resuelta.
   * @returns {boolean} True si tiene fecha de resolución.
   */ estaResuelta() {
    return this.fechaResolucion !== null && this.fechaResolucion !== undefined;
  }
};
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'recepcion_id',
    }),
    _ts_metadata('design:type', String),
  ],
  Incidencia.prototype,
  'recepcionId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'pedido_id',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Incidencia.prototype,
  'pedidoId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      name: 'usuario_resolutor_id',
      nullable: true,
    }),
    _ts_metadata('design:type', String),
  ],
  Incidencia.prototype,
  'usuarioResolutorId',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _recepcionentity.Recepcion, {
      onDelete: 'CASCADE',
      nullable: false,
    }),
    (0, _typeorm.JoinColumn)({
      name: 'recepcion_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Incidencia.prototype,
  'recepcion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(() => _pedidoentity.Pedido, {
      onDelete: 'RESTRICT',
      nullable: true,
    }),
    (0, _typeorm.JoinColumn)({
      name: 'pedido_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Incidencia.prototype,
  'pedido',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.ManyToOne)(
      () => _usuarioentity.Usuario,
      (usuario) => usuario.incidenciasResueltas,
      {
        onDelete: 'SET NULL',
        nullable: true,
      }
    ),
    (0, _typeorm.JoinColumn)({
      name: 'usuario_resolutor_id',
    }),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Incidencia.prototype,
  'usuarioResolutor',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.OneToMany)(
      () => _incidencialineaentity.IncidenciaLinea,
      (linea) => linea.incidencia,
      {
        cascade: true,
      }
    ),
    _ts_metadata(
      'design:type',
      typeof Relation === 'undefined' ? Object : Relation
    ),
  ],
  Incidencia.prototype,
  'lineas',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'text',
      nullable: true,
      name: 'observaciones_recepcion',
    }),
    _ts_metadata('design:type', String),
  ],
  Incidencia.prototype,
  'observacionesRecepcion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'text',
      nullable: true,
      name: 'observaciones_resolucion',
    }),
    _ts_metadata('design:type', String),
  ],
  Incidencia.prototype,
  'observacionesResolucion',
  void 0
);
_ts_decorate(
  [
    (0, _typeorm.Column)({
      type: 'timestamptz',
      nullable: true,
      name: 'fecha_resolucion',
    }),
    _ts_metadata('design:type', Object),
  ],
  Incidencia.prototype,
  'fechaResolucion',
  void 0
);
Incidencia = _ts_decorate(
  [
    (0, _typeorm.Entity)({
      name: 'incidencia',
    }),
    (0, _typeorm.Index)(['recepcionId']),
    (0, _typeorm.Index)(['pedidoId']),
    (0, _typeorm.Index)(['usuarioResolutorId']),
  ],
  Incidencia
);
