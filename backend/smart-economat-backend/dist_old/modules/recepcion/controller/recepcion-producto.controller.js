'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'RecepcionProductoController', {
  enumerable: true,
  get: function () {
    return RecepcionProductoController;
  },
});
const _common = require('@nestjs/common');
const _pipes = require('../../../common/pipes');
const _recepcionproductoservice = require('../service/recepcion-producto.service');
const _createrecepcionproductodto = require('../dto/create-recepcion-producto.dto');
const _updaterecepcionproductodto = require('../dto/update-recepcion-producto.dto');
const _jwtauthguard = require('../../auth/guards/jwt-auth.guard');
const _paginationquerydto = require('../../../common/dto/pagination-query.dto');
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
let RecepcionProductoController = class RecepcionProductoController {
  create(dto) {
    return this.recepcionProductoService.create(dto);
  }
  findAll(query) {
    return this.recepcionProductoService.findAll(query);
  }
  findOne(id) {
    return this.recepcionProductoService.findOne(id);
  }
  update(id, dto) {
    return this.recepcionProductoService.update(id, dto);
  }
  remove(id) {
    return this.recepcionProductoService.remove(id);
  }
  constructor(recepcionProductoService) {
    this.recepcionProductoService = recepcionProductoService;
  }
};
_ts_decorate(
  [
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('recepciones:editar'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _createrecepcionproductodto.CreateRecepcionProductoDto ===
      'undefined'
        ? Object
        : _createrecepcionproductodto.CreateRecepcionProductoDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecepcionProductoController.prototype,
  'create',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('recepciones:listar'),
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
  RecepcionProductoController.prototype,
  'findAll',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recepciones:ver'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecepcionProductoController.prototype,
  'findOne',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('recepciones:editar'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updaterecepcionproductodto.UpdateRecepcionProductoDto ===
      'undefined'
        ? Object
        : _updaterecepcionproductodto.UpdateRecepcionProductoDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecepcionProductoController.prototype,
  'update',
  null
);
_ts_decorate(
  [
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)(
      'recepciones:eliminar'
    ),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  RecepcionProductoController.prototype,
  'remove',
  null
);
RecepcionProductoController = _ts_decorate(
  [
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    (0, _common.Controller)('recepcion-productos'),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _recepcionproductoservice.RecepcionProductoService === 'undefined'
        ? Object
        : _recepcionproductoservice.RecepcionProductoService,
    ]),
  ],
  RecepcionProductoController
);
