'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RolesModule', {
  enumerable: true,
  get: function () {
    return RolesModule;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _rolentity = require('./entities/rol.entity');
const _usuariorolentity = require('./entities/usuario-rol.entity');
const _rolpermisoentity = require('./entities/rol-permiso.entity');
const _rolesservice = require('./service/roles.service');
const _permisosmodule = require('../permisos/permisos.module');
const _usuariomodule = require('../usuario/usuario.module');
const _authorizationmodule = require('../authorization/authorization.module');
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
let RolesModule = class RolesModule {};
RolesModule = _ts_decorate(
  [
    (0, _common.Module)({
      imports: [
        _typeorm.TypeOrmModule.forFeature([
          _rolentity.Rol,
          _usuariorolentity.UsuarioRol,
          _rolpermisoentity.RolPermiso,
        ]),
        _permisosmodule.PermisosModule,
        (0, _common.forwardRef)(() => _usuariomodule.UsuarioModule),
        (0, _common.forwardRef)(() => _authorizationmodule.AuthorizationModule),
      ],
      providers: [_rolesservice.RolesService],
      exports: [_rolesservice.RolesService, _typeorm.TypeOrmModule],
    }),
  ],
  RolesModule
);
