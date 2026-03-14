'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AssignRoleToUserDto', {
  enumerable: true,
  get: function () {
    return AssignRoleToUserDto;
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
let AssignRoleToUserDto = class AssignRoleToUserDto {};
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_DEL_USUARIO_AL_QUE_SE_ASIGNAR_EL_ROL',
      example: 'uuid-usuario',
    }),
    (0, _classvalidator.IsUUID)('7'),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata('design:type', String),
  ],
  AssignRoleToUserDto.prototype,
  'usuarioId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiProperty)({
      description: 'docs.ID_DEL_ROL_A_ASIGNAR',
      example: 'uuid-rol',
    }),
    (0, _classvalidator.IsUUID)('7'),
    (0, _classvalidator.IsNotEmpty)(),
    _ts_metadata('design:type', String),
  ],
  AssignRoleToUserDto.prototype,
  'rolId',
  void 0
);
_ts_decorate(
  [
    (0, _swagger.ApiPropertyOptional)({
      description: 'docs.ESTADO_DE_LA_ASIGNACI_N',
      default: true,
    }),
    (0, _classvalidator.IsBoolean)(),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata('design:type', Boolean),
  ],
  AssignRoleToUserDto.prototype,
  'activo',
  void 0
);
