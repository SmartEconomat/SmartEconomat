'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'IncidenciaDto', {
  enumerable: true,
  get: function () {
    return IncidenciaDto;
  },
});
const _swagger = require('@nestjs/swagger');
const _incidencialineadto = require('./incidencia-linea.dto');
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
let IncidenciaDto = class IncidenciaDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_DE_LA_INCIDENCIA',
    }),
    _ts_metadata('design:type', String),
  ],
  IncidenciaDto.prototype,
  'id',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_DE_LA_RECEPCI_N_DONDE_SE_DETECT',
    }),
    _ts_metadata('design:type', String),
  ],
  IncidenciaDto.prototype,
  'recepcionId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_DEL_PEDIDO_PROVEEDOR_AL_QUE_PERTENECE',
    }),
    _ts_metadata('design:type', String),
  ],
  IncidenciaDto.prototype,
  'pedidoId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.NOMBRE_O_IDENTIFICADOR_DEL_PROVEEDOR',
      required: false,
    }),
    _ts_metadata('design:type', String),
  ],
  IncidenciaDto.prototype,
  'proveedorNombre',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.OBSERVACIONES_GENERALES_AL_MOMENTO_DE_LA',
      required: false,
    }),
    _ts_metadata('design:type', String),
  ],
  IncidenciaDto.prototype,
  'observacionesRecepcion',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.OBSERVACIONES_A_ADIDAS_A_LA_HORA_DE_RESO',
      required: false,
    }),
    _ts_metadata('design:type', String),
  ],
  IncidenciaDto.prototype,
  'observacionesResolucion',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.SI_LA_INCIDENCIA_EST_RESUELTA_O_NO',
    }),
    _ts_metadata('design:type', Boolean),
  ],
  IncidenciaDto.prototype,
  'resuelta',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.FECHA_EN_LA_QUE_FUE_RESUELTA',
      required: false,
    }),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  IncidenciaDto.prototype,
  'fechaResolucion',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      type: [_incidencialineadto.IncidenciaLineaDto],
      description: 'docs.L_NEAS_CON_DISCREPANCIAS',
    }),
    _ts_metadata('design:type', Array),
  ],
  IncidenciaDto.prototype,
  'lineas',
  void 0
);
