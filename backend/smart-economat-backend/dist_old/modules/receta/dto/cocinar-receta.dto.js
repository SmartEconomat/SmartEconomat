'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CocinarRecetaDto', {
  enumerable: true,
  get: function () {
    return CocinarRecetaDto;
  },
});
const _swagger = require('@nestjs/swagger');
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
let CocinarRecetaDto = class CocinarRecetaDto {};
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.CANTIDAD_DE_PORCIONES_VECES_A_ELABORAR_D',
      default: 1,
    }),
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    _ts_metadata('design:type', Number),
  ],
  CocinarRecetaDto.prototype,
  'cantidad',
  void 0
);
