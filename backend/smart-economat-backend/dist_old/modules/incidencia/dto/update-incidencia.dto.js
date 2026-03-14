'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
function _export(target, all) {
  for (var name in all)
    Object.defineProperty(target, name, {
      enumerable: true,
      get: Object.getOwnPropertyDescriptor(all, name).get,
    });
}
_export(exports, {
  get UpdateIncidenciaDto() {
    return UpdateIncidenciaDto;
  },
  get UpdateIncidenciaResuelaDto() {
    return UpdateIncidenciaResuelaDto;
  },
});
const _mappedtypes = require('@nestjs/mapped-types');
const _classtransformer = require('class-transformer');
const _trimstringtransformer = require('../../../common/transformers/trim-string.transformer');
const _createincidenciadto = require('./create-incidencia.dto');
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
let UpdateIncidenciaDto = class UpdateIncidenciaDto extends (0,
_mappedtypes.PartialType)(_createincidenciadto.CreateIncidenciaDto) {};
_ts_decorate(
  [
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    _ts_metadata('design:type', String),
  ],
  UpdateIncidenciaDto.prototype,
  'observacionesRecepcion',
  void 0
);
let UpdateIncidenciaResuelaDto = class UpdateIncidenciaResuelaDto extends (0,
_mappedtypes.PartialType)(_createincidenciadto.CreateIncidenciaResuelaDto) {};
_ts_decorate(
  [
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    _ts_metadata('design:type', String),
  ],
  UpdateIncidenciaResuelaDto.prototype,
  'observaciones',
  void 0
);
