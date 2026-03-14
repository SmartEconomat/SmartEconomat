'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UpdateUsuarioDto', {
  enumerable: true,
  get: function () {
    return UpdateUsuarioDto;
  },
});
const _nestjsi18n = require('nestjs-i18n');
const _classvalidator = require('class-validator');
const _classtransformer = require('class-transformer');
const _usuarioenums = require('../enums/usuario.enums');
const _trimstringtransformer = require('../../../common/transformers/trim-string.transformer');
const _lowercasestringtransformer = require('../../../common/transformers/lowercase-string.transformer');
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
let UpdateUsuarioDto = class UpdateUsuarioDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_NOMBRE_DE_USUARIO_DEBE_SER_UNA_CADENA'
      ),
    }),
    (0, _classvalidator.MaxLength)(100, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_NOMBRE_DE_USUARIO_NO_PUEDE_EXCEDER_LO'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  UpdateUsuarioDto.prototype,
  'username',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.ValidateIf)((o) => o.email != null),
    (0, _classtransformer.Transform)(
      _lowercasestringtransformer.LowercaseStringTransformer.transform
    ),
    (0, _classvalidator.IsEmail)(
      {},
      {
        message: (0, _nestjsi18n.i18nValidationMessage)(
          'validation.INVALID_EMAIL'
        ),
      }
    ),
    (0, _classvalidator.MaxLength)(255, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_CORREO_ELECTR_NICO_NO_PUEDE_EXCEDER_L'
      ),
    }),
    _ts_metadata('design:type', Object),
  ],
  UpdateUsuarioDto.prototype,
  'email',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_usuarioenums.rolUsuario),
    _ts_metadata(
      'design:type',
      typeof _usuarioenums.rolUsuario === 'undefined'
        ? Object
        : _usuarioenums.rolUsuario
    ),
  ],
  UpdateUsuarioDto.prototype,
  'rol',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_usuarioenums.UserStatus),
    _ts_metadata(
      'design:type',
      typeof _usuarioenums.UserStatus === 'undefined'
        ? Object
        : _usuarioenums.UserStatus
    ),
  ],
  UpdateUsuarioDto.prototype,
  'status',
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
        'validation.EL_CIAL_DEBE_SER_UNA_CADENA_DE_TEXTO'
      ),
    }),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata('design:type', String),
  ],
  UpdateUsuarioDto.prototype,
  'cialProfesor',
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
        'validation.EL_N_MERO_DE_CLASE_DEBE_SER_UNA_CADENA_D'
      ),
    }),
    (0, _classvalidator.MaxLength)(10),
    _ts_metadata('design:type', String),
  ],
  UpdateUsuarioDto.prototype,
  'numeroClase',
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
        'validation.EL_AULA_DEBE_SER_UNA_CADENA_DE_TEXTO'
      ),
    }),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata('design:type', String),
  ],
  UpdateUsuarioDto.prototype,
  'aula',
  void 0
);
