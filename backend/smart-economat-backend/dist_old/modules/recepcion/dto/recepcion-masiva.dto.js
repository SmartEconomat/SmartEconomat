'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get RecepcionMasivaLoteDto() {
    return RecepcionMasivaLoteDto;
  },
  get RecepcionMasivaProductoDto() {
    return RecepcionMasivaProductoDto;
  },
});
const _classvalidator = require('class-validator');
const _classtransformer = require('class-transformer');
const _swagger = require('@nestjs/swagger');
const _estadovisualenum = require('../enums/estado-visual.enum');
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
let RecepcionMasivaProductoDto = class RecepcionMasivaProductoDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_DE_LA_L_NEA_ORIGINAL_DE_PEDIDOPRODUCT',
      example: 'uuid-string',
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  RecepcionMasivaProductoDto.prototype,
  'pedidoProductoId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.CANTIDAD_CONTADA_Y_RECIBIDA_POR_EL_OPERA',
      example: 10,
      minimum: 0,
    }),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata('design:type', Number),
  ],
  RecepcionMasivaProductoDto.prototype,
  'cantidadRecibida',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.CANTIDAD_REFLEJADA_EN_EL_ALBAR_N_F_SICO',
      example: 10,
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata('design:type', Number),
  ],
  RecepcionMasivaProductoDto.prototype,
  'cantidadAlbaran',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.INDICA_SI_EL_PESO_FUE_CAPTURADO_POR_B_SC',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    _ts_metadata('design:type', Boolean),
  ],
  RecepcionMasivaProductoDto.prototype,
  'isWeighedWithScale',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ESTADO_EXTERIOR_VISUAL_CON_EL_QUE_LLEGA',
      enum: _estadovisualenum.EstadoVisualProducto,
      example: _estadovisualenum.EstadoVisualProducto.OPTIMO,
    }),
    (0, _classvalidator.IsEnum)(_estadovisualenum.EstadoVisualProducto),
    _ts_metadata(
      'design:type',
      typeof _estadovisualenum.EstadoVisualProducto === 'undefined'
        ? Object
        : _estadovisualenum.EstadoVisualProducto
    ),
  ],
  RecepcionMasivaProductoDto.prototype,
  'estadoVisual',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.FECHA_DE_CADUCIDAD_DEL_LOTE_F_SICO_RECIB',
      example: '2026-10-15T00:00:00.000Z',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(() => Date),
    _ts_metadata('design:type', typeof Date === 'undefined' ? Object : Date),
  ],
  RecepcionMasivaProductoDto.prototype,
  'fechaCaducidad',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.OBSERVACIONES_EXTRA_PARA_ESTA_L_NEA_EN_C',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  RecepcionMasivaProductoDto.prototype,
  'observaciones',
  void 0
);
let RecepcionMasivaLoteDto = class RecepcionMasivaLoteDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.UUID_DEL_PEDIDO_QUE_SE_EST_RECEPCIONANDO',
    }),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  RecepcionMasivaLoteDto.prototype,
  'pedidoId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.FIRMA_U_OBSERVACIONES_GENERALES_DEL_LOTE',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  RecepcionMasivaLoteDto.prototype,
  'observaciones',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.N_MERO_DE_ALBAR_N_ENTREGADO_POR_EL_TRANS',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  RecepcionMasivaLoteDto.prototype,
  'nAlbaran',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.LISTADO_DE_TODOS_LOS_PRODUCTOS_Y_CANTIDA',
      type: [RecepcionMasivaProductoDto],
    }),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.ValidateNested)({
      each: true,
    }),
    (0, _classtransformer.Type)(() => RecepcionMasivaProductoDto),
    _ts_metadata('design:type', Array),
  ],
  RecepcionMasivaLoteDto.prototype,
  'productosRecibidos',
  void 0
);
