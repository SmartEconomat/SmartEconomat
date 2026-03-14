'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CreateUbicacionDto', {
  enumerable: true,
  get: function () {
    return CreateUbicacionDto;
  },
});
const _nestjsi18n = require('nestjs-i18n');
const _classvalidator = require('class-validator');
const _classtransformer = require('class-transformer');
const _trimstringtransformer = require('../../../common/transformers/trim-string.transformer');
const _swagger = require('@nestjs/swagger');
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
let CreateUbicacionDto = class CreateUbicacionDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.NOMBRE_DE_LA_UBICACI_N',
      example: 'Almacen A',
    }),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_NOMBRE_DEBE_SER_UNA_CADENA_DE_TEXTO'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_NOMBRE_ES_OBLIGATORIO'
      ),
    }),
    (0, _classvalidator.MaxLength)(150, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_NOMBRE_NO_PUEDE_SUPERAR_LOS_150_CARAC'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateUbicacionDto.prototype,
  'nombre',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.DESCRIPCI_N_DETALLADA',
      example: 'A la vuelta de la esquina',
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE'
      ),
    }),
    (0, _classvalidator.MaxLength)(255, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_DESCRIPCI_N_NO_PUEDE_SUPERAR_LOS_255'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateUbicacionDto.prototype,
  'descripcion',
  void 0
);
