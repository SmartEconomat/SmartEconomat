'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CreateRecepcionProductoDto', {
  enumerable: true,
  get: function () {
    return CreateRecepcionProductoDto;
  },
});
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
let CreateRecepcionProductoDto = class CreateRecepcionProductoDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.IsUUID)('7'),
    _ts_metadata('design:type', String),
  ],
  CreateRecepcionProductoDto.prototype,
  'idRecepcion',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.IsUUID)('7'),
    _ts_metadata('design:type', String),
  ],
  CreateRecepcionProductoDto.prototype,
  'idPedidoProducto',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsNumber)(),
    (0, _classvalidator.Min)(0),
    _ts_metadata('design:type', Number),
  ],
  CreateRecepcionProductoDto.prototype,
  'cantidadRecibida',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  CreateRecepcionProductoDto.prototype,
  'observaciones',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)(),
    _ts_metadata('design:type', String),
  ],
  CreateRecepcionProductoDto.prototype,
  'fechaRecepcion',
  void 0
);
