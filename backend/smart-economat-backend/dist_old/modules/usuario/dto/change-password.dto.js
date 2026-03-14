'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ChangePasswordDto', {
  enumerable: true,
  get: function () {
    return ChangePasswordDto;
  },
});
const _nestjsi18n = require('nestjs-i18n');
const _classvalidator = require('class-validator');
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
let ChangePasswordDto = class ChangePasswordDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsString)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_CONTRASE_A_ACTUAL_ES_OBLIGATORIA'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata('design:type', String),
  ],
  ChangePasswordDto.prototype,
  'oldPassword',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsString)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.LA_NUEVA_CONTRASE_A_DEBE_SER_UNA_CADENA'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.IsStrongPassword)(
      {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      },
      {
        message: (0, _nestjsi18n.i18nValidationMessage)(
          'validation.LA_NUEVA_CONTRASE_A_DEBE_TENER_AL_MENOS'
        ),
      }
    ),
    _ts_metadata('design:type', String),
  ],
  ChangePasswordDto.prototype,
  'newPassword',
  void 0
);
