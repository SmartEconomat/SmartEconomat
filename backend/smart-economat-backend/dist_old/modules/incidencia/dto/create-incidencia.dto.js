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
  get CreateIncidenciaDto() {
    return CreateIncidenciaDto;
  },
  get CreateIncidenciaResuelaDto() {
    return CreateIncidenciaResuelaDto;
  },
});
const _nestjsi18n = require('nestjs-i18n');
const _classvalidator = require('class-validator');
const _classtransformer = require('class-transformer');
const _trimstringtransformer = require('../../../common/transformers/trim-string.transformer');
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
let CreateIncidenciaDto = class CreateIncidenciaDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsUUID)('7', {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DE_LA_RECEPCI_N_DEBE_SER_UN_UUID_V'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateIncidenciaDto.prototype,
  'recepcionId',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)('7'),
    _ts_metadata('design:type', String),
  ],
  CreateIncidenciaDto.prototype,
  'pedidoId',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  CreateIncidenciaDto.prototype,
  'observacionesRecepcion',
  void 0
);
let CreateIncidenciaResuelaDto = class CreateIncidenciaResuelaDto {};
_ts_decorate(
  [
    (0, _classvalidator.IsUUID)('7', {
      message: (0, _nestjsi18n.i18nValidationMessage)(
        'validation.EL_ID_DE_LA_INCIDENCIA_DEBE_SER_UN_UUID'
      ),
    }),
    _ts_metadata('design:type', String),
  ],
  CreateIncidenciaResuelaDto.prototype,
  'idIncidencia',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsUUID)('7'),
    _ts_metadata('design:type', String),
  ],
  CreateIncidenciaResuelaDto.prototype,
  'idUsuarioResolutor',
  void 0
);
_ts_decorate(
  [
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(
      _trimstringtransformer.TrimStringTransformer.transform
    ),
    (0, _classvalidator.IsString)(),
    _ts_metadata('design:type', String),
  ],
  CreateIncidenciaResuelaDto.prototype,
  'observaciones',
  void 0
);
