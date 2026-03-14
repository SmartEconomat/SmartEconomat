'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ForgotPasswordDto', {
  enumerable: true,
  get: function () {
    return ForgotPasswordDto;
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
let ForgotPasswordDto = class ForgotPasswordDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsNotEmpty)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_EMAIL_ES_REQUERIDO'
      ),
    }),
    (0, _classvalidator.IsEmail)(
      {},
      {
        message: (0, _nestjsi18n.i18nValidationMessage)(
          'validation.DEBE_SER_UN_EMAIL_V_LIDO'
        ),
      }
    ),
    _ts_metadata('design:type', String),
  ],
  ForgotPasswordDto.prototype,
  'email',
  void 0
);
