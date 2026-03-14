'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UsuarioModule', {
  enumerable: true,
  get: function () {
    return UsuarioModule;
  },
});
const _common = require('@nestjs/common');
const _typeorm = require('@nestjs/typeorm');
const _usuarioentity = require('./usuario.entity/usuario.entity');
const _usuariocontroller = require('./controller/usuario.controller');
const _usuarioservice = require('./service/usuario.service');
const _usuariorepository = require('./repository/usuario.repository');
const _authmodule = require('../auth/module/auth.module');
const _permisoentity = require('../permisos/entities/permiso.entity');
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
let UsuarioModule = class UsuarioModule {};
UsuarioModule = _ts_decorate(
  [
    (0, _common.Module)({
      imports: [
        _typeorm.TypeOrmModule.forFeature([
          _usuarioentity.Usuario,
          _permisoentity.Permiso,
        ]),
        _authmodule.AuthModule,
        _authorizationmodule.AuthorizationModule,
      ],
      controllers: [_usuariocontroller.UsuarioController],
      providers: [
        _usuarioservice.UsuarioService,
        _usuariorepository.UsuarioRepository,
      ],
      exports: [_usuarioservice.UsuarioService, _typeorm.TypeOrmModule],
    }),
  ],
  UsuarioModule
);
