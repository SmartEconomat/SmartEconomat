'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RecetaController', {
  enumerable: true,
  get: function () {
    return RecetaController;
  },
});
const _common = require('@nestjs/common');
const _swagger = require('@nestjs/swagger');
const _recetaservice = require('../service/receta.service');
const _createrecetadto = require('../dto/create-receta.dto');
const _updaterecetadto = require('../dto/update-receta.dto');
const _duplicaterecetadto = require('../dto/duplicate-receta.dto');
const _cocinarrecetadto = require('../dto/cocinar-receta.dto');
const _recetacostresponsedto = require('../dto/receta-cost-response.dto');
const _recetaentity = require('../receta.entity/receta.entity');
const _jwtauthguard = require('../../auth/guards/jwt-auth.guard');
const _paginationquerydto = require('../../../common/dto/pagination-query.dto');
const _requirepermissionsdecorator = require('../../../common/decorators/require-permissions.decorator');
const _permisosguard = require('../../authorization/guards/permisos.guard');
const _rolesdecorator = require('../../auth/decorators/roles.decorator');
const _usuarioenums = require('../../usuario/enums/usuario.enums');
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
let RecetaController = class RecetaController {
  create(createRecetaDto) {
    return this.recetaService.create(createRecetaDto);
  }
  duplicate(duplicateRecetaDto) {
    return this.recetaService.duplicate(duplicateRecetaDto);
  }
  findAll(query) {
    return this.recetaService.findAll(query);
  }
  findOne(id) {
    return this.recetaService.findOne(id);
  }
  getDetalle(id) {
    return this.recetaService.getDetalle(id);
  }
  calcularEscandallo(id) {
    return this.recetaService.calcularEscandallo(id);
  }
  cocinar(id, cocinarRecetaDto) {
    return this.recetaService.cocinar(id, cocinarRecetaDto);
  }
  recalcularCostes(id) {
    return this.recetaService.recalcularCostes(id);
  }
  update(id, updateRecetaDto) {
    return this.recetaService.update(id, updateRecetaDto);
  }
  remove(id) {
    return this.recetaService.remove(id);
  }
  constructor(recetaService) {
    this.recetaService = recetaService;
  }
};
_ts_decorate(
  [
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:crear'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _createrecetadto.CreateRecetaDto === 'undefined'
        ? Object
        : _createrecetadto.CreateRecetaDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'create',
  null
);
_ts_decorate(
  [
    (0, _common.Post)('duplicate'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:duplicar'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _duplicaterecetadto.DuplicateRecetaDto === 'undefined'
        ? Object
        : _duplicaterecetadto.DuplicateRecetaDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'duplicate',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:listar'),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _paginationquerydto.PaginationQueryDto === 'undefined'
        ? Object
        : _paginationquerydto.PaginationQueryDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'findAll',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:ver'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'findOne',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id/detalle'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:ver'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'getDetalle',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id/escandallo'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:ver'),
    (0, _swagger.ApiOperation)({
      summary: 'Calcular el escandallo (coste) de una receta',
    }),
    (0, _swagger.ApiParam)({
      name: 'id',
      description: 'docs.UUID_DE_LA_RECETA',
    }),
    (0, _swagger.ApiResponse)({
      status: 200,
      type: _recetacostresponsedto.RecetaCostResponseDto,
    }),
    (0, _swagger.ApiResponse)({
      status: 404,
      description: 'docs.RECETA_NO_ENCONTRADA',
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'calcularEscandallo',
  null
);
_ts_decorate(
  [
    (0, _common.Post)(':id/cocinar'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:cocinar'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _cocinarrecetadto.CocinarRecetaDto === 'undefined'
        ? Object
        : _cocinarrecetadto.CocinarRecetaDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'cocinar',
  null
);
_ts_decorate(
  [
    (0, _common.Post)(':id/recalcular-costes'),
    (0, _rolesdecorator.Roles)(
      _usuarioenums.rolUsuario.ADMINISTRADOR,
      _usuarioenums.rolUsuario.PROFESOR
    ),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiOperation)({
      summary: 'Recalcular y guardar el coste unitario estimado de la receta',
    }),
    (0, _swagger.ApiParam)({
      name: 'id',
      description: 'docs.UUID_DE_LA_RECETA',
    }),
    (0, _swagger.ApiResponse)({
      status: 200,
      type: _recetaentity.Receta,
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'recalcularCostes',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:editar'),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updaterecetadto.UpdateRecetaDto === 'undefined'
        ? Object
        : _updaterecetadto.UpdateRecetaDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'update',
  null
);
_ts_decorate(
  [
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:eliminar'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecetaController.prototype,
  'remove',
  null
);
RecetaController = _ts_decorate(
  [
    (0, _swagger.ApiTags)('Recetas'),
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    (0, _common.Controller)('recetas'),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _recetaservice.RecetaService === 'undefined'
        ? Object
        : _recetaservice.RecetaService,
    ]),
  ],
  RecetaController
);
