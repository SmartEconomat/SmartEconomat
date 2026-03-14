'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UpdatePrecioProductoDto', {
  enumerable: true,
  get: function () {
    return UpdatePrecioProductoDto;
  },
});
const _nestjsi18n = require('nestjs-i18n');
const _classvalidator = require('class-validator');
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
let UpdatePrecioProductoDto = class UpdatePrecioProductoDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.NUEVO_PRECIO_UNITARIO_DEL_PRODUCTO_DEL_P',
      example: 10.5,
    }),
    (0, _classvalidator.IsNumber)(
      {},
      {
        message: (0, _nestjsi18n.i18nValidationMessage)(
          'validation.EL_PRECIO_DEBE_SER_UN_N_MERO_V_LIDO'
        ),
      }
    ),
    (0, _classvalidator.Min)(0, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_PRECIO_NO_PUEDE_SER_NEGATIVO'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_PRECIO_ES_OBLIGATORIO'
      ),
    }),
    _ts_metadata('design:type', Number),
  ],
  UpdatePrecioProductoDto.prototype,
  'nuevoPrecio',
  void 0
);
