'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'DuplicateRecetaDto', {
  enumerable: true,
  get: function () {
    return DuplicateRecetaDto;
  },
});
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
let DuplicateRecetaDto = class DuplicateRecetaDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      example: '550e8400-e29b-41d4-a716-446655440000',
      description: 'docs.ID_OF_THE_SOURCE_RECIPE_TO_DUPLICATE',
    }),
    (0, _classvalidator.IsUUID)('7'),
    _ts_metadata('design:type', String),
  ],
  DuplicateRecetaDto.prototype,
  'sourceId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      example: 'Paella Vegana',
      description: 'docs.NAME_FOR_THE_NEW_DUPLICATED_RECIPE',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MinLength)(3),
    (0, _classvalidator.MaxLength)(150),
    _ts_metadata('design:type', String),
  ],
  DuplicateRecetaDto.prototype,
  'newName',
  void 0
);
