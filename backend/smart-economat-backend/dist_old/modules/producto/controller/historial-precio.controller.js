"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "HistorialPrecioController", {
    enumerable: true,
    get: function() {
        return HistorialPrecioController;
    }
});
const _common = require("@nestjs/common");
const _pipes = require("../../../common/pipes");
const _historialprecioservice = require("../service/historial-precio.service");
const _createhistorialpreciodto = require("../dto/historial-precio.dto/create-historial-precio.dto");
const _updatehistorialpreciodto = require("../dto/historial-precio.dto/update-historial-precio.dto");
const _jwtauthguard = require("../../auth/guards/jwt-auth.guard");
const _swagger = require("@nestjs/swagger");
const _requirepermissionsdecorator = require("../../../common/decorators/require-permissions.decorator");
const _permisosguard = require("../../authorization/guards/permisos.guard");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let HistorialPrecioController = class HistorialPrecioController {
    create(dto) {
        return this.historialPrecioService.create(dto);
    }
    findAll(order = 'DESC') {
        return this.historialPrecioService.findAll(order);
    }
    findOne(id) {
        return this.historialPrecioService.findOne(id);
    }
    update(id, dto) {
        return this.historialPrecioService.update(id, dto);
    }
    remove(id) {
        return this.historialPrecioService.remove(id);
    }
    constructor(historialPrecioService){
        this.historialPrecioService = historialPrecioService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:editar'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createhistorialpreciodto.CreateHistorialPrecioDto === "undefined" ? Object : _createhistorialpreciodto.CreateHistorialPrecioDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], HistorialPrecioController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:ver'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiQuery)({
        name: 'order',
        required: false,
        enum: [
            'ASC',
            'DESC'
        ],
        description: 'docs.DIRECCI_N_DE_ORDENAMIENTO_POR_FECHA'
    }),
    _ts_param(0, (0, _common.Query)('order')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], HistorialPrecioController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:ver'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], HistorialPrecioController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:editar'),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updatehistorialpreciodto.UpdateHistorialPrecioDto === "undefined" ? Object : _updatehistorialpreciodto.UpdateHistorialPrecioDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], HistorialPrecioController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:eliminar'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], HistorialPrecioController.prototype, "remove", null);
HistorialPrecioController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _permisosguard.PermisosGuard),
    (0, _common.Controller)('historial-precio'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _historialprecioservice.HistorialPrecioService === "undefined" ? Object : _historialprecioservice.HistorialPrecioService
    ])
], HistorialPrecioController);

//# sourceMappingURL=historial-precio.controller.js.map