'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CreateRolDto', {
  enumerable: true,
  get: function () {
    return CreateRolDto;
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
let CreateRolDto = class CreateRolDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.NOMBRE_NICO_DEL_ROL',
      example: 'Administrador de Economato',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata('design:type', String),
  ],
  CreateRolDto.prototype,
  'nombre',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.DESCRIPCI_N_DETALLADA_DEL_ROL',
      example: 'Rol con acceso completo a la gestión del economato',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', String),
  ],
  CreateRolDto.prototype,
  'descripcion',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.INDICA_SI_ES_UN_ROL_DE_SISTEMA_NO_EDITAB',
      default: false,
    }),
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', Boolean),
  ],
  CreateRolDto.prototype,
  'esSistema',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.ESTADO_DEL_ROL',
      default: true,
    }),
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', Boolean),
  ],
  CreateRolDto.prototype,
  'activo',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.IDS_DE_PERMISOS_A_ASIGNAR_AL_ROL',
      example: ['uuid-1', 'uuid-2'],
    }),
    (0, _classvalidator.IsArray)(),
    (0, _classvalidator.IsUUID)('7', {
      each: true,
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', Array),
  ],
  CreateRolDto.prototype,
  'permisoIds',
  void 0
);
