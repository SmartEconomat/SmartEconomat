'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CreateInventarioItemDto', {
  enumerable: true,
  get: function () {
    return CreateInventarioItemDto;
  },
});
const _nestjsi18n = require('nestjs-i18n');
const _classvalidator = require('class-validator');
const _classtransformer = require('class-transformer');
const _stringtodatetransformer = require('../../../common/transformers/string-to-date.transformer');
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
let CreateInventarioItemDto = class CreateInventarioItemDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsUUID)('7', {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_DEBE_SER_UN'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DEL_PRODUCTO_PROVEEDOR_ES_OBLIGATO'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateInventarioItemDto.prototype,
  'productoProveedorId',
  void 0
);
_ts_decorate(
  [
    (0, _classtransformer.Type)(() => Number),
    (0, _classvalidator.IsNumber)(
      {},
      {
        message: (0, _nestjsi18n.i18nValidationMessage)(
          'validation.LA_CANTIDAD_ACTUAL_DEBE_SER_UN_N_MERO'
        ),
      }
    ),
    (0, _classvalidator.Min)(0, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_CANTIDAD_ACTUAL_NO_PUEDE_SER_NEGATIVA'
      ),
    }),
    _ts_metadata('design:type', Number),
  ],
  CreateInventarioItemDto.prototype,
  'cantidadActual',
  void 0
);
_ts_decorate(
  [
    (0, _classtransformer.Type)(() => Number),
    (0, _classvalidator.IsNumber)(
      {},
      {
        message: (0, _nestjsi18n.i18nValidationMessage)(
          'validation.LA_CANTIDAD_M_NIMA_DEBE_SER_UN_N_MERO'
        ),
      }
    ),
    (0, _classvalidator.Min)(0, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_CANTIDAD_M_NIMA_NO_PUEDE_SER_NEGATIVA'
      ),
    }),
    _ts_metadata('design:type', Number),
  ],
  CreateInventarioItemDto.prototype,
  'cantidadMinima',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(() => Number),
    (0, _classvalidator.IsNumber)(
      {},
      {
        message: (0, _nestjsi18n.i18nValidationMessage)(
          'validation.LA_CANTIDAD_M_XIMA_DEBE_SER_UN_N_MERO'
        ),
      }
    ),
    (0, _classvalidator.Min)(0, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_CANTIDAD_M_XIMA_NO_PUEDE_SER_NEGATIVA'
      ),
    }),
    _ts_metadata('design:type', Number),
  ],
  CreateInventarioItemDto.prototype,
  'cantidadMaxima',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsUUID)('7', {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DE_LA_UBICACI_N_DEBE_SER_UN_UUID_V'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DE_LA_UBICACI_N_ES_OBLIGATORIO'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateInventarioItemDto.prototype,
  'ubicacionId',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _stringtodatetransformer.StringToDateTransformer.transform
    ),
    (0, _classtransformer.Type)(() => Date),
    (0, _classvalidator.IsDateString)(
      {},
      {
        message: (0, _nestjsi18n.i18nValidationMessage)(
          'validation.LA_FECHA_DE_CADUCIDAD_DEBE_SER_UNA_FECHA'
        ),
      }
    ),
    _ts_metadata('design:type', String),
  ],
  CreateInventarioItemDto.prototype,
  'fechaCaducidad',
  void 0
);
