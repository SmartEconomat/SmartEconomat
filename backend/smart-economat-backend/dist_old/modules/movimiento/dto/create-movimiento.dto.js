'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CreateMovimientoDto', {
  enumerable: true,
  get: function () {
    return CreateMovimientoDto;
  },
});
const _nestjsi18n = require('nestjs-i18n');
const _classvalidator = require('class-validator');
const _classtransformer = require('class-transformer');
const _movimientoenums = require('../enums/movimiento.enums');
const _trimstringtransformer = require('../../../common/transformers/trim-string.transformer');
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
let CreateMovimientoDto = class CreateMovimientoDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsEnum)(_movimientoenums.TipoMovimiento, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO'
      ),
    }),
    _ts_metadata(
      'design:type',
      typeof _movimientoenums.TipoMovimiento === 'undefined'
        ? Object
        : _movimientoenums.TipoMovimiento
    ),
  ],
  CreateMovimientoDto.prototype,
  'tipo',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsInt)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_CANTIDAD_DEBE_SER_UN_N_MERO_ENTERO'
      ),
    }),
    (0, _classvalidator.Min)(0, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_CANTIDAD_NO_PUEDE_SER_NEGATIVA'
      ),
    }),
    _ts_metadata('design:type', Number),
  ],
  CreateMovimientoDto.prototype,
  'cantidad',
  void 0
);
_ts_decorate(
  [
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_TIPO_DE_ENTIDAD_DEBE_SER_UNA_CADENA_D'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateMovimientoDto.prototype,
  'entidadTipo',
  void 0
);
_ts_decorate(
  [
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DE_ENTIDAD_DEBE_SER_UNA_CADENA_DE'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateMovimientoDto.prototype,
  'entidadId',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE'
      ),
    }),
    (0, _classvalidator.MaxLength)(1000, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateMovimientoDto.prototype,
  'descripcion',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsUUID)('7', {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DEL_INVENTARIO_DEBE_SER_UN_UUID_V'
      ),
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', String),
  ],
  CreateMovimientoDto.prototype,
  'inventario',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsUUID)('7', {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID'
      ),
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', String),
  ],
  CreateMovimientoDto.prototype,
  'usuario',
  void 0
);
