"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InventarioController", {
    enumerable: true,
    get: function() {
        return InventarioController;
    }
});
const _common = require("@nestjs/common");
const _inventarioservice = require("../service/inventario.service");
const _createInventarioItemdto = require("../dto/create-InventarioItem.dto");
const _updateinventariodto = require("../dto/update-inventario.dto");
const _jwtauthguard = require("../../auth/guards/jwt-auth.guard");
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
let InventarioController = class InventarioController {
    create(createInventarioDto, req) {
        const userId = req.user.sub;
        return this.inventarioService.create(createInventarioDto, userId);
    }
    findAll() {
        return this.inventarioService.findAll();
    }
    findOne(id) {
        return this.inventarioService.findOne(id);
    }
    update(id, updateInventarioDto, req) {
        const userId = req.user.sub;
        return this.inventarioService.update(id, updateInventarioDto, userId);
    }
    remove(id, req) {
        const userId = req.user.sub;
        return this.inventarioService.remove(id, userId);
    }
    constructor(inventarioService){
        this.inventarioService = inventarioService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('inventario:crear'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createInventarioItemdto.CreateInventarioItemDto === "undefined" ? Object : _createInventarioItemdto.CreateInventarioItemDto,
        Object
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], InventarioController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('inventario:listar'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], InventarioController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('inventario:ver'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], InventarioController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('inventario:editar'),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateinventariodto.UpdateInventarioDto === "undefined" ? Object : _updateinventariodto.UpdateInventarioDto,
        Object
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], InventarioController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('inventario:eliminar'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id')),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        Object
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], InventarioController.prototype, "remove", null);
InventarioController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _permisosguard.PermisosGuard),
    (0, _common.Controller)('inventario'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _inventarioservice.InventarioService === "undefined" ? Object : _inventarioservice.InventarioService
    ])
], InventarioController);

//# sourceMappingURL=inventario.controller.js.map