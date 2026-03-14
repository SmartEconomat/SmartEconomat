'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'AdminController', {
  enumerable: true,
  get: function () {
    return AdminController;
  },
});
const _common = require('@nestjs/common');
const _jwtauthguard = require('../../auth/guards/jwt-auth.guard');
const _adminservice = require('../service/admin.service');
const _createprofesordto = require('../../profesor/dto/create-profesor.dto');
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
let AdminController = class AdminController {
  async createProfesor(dto) {
    return this.adminService.createProfesor(dto);
  }
  async activateUser(userId) {
    return this.adminService.activateUser(userId);
  }
  async forcePasswordReset(userId) {
    return this.adminService.forcePasswordReset(userId);
  }
  constructor(adminService) {
    this.adminService = adminService;
  }
};
_ts_decorate(
  [
    (0, _common.Post)('profesores'),
    (0, _requirepermissionsdecorator.RequirePermissions)('usuarios:crear'),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _createprofesordto.CreateProfesorDto === 'undefined'
        ? Object
        : _createprofesordto.CreateProfesorDto,
    ]),
    _ts_metadata('design:returntype', Promise),
  ],
  AdminController.prototype,
  'createProfesor',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)('users/:id/activate'),
    (0, _requirepermissionsdecorator.RequirePermissions)(
      'usuarios:activar_desactivar'
    ),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', Promise),
  ],
  AdminController.prototype,
  'activateUser',
  null
);
_ts_decorate(
  [
    (0, _common.Post)('users/:id/force-reset'),
    (0, _requirepermissionsdecorator.RequirePermissions)(
      'usuarios:resetear_password'
    ),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', Promise),
  ],
  AdminController.prototype,
  'forcePasswordReset',
  null
);
AdminController = _ts_decorate(
  [
    (0, _common.Controller)('admin'),
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _adminservice.AdminService === 'undefined'
        ? Object
        : _adminservice.AdminService,
    ]),
  ],
  AdminController
);
