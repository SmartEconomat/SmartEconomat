'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'CreatePermisoDto', {
  enumerable: true,
  get: function () {
    return CreatePermisoDto;
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
let CreatePermisoDto = class CreatePermisoDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.C_DIGO_NICO_DEL_PERMISO_FORMATO_MODULO_A',
      example: 'usuarios:listar',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(100),
    (0, _classvalidator.Matches)(/^[a-z_]+:[a-z_]+$/, {
      message:
        'El código debe tener el formato "modulo:accion" (solo minúsculas y guiones bajos)',
    }),
    _ts_metadata('design:type', String),
  ],
  CreatePermisoDto.prototype,
  'codigo',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.NOMBRE_LEGIBLE_DEL_PERMISO',
      example: 'Listar usuarios',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(150),
    _ts_metadata('design:type', String),
  ],
  CreatePermisoDto.prototype,
  'nombre',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.DESCRIPCI_N_DETALLADA_DEL_PERMISO',
      example: 'Permite ver el listado completo de usuarios del sistema',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', String),
  ],
  CreatePermisoDto.prototype,
  'descripcion',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.M_DULO_O_RECURSO_AL_QUE_PERTENECE',
      example: 'usuarios',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata('design:type', String),
  ],
  CreatePermisoDto.prototype,
  'modulo',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ACCI_N_QUE_REPRESENTA_EL_PERMISO',
      example: 'listar',
    }),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata('design:type', String),
  ],
  CreatePermisoDto.prototype,
  'accion',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.ESTADO_DEL_PERMISO',
      default: true,
    }),
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', Boolean),
  ],
  CreatePermisoDto.prototype,
  'activo',
  void 0
);
