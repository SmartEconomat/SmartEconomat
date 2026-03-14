'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProfesorController', {
  enumerable: true,
  get: function () {
    return ProfesorController;
  },
});
const _common = require('@nestjs/common');
const _jwtauthguard = require('../../auth/guards/jwt-auth.guard');
const _profesorservice = require('../service/profesor.service');
const _createslotdto = require('../dto/create-slot.dto');
const _createprofesordto = require('../dto/create-profesor.dto');
const _requirepermissionsdecorator = require('../../../common/decorators/require-permissions.decorator');
const _permisosguard = require('../../authorization/guards/permisos.guard');
const _getuserdecorator = require('../../auth/decorators/get-user.decorator');
const _publicdecorator = require('../../../common/decorators/public.decorator');
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
let ProfesorController = class ProfesorController {
  async register(dto) {
    return this.profesorService.register(dto);
  }
  async createSlot(userId, dto) {
    return this.profesorService.createSlot(userId, dto);
  }
  async activateAlumno(profesorUserId, alumnoId) {
    return this.profesorService.activateAlumno(profesorUserId, alumnoId);
  }
  async getAlumnos(profesorUserId) {
    return this.profesorService.getAlumnos(profesorUserId);
  }
  async forcePasswordReset(profesorUserId, alumnoId) {
    return this.profesorService.forcePasswordReset(profesorUserId, alumnoId);
  }
  constructor(profesorService) {
    this.profesorService = profesorService;
  }
};
_ts_decorate(
  [
    (0, _common.Post)('register'),
    (0, _publicdecorator.Public)(),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _createprofesordto.CreateProfesorDto === 'undefined'
        ? Object
        : _createprofesordto.CreateProfesorDto,
    ]),
    _ts_metadata('design:returntype', Promise),
  ],
  ProfesorController.prototype,
  'register',
  null
);
_ts_decorate(
  [
    (0, _common.Post)('slots'),
    (0, _requirepermissionsdecorator.RequirePermissions)(
      'profesor:gestionar_slots'
    ),
    _ts_param(0, (0, _getuserdecorator.GetUser)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _createslotdto.CreateSlotDto === 'undefined'
        ? Object
        : _createslotdto.CreateSlotDto,
    ]),
    _ts_metadata('design:returntype', Promise),
  ],
  ProfesorController.prototype,
  'createSlot',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)('alumnos/:id/activate'),
    (0, _requirepermissionsdecorator.RequirePermissions)(
      'profesor:gestionar_alumnos'
    ),
    _ts_param(0, (0, _getuserdecorator.GetUser)('id')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String, String]),
    _ts_metadata('design:returntype', Promise),
  ],
  ProfesorController.prototype,
  'activateAlumno',
  null
);
_ts_decorate(
  [
    (0, _common.Get)('alumnos'),
    (0, _requirepermissionsdecorator.RequirePermissions)(
      'profesor:ver_alumnos'
    ),
    _ts_param(0, (0, _getuserdecorator.GetUser)('id')),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', Promise),
  ],
  ProfesorController.prototype,
  'getAlumnos',
  null
);
_ts_decorate(
  [
    (0, _common.Post)('alumnos/:id/force-reset'),
    (0, _requirepermissionsdecorator.RequirePermissions)(
      'profesor:gestionar_alumnos'
    ),
    _ts_param(0, (0, _getuserdecorator.GetUser)('id')),
    _ts_param(1, (0, _common.Param)('id')),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String, String]),
    _ts_metadata('design:returntype', Promise),
  ],
  ProfesorController.prototype,
  'forcePasswordReset',
  null
);
ProfesorController = _ts_decorate(
  [
    (0, _common.Controller)('profesores'),
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _profesorservice.ProfesorService === 'undefined'
        ? Object
        : _profesorservice.ProfesorService,
    ]),
  ],
  ProfesorController
);
