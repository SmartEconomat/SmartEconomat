'use strict';
Object.defineProperty(exports, '__esModule', {
  value: true,
});
Object.defineProperty(exports, 'PedidoController', {
  enumerable: true,
  get: function () {
    return PedidoController;
  },
});
const _common = require('@nestjs/common');
const _pipes = require('../../../common/pipes');
const _createpedidodto = require('../dto/create-pedido.dto');
const _cancelPedidodto = require('../dto/cancelPedido.dto');
const _updatePedidodto = require('../dto/updatePedido.dto');
const _pedidoservice = require('../service/pedido.service');
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
let PedidoController = class PedidoController {
  create(dto, req) {
    const userId = req.user.sub;
    return this.pedidoService.create(dto, userId);
  }
  findAll(query) {
    return this.pedidoService.findAll(query);
  }
  findOne(id) {
    return this.pedidoService.findOne(id);
  }
  update(id, dto) {
    return this.pedidoService.update(id, dto);
  }
  remove(id) {
    return this.pedidoService.remove(id);
  }
  updateFechaEntrega(id, dto) {
    return this.pedidoService.updateFechaEntrega(id, dto);
  }
  cancelarPedido(id, dto) {
    return this.pedidoService.cancelarPedido(id, dto);
  }
  constructor(pedidoService) {
    this.pedidoService = pedidoService;
  }
};
_ts_decorate(
  [
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('pedidos:crear'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _createpedidodto.CreatePedidoDto === 'undefined'
        ? Object
        : _createpedidodto.CreatePedidoDto,
      Object,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  PedidoController.prototype,
  'create',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('pedidos:listar'),
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
  PedidoController.prototype,
  'findAll',
  null
);
_ts_decorate(
  [
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('pedidos:ver'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  PedidoController.prototype,
  'findOne',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('pedidos:editar'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updatePedidodto.UpdatePedidoDto === 'undefined'
        ? Object
        : _updatePedidodto.UpdatePedidoDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  PedidoController.prototype,
  'update',
  null
);
_ts_decorate(
  [
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('pedidos:eliminar'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [String]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  PedidoController.prototype,
  'remove',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id/fecha-entrega'),
    (0, _requirepermissionsdecorator.RequirePermissions)('pedidos:editar'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _updatePedidodto.UpdatePedidoDto === 'undefined'
        ? Object
        : _updatePedidodto.UpdatePedidoDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  PedidoController.prototype,
  'updateFechaEntrega',
  null
);
_ts_decorate(
  [
    (0, _common.Patch)(':id/cancelar'),
    (0, _requirepermissionsdecorator.RequirePermissions)('pedidos:cancelar'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      String,
      typeof _cancelPedidodto.CancelPedidoDto === 'undefined'
        ? Object
        : _cancelPedidodto.CancelPedidoDto,
    ]),
    _ts_metadata(
      'design:returntype',
      typeof Promise === 'undefined' ? Object : Promise
    ),
  ],
  PedidoController.prototype,
  'cancelarPedido',
  null
);
PedidoController = _ts_decorate(
  [
    (0, _common.UseGuards)(
      _jwtauthguard.JwtAuthGuard,
      _permisosguard.PermisosGuard
    ),
    (0, _common.Controller)('pedidos'),
    _ts_metadata('design:type', Function),
    _ts_metadata('design:paramtypes', [
      typeof _pedidoservice.PedidoService === 'undefined'
        ? Object
        : _pedidoservice.PedidoService,
    ]),
  ],
  PedidoController
);
