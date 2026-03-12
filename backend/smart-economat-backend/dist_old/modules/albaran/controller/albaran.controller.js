"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AlbaranController", {
    enumerable: true,
    get: function() {
        return AlbaranController;
    }
});
const _common = require("@nestjs/common");
const _pipes = require("../../../common/pipes");
const _createalbarandto = require("../dto/create-albaran.dto");
const _updatealbarandto = require("../dto/update-albaran.dto");
const _albaranservice = require("../service/albaran.service");
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
let AlbaranController = class AlbaranController {
    create(dto) {
        return this.albaranService.create(dto);
    }
    findAll() {
        return this.albaranService.findAll();
    }
    findOne(id) {
        return this.albaranService.findOne(id);
    }
    update(id, dto) {
        return this.albaranService.update(id, dto);
    }
    remove(id) {
        return this.albaranService.remove(id);
    }
    constructor(albaranService){
        this.albaranService = albaranService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('albaranes:crear'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createalbarandto.CreateAlbaranDto === "undefined" ? Object : _createalbarandto.CreateAlbaranDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], AlbaranController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('albaranes:listar'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], AlbaranController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('albaranes:ver'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], AlbaranController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('albaranes:editar'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updatealbarandto.UpdateAlbaranDto === "undefined" ? Object : _updatealbarandto.UpdateAlbaranDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], AlbaranController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('albaranes:eliminar'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], AlbaranController.prototype, "remove", null);
AlbaranController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _permisosguard.PermisosGuard),
    (0, _common.Controller)('albaranes'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _albaranservice.AlbaranService === "undefined" ? Object : _albaranservice.AlbaranService
    ])
], AlbaranController);

//# sourceMappingURL=albaran.controller.js.map