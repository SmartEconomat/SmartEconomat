'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'PermisosGuard', {
  enumerable: true,
  get: function () {
    return PermisosGuard;
  },
});
const _i18nhelper = require('../../../common/helpers/i18n.helper');
const _common = require('@nestjs/common');
const _core = require('@nestjs/core');
const _requirepermissionsdecorator = require('../../../common/decorators/require-permissions.decorator');
const _publicdecorator = require('../../../common/decorators/public.decorator');
const _authorizationservice = require('../services/authorization.service');
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
let PermisosGuard = class PermisosGuard {
  async canActivate(context) {
    const isPublic = this.reflector.getAllAndOverride(
      _publicdecorator.IS_PUBLIC_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (isPublic) {
      return true;
    }
    const methodPermissions =
      this.reflector.get(
        _requirepermissionsdecorator.PERMISSIONS_KEY,
        context.getHandler()
      ) || [];
    const controllerPermissions =
      this.reflector.get(
        _requirepermissionsdecorator.PERMISSIONS_KEY,
        context.getClass()
      ) || [];
    const requiredPermissions = [
      ...controllerPermissions,
      ...methodPermissions,
    ];
    if (requiredPermissions.length === 0) {
      return true;
    }
    const permissionsMode = this.reflector.getAllAndOverride(
      _requirepermissionsdecorator.PERMISSIONS_MODE_KEY,
      [context.getHandler(), context.getClass()]
    );
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user || !user.id) {
      this.logger.warn(
        'Usuario no autenticado intentando acceder a ruta protegida'
      );
      throw new _common.ForbiddenException(
        _i18nhelper.I18nHelper.getError('USUARIO_NO_AUTENTICADO')
      );
    }
    const hasPermission =
      permissionsMode === 'any'
        ? await this.authorizationService.userHasAnyPermission(
            String(user.id),
            requiredPermissions
          )
        : await this.authorizationService.userHasAllPermissions(
            String(user.id),
            requiredPermissions
          );
    if (!hasPermission) {
      const mode = permissionsMode === 'any' ? 'al menos uno de' : 'todos';
      const message = `No tienes los permisos necesarios. Requiere ${mode}: ${requiredPermissions.join(', ')}`;
      this.logger.warn(
        `Usuario ${user.id} (${user.nombre || 'sin nombre'}) denegado. ${message}`
      );
      throw new _common.ForbiddenException({
        message,
        requiredPermissions,
        mode: permissionsMode || 'all',
      });
    }
    this.logger.debug(
      `Usuario ${user.id} autorizado con permisos: ${requiredPermissions.join(', ')}`
    );
    return true;
  }
  constructor(reflector, authorizationService) {
    this.reflector = reflector;
    this.authorizationService = authorizationService;
    this.logger = new _common.Logger(PermisosGuard.name);
  }
};
PermisosGuard = _ts_decorate(
  [
    (0, _common.Injectable)(),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _core.Reflector === 'undefined' ? Object : _core.Reflector,
      typeof _authorizationservice.AuthorizationService === 'undefined'
        ? Object
        : _authorizationservice.AuthorizationService,
    ]),
  ],
  PermisosGuard
);
