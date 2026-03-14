'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CancelPedidoDto', {
  enumerable: true,
  get: function () {
    return CancelPedidoDto;
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
let CancelPedidoDto = class CancelPedidoDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsString)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_MOTIVO_DE_CANCELACI_N_DEBE_SER_UNA_CA'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_MOTIVO_DE_CANCELACI_N_ES_OBLIGATORIO'
      ),
    }),
    (0, _classvalidator.MaxLength)(1000, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_MOTIVO_DE_CANCELACI_N_NO_PUEDE_EXCEDE'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CancelPedidoDto.prototype,
  'motivoCancelacion',
  void 0
);
