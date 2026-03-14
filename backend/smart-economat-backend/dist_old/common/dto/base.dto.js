'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'BaseDto', {
  enumerable: true,
  get: function () {
    return BaseDto;
  },
});
const _classtransformer = require('class-transformer');
const _trimstringtransformer = require('../transformers/trim-string.transformer');
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
let BaseDto = class BaseDto {
  /**
   * Aplica trim a todos los campos string de la instancia
   */ normalizeStrings() {}
};
_ts_decorate(
  [
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', []),
    _ts_metadata('design:returntype', void 0),
  ],
  BaseDto.prototype,
  'normalizeStrings',
  null
);
