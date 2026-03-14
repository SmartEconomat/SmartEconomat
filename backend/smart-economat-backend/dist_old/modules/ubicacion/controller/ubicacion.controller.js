'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'UbicacionController', {
  enumerable: true,
  get: function () {
    return UbicacionController;
  },
});
const _common = require('@nestjs/common');
const _pipes = require('../../../common/pipes');
const _ubicacionservice = require('../service/ubicacion.service');
const _createubicaciondto = require('../dto/create-ubicacion.dto');
const _updateubicaciondto = require('../dto/update-ubicacion.dto');
const _jwtauthguard = require('../../auth/guards/jwt-auth.guard');
const _swagger = require('@nestjs/swagger');
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
let UbicacionController = class UbicacionController {
  create(createUbicacionDto) {
    return this.ubicacionService.create(createUbicacionDto);
  }
  findAll() {
    return this.ubicacionService.findAll();
  }
  findOne(id) {
    return this.ubicacionService.findOne(id);
  }
  update(id, updateUbicacionDto) {
    return this.ubicacionService.update(id, updateUbicacionDto);
  }
  remove(id) {
    return this.ubicacionService.remove(id);
  }
  restore(id) {
    return this.ubicacionService.restore(id);
  }
  constructor(ubicacionService) {
    this.ubicacionService = ubicacionService;
  }
};
_ts_decorate(
  [
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('ubicaciones:crear'),
    (0, _swagger.ApiOperation)({
      summary: 'Crear nueva ubicación',
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _createubicaciondto.CreateUbicacionDto === 'undefined'
        ? Object
        : _createubicaciondto.CreateUbicacionDto,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  UbicacionController.prototype,
  'create',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('ubicaciones:listar'),
    (0, _swagger.ApiOperation)({
      summary: 'Obtener todas las ubicaciones',
    }),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', []),
    _ts_metadata('design:returntype', void 0),
  ],
  UbicacionController.prototype,
  'findAll',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('ubicaciones:ver'),
    (0, _swagger.ApiOperation)({
      summary: 'Obtener ubicación por ID',
    }),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UbicacionController.prototype,
  'findOne',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('ubicaciones:editar'),
    (0, _swagger.ApiOperation)({
      summary: 'Actualizar una ubicación',
    }),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updateubicaciondto.UpdateUbicacionDto === 'undefined'
        ? Object
        : _updateubicaciondto.UpdateUbicacionDto,
    ]),
    _ts_metadata('design:returntype', void 0),
  ],
  UbicacionController.prototype,
  'update',
  null
);
_ts_decorate(
  [
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)(
      'ubicaciones:eliminar'
    ),
    (0, _swagger.ApiOperation)({
      summary: 'Eliminar una ubicación lógica',
    }),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UbicacionController.prototype,
  'remove',
  null
);
_ts_decorate(
  [
    (0, _common.Post)(':id/restore'),
    (0, _requirepermissionsdecorator.RequirePermissions)(
      'ubicaciones:restaurar'
    ),
    (0, _swagger.ApiOperation)({
      summary: 'Restaurar una ubicación eliminada',
    }),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata('design:returntype', void 0),
  ],
  UbicacionController.prototype,
  'restore',
  null
);
UbicacionController = _ts_decorate(
  [
    (0, _swagger.ApiTags)('Ubicaciones'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    (0, _common.Controller)('ubicacion'),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _ubicacionservice.UbicacionService === 'undefined'
        ? Object
        : _ubicacionservice.UbicacionService,
    ]),
  ],
  UbicacionController
);
