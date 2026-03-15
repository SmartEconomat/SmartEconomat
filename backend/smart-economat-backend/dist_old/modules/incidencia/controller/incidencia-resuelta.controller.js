"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "IncidenciaResuelaController", {
    enumerable: true,
    get: function() {
        return IncidenciaResuelaController;
    }
});
const _common = require("@nestjs/common");
const _pipes = require("../../../common/pipes");
const _incidenciaresueltaservice = require("../service/incidencia-resuelta.service");
const _createincidenciadto = require("../dto/create-incidencia.dto");
const _updateincidenciadto = require("../dto/update-incidencia.dto");
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
let IncidenciaResuelaController = class IncidenciaResuelaController {
    create(dto) {
        return this.incidenciaResuelaService.create(dto);
    }
    findAll() {
        return this.incidenciaResuelaService.findAll();
    }
    findOne(id) {
        return this.incidenciaResuelaService.findOne(id);
    }
    update(id, dto) {
        return this.incidenciaResuelaService.update(id, dto);
    }
    remove(id) {
        return this.incidenciaResuelaService.remove(id);
    }
    constructor(incidenciaResuelaService){
        this.incidenciaResuelaService = incidenciaResuelaService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:crear'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createincidenciadto.CreateIncidenciaResuelaDto === "undefined" ? Object : _createincidenciadto.CreateIncidenciaResuelaDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaResuelaController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:listar'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaResuelaController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:ver'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaResuelaController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:editar'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateincidenciadto.UpdateIncidenciaResuelaDto === "undefined" ? Object : _updateincidenciadto.UpdateIncidenciaResuelaDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaResuelaController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:eliminar'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaResuelaController.prototype, "remove", null);
IncidenciaResuelaController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _permisosguard.PermisosGuard),
    (0, _common.Controller)('incidencias-resueltas'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _incidenciaresueltaservice.IncidenciaResuelaService === "undefined" ? Object : _incidenciaresueltaservice.IncidenciaResuelaService
    ])
], IncidenciaResuelaController);

//# sourceMappingURL=incidencia-resuelta.controller.js.map