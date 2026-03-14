'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'ProduccionController', {
  enumerable: true,
  get: function () {
    return ProduccionController;
  },
});
const _common = require('@nestjs/common');
const _swagger = require('@nestjs/swagger');
const _produccionservice = require('../service/produccion.service');
const _ejecutarproducciondto = require('../dto/ejecutar-produccion.dto');
const _produccionloteentity = require('../produccion-lote.entity/produccion-lote.entity');
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
let ProduccionController = class ProduccionController {
  ejecutarProduccion(dto, userId) {
    return this.produccionService.ejecutarProduccion(dto, userId);
  }
  findAll() {
    return this.produccionService.findAll();
  }
  findOne(id) {
    return this.produccionService.findOne(id);
  }
  constructor(produccionService) {
    this.produccionService = produccionService;
  }
};
_ts_decorate(
  [
    (0, _common.Post)('ejecutar'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:cocinar'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    (0, _swagger.ApiOperation)({
      summary: 'Ejecutar la producción de una receta y registrar el lote',
    }),
    (0, _swagger.ApiResponse)({
      status: 201,
      type: _produccionloteentity.ProduccionLote,
    }),
    (0, _swagger.ApiResponse)({
      status: 400,
      description: 'docs.STOCK_INSUFICIENTE_OR_RECETA_INV_LIDA',
    }),
    (0, _swagger.ApiResponse)({
      status: 404,
      description: 'docs.RECETA_NO_ENCONTRADA',
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _getuserdecorator.GetUser)('id')),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _ejecutarproducciondto.EjecutarProduccionDto === 'undefined'
        ? Object
        : _ejecutarproducciondto.EjecutarProduccionDto,
      String,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  ProduccionController.prototype,
  'ejecutarProduccion',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:listar'),
    (0, _swagger.ApiOperation)({
      summary: 'Listar todos los lotes de producción',
    }),
    (0, _swagger.ApiResponse)({
      status: 200,
      type: [_produccionloteentity.ProduccionLote],
    }),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', []),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  ProduccionController.prototype,
  'findAll',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recetas:ver'),
    (0, _swagger.ApiOperation)({
      summary: 'Obtener un lote de producción por ID',
    }),
    (0, _swagger.ApiParam)({
      name: 'id',
      description: 'docs.UUID_DEL_LOTE_DE_PRODUCCI_N',
    }),
    (0, _swagger.ApiResponse)({
      status: 200,
      type: _produccionloteentity.ProduccionLote,
    }),
    (0, _swagger.ApiResponse)({
      status: 404,
      description: 'docs.LOTE_NO_ENCONTRADO',
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  ProduccionController.prototype,
  'findOne',
  null
);
ProduccionController = _ts_decorate(
  [
    (0, _swagger.ApiTags)('Producción'),
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    (0, _common.Controller)('produccion'),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _produccionservice.ProduccionService === 'undefined'
        ? Object
        : _produccionservice.ProduccionService,
    ]),
  ],
  ProduccionController
);
