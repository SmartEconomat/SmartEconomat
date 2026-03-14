'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CreateProductoAlergenoDto', {
  enumerable: true,
  get: function () {
    return CreateProductoAlergenoDto;
  },
});
const _nestjsi18n = require('nestjs-i18n');
const _classvalidator = require('class-validator');
const _productoenums = require('../../enums/producto.enums');
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
let CreateProductoAlergenoDto = class CreateProductoAlergenoDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsUUID)('7', {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DEL_PRODUCTO_DEBE_SER_UN_UUID_V_LI'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DEL_PRODUCTO_ES_OBLIGATORIO'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateProductoAlergenoDto.prototype,
  'idProducto',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsEnum)(_productoenums.Alergeno, {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_AL_RGENO_INDICADO_NO_ES_V_LIDO'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_AL_RGENO_ES_OBLIGATORIO'
      ),
    }),
    _ts_metadata(
      'design:type',
      typeof _productoenums.Alergeno === 'undefined'
        ? Object
        : _productoenums.Alergeno
    ),
  ],
  CreateProductoAlergenoDto.prototype,
  'alergeno',
  void 0
);
