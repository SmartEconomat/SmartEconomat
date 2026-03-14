'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AlertaStockDTO', {
  enumerable: true,
  get: function () {
    return AlertaStockDTO;
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
let AlertaStockDTO = class AlertaStockDTO {};
_ts_decorate(
  [
    (0, _classvalidator.IsUUID)('7', {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DEBE_SER_UN_UUID_V_LIDO'
      ),
    }),
    (0, _classvalidator.IsNotEmpty)({
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_ES_OBLIGATORIO'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  AlertaStockDTO.prototype,
  'id',
  void 0
);
_ts_decorate(
  [
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
  AlertaStockDTO.prototype,
  'cantidadMinima',
  void 0
);
_ts_decorate(
  [
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
  AlertaStockDTO.prototype,
  'cantidadActual',
  void 0
);
