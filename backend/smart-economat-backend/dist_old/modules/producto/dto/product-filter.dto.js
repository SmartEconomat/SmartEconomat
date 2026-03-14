'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProductFilterDto', {
  enumerable: true,
  get: function () {
    return ProductFilterDto;
  },
});
const _classvalidator = require('class-validator');
const _classtransformer = require('class-transformer');
const _paginationquerydto = require('../../../common/dto/pagination-query.dto');
const _productoenums = require('../enums/producto.enums');
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
let ProductFilterDto = class ProductFilterDto
  extends _paginationquerydto.PaginationQueryDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsBoolean)(),
    (0, _classtransformer.Transform)(({ value }) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return value;
    }),
    _ts_metadata('design:type', Boolean),
  ],
  ProductFilterDto.prototype,
  'minStock',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsEnum)(_productoenums.Alergeno, {
      each: true,
    }),
    (0, _classtransformer.Transform)(({ value }) =>
      Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',')
          : []
    ),
    _ts_metadata('design:type', Array),
  ],
  ProductFilterDto.prototype,
  'alergenos',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsEnum)(_productoenums.TipoProducto, {
      each: true,
    }),
    (0, _classtransformer.Transform)(({ value }) =>
      Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',')
          : []
    ),
    _ts_metadata('design:type', Array),
  ],
  ProductFilterDto.prototype,
  'categorias',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsString)({
      each: true,
    }),
    (0, _classtransformer.Transform)(({ value }) =>
      Array.isArray(value)
        ? value
        : typeof value === 'string'
          ? value.split(',')
          : []
    ),
    _ts_metadata('design:type', Array),
  ],
  ProductFilterDto.prototype,
  'marcas',
  void 0
);
