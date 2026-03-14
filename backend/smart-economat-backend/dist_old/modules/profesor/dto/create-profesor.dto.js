'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CreateProfesorDto', {
  enumerable: true,
  get: function () {
    return CreateProfesorDto;
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
let CreateProfesorDto = class CreateProfesorDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata('design:type', String),
  ],
  CreateProfesorDto.prototype,
  'username',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsString)(),
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
          'validation.LA_CONTRASE_A_DEBE_TENER_AL_MENOS_8_CARA'
        ),
      }
    ),
    _ts_metadata('design:type', String),
  ],
  CreateProfesorDto.prototype,
  'password',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsEmail)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata('design:type', String),
  ],
  CreateProfesorDto.prototype,
  'email',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata('design:type', String),
  ],
  CreateProfesorDto.prototype,
  'cial',
  void 0
);
