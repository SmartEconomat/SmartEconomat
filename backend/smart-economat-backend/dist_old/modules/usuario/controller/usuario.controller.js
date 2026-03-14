'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UsuarioController', {
  enumerable: true,
  get: function () {
    return UsuarioController;
  },
});
const _common = require('@nestjs/common');
const _paginationquerydto = require('../../../common/dto/pagination-query.dto');
const _usuarioservice = require('../service/usuario.service');
const _updateusuariodto = require('../dto/update-usuario.dto');
const _swagger = require('@nestjs/swagger');
const _updatestatusdto = require('../dto/update-status.dto');
const _updateroldto = require('../dto/update-rol.dto');
const _resetpassworddto = require('../dto/reset-password.dto');
const _changepassworddto = require('../dto/change-password.dto');
const _jwtauthguard = require('../../auth/guards/jwt-auth.guard');
const _getuserdecorator = require('../../auth/decorators/get-user.decorator');
const _requirepermissionsdecorator = require('../../../common/decorators/require-permissions.decorator');
const _permisosguard = require('../../authorization/guards/permisos.guard');
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
function _ts_param(paramIndex, decorator) {
  return function (target, key) {
    decorator(target, key, paramIndex);
  };
}
let UsuarioController = class UsuarioController {
  getPerfil(id) {
    return this.usuarioService.findOne(id);
  }
  updatePerfil(id, dto) {
    return this.usuarioService.update(id, dto);
  }
  changePassword(id, dto) {
    return this.usuarioService.changePassword(id, dto);
  }
  findAll(query) {
    return this.usuarioService.findAll(query);
  }
  findOne(id) {
    return this.usuarioService.findOne(id);
  }
  update(id, dto) {
    return this.usuarioService.update(id, dto);
  }
  updateStatus(id, dto) {
    return this.usuarioService.update(id, dto);
  }
  updateRol(id, dto) {
    return this.usuarioService.update(id, dto);
  }
  updatePassword(id, dto) {
    return this.usuarioService.resetPassword(id, dto);
  }
  remove(id) {
    return this.usuarioService.remove(id);
  }
  addAdditionalPermission(id, permisoId) {
    return this.usuarioService.addAdditionalPermission(id, permisoId);
  }
  removeAdditionalPermission(id, permisoId) {
    return this.usuarioService.removeAdditionalPermission(id, permisoId);
  }
  addExcludedPermission(id, permisoId) {
    return this.usuarioService.addExcludedPermission(id, permisoId);
  }
  removeExcludedPermission(id, permisoId) {
    return this.usuarioService.removeExcludedPermission(id, permisoId);
  }
  constructor(usuarioService) {
    this.usuarioService = usuarioService;
  }
};
_ts_decorate(
  [
    (0, _common.Get)('perfil'),
    _ts_param(0, (0, _getuserdecorator.GetUser)('id')),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'getPerfil',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)('perfil'),
    _ts_param(0, (0, _getuserdecorator.GetUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updateusuariodto.UpdateUsuarioDto === 'undefined'
        ? Object
        : _updateusuariodto.UpdateUsuarioDto,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'updatePerfil',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)('perfil/password'),
    _ts_param(0, (0, _getuserdecorator.GetUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _changepassworddto.ChangePasswordDto === 'undefined'
        ? Object
        : _changepassworddto.ChangePasswordDto,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'changePassword',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:listar'),
    (0, _swagger.ApiQuery)({
      name: 'page',
      required: false,
      type: Number,
    }),
    (0, _swagger.ApiQuery)({
      name: 'limit',
      required: false,
      type: Number,
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _paginationquerydto.PaginationQueryDto === 'undefined'
        ? Object
        : _paginationquerydto.PaginationQueryDto,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'findAll',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:ver'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'findOne',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:editar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updateusuariodto.UpdateUsuarioDto === 'undefined'
        ? Object
        : _updateusuariodto.UpdateUsuarioDto,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'update',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id/activar'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:editar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updatestatusdto.UpdateUsuarioStatusDto === 'undefined'
        ? Object
        : _updatestatusdto.UpdateUsuarioStatusDto,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'updateStatus',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id/rol'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:editar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updateroldto.UpdateUsuarioRolDto === 'undefined'
        ? Object
        : _updateroldto.UpdateUsuarioRolDto,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'updateRol',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id/password'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:editar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _resetpassworddto.ResetPasswordDto === 'undefined'
        ? Object
        : _resetpassworddto.ResetPasswordDto,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'updatePassword',
  null
);
_ts_decorate(
  [
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:eliminar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'remove',
  null
);
_ts_decorate(
  [
    (0, _common.Post)(':id/permisos-adicionales/:permisoId'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:editar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Param)('permisoId', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String, String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'addAdditionalPermission',
  null
);
_ts_decorate(
  [
    (0, _common.Delete)(':id/permisos-adicionales/:permisoId'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:editar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Param)('permisoId', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String, String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'removeAdditionalPermission',
  null
);
_ts_decorate(
  [
    (0, _common.Post)(':id/permisos-excluidos/:permisoId'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:editar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Param)('permisoId', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String, String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'addExcludedPermission',
  null
);
_ts_decorate(
  [
    (0, _common.Delete)(':id/permisos-excluidos/:permisoId'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:editar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Param)('permisoId', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String, String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UsuarioController.prototype,
  'removeExcludedPermission',
  null
);
UsuarioController = _ts_decorate(
  [
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    (0, _common.Controller)('usuarios'),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _usuarioservice.UsuarioService === 'undefined'
        ? Object
        : _usuarioservice.UsuarioService,
    ]),
  ],
  UsuarioController
);
