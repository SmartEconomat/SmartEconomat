'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CreatePlantillaDto', {
  enumerable: true,
  get: function () {
    return CreatePlantillaDto;
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
let CreatePlantillaDto = class CreatePlantillaDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.NOMBRE_NICO_DE_LA_PLANTILLA',
      example: 'GESTOR',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata('design:type', String),
  ],
  CreatePlantillaDto.prototype,
  'nombre',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.DESCRIPCI_N_DE_LA_PLANTILLA',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', String),
  ],
  CreatePlantillaDto.prototype,
  'descripcion',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.INDICA_SI_LA_PLANTILLA_ES_EDITABLE',
      default: true,
    }),
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', Boolean),
  ],
  CreatePlantillaDto.prototype,
  'esEditable',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.ID_DE_LA_PLANTILLA_PADRE_HERENCIA',
    }),
    (0, _classvalidator.IsUUID)('7'),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', String),
  ],
  CreatePlantillaDto.prototype,
  'plantillaPadreId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.IDS_DE_PERMISOS_DE_LA_PLANTILLA',
    }),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsUUID)('7', {
      each: true,
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', Array),
  ],
  CreatePlantillaDto.prototype,
  'permisoIds',
  void 0
);
