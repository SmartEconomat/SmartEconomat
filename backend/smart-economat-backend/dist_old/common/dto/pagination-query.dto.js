'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'PaginationQueryDto', {
  enumerable: true,
  get: function () {
    return PaginationQueryDto;
  },
});
const _classvalidator = require('class-validator');
const _classtransformer = require('class-transformer');
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
let PaginationQueryDto = class PaginationQueryDto {
  constructor() {
    this.page = 1;
    this.limit = 20;
  }
};
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(() => Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    _ts_metadata('design:type', Number),
  ],
  PaginationQueryDto.prototype,
  'page',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(() => Number),
    (0, _classvalidator.IsInt)(),
    (0, _classvalidator.Min)(1),
    (0, _classvalidator.Max)(100),
    _ts_metadata('design:type', Number),
  ],
  PaginationQueryDto.prototype,
  'limit',
  void 0
);
_ts_decorate(
  [(0, _classvalidator.IsOptional)(), _ts_metadata('design:type', String)],
  PaginationQueryDto.prototype,
  'searchTerm',
  void 0
);
_ts_decorate(
  [(0, _classvalidator.IsOptional)(), _ts_metadata('design:type', String)],
  PaginationQueryDto.prototype,
  'codigoBarras',
  void 0
);
