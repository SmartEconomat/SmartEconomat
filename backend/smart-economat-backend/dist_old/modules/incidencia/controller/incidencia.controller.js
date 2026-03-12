"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "IncidenciaController", {
    enumerable: true,
    get: function() {
        return IncidenciaController;
    }
});
const _common = require("@nestjs/common");
const _pipes = require("../../../common/pipes");
const _incidenciaservice = require("../service/incidencia.service");
const _createincidenciadto = require("../dto/create-incidencia.dto");
const _updateincidenciadto = require("../dto/update-incidencia.dto");
const _resolverincidenciadto = require("../dto/resolver-incidencia.dto");
const _reportincidenciadto = require("../dto/report-incidencia.dto");
const _resolveincidenciadto = require("../dto/resolve-incidencia.dto");
const _jwtauthguard = require("../../auth/guards/jwt-auth.guard");
const _getuserdecorator = require("../../auth/decorators/get-user.decorator");
const _requirepermissionsdecorator = require("../../../common/decorators/require-permissions.decorator");
const _permisosguard = require("../../authorization/guards/permisos.guard");
const _swagger = require("@nestjs/swagger");
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
let IncidenciaController = class IncidenciaController {
    create(dto) {
        return this.incidenciaService.create(dto);
    }
    findAll() {
        return this.incidenciaService.findAll();
    }
    findOne(id) {
        return this.incidenciaService.findOne(id);
    }
    update(id, dto) {
        return this.incidenciaService.update(id, dto);
    }
    remove(id) {
        return this.incidenciaService.remove(id);
    }
    resolver(id, dto) {
        return this.incidenciaService.resolverIncidencia(id, dto);
    }
    reportar(dto) {
        return this.incidenciaService.reportarIncidencia(dto);
    }
    resolverTransaccional(id, dto, usuarioId) {
        return this.incidenciaService.resolverIncidenciaTransaccional(id, dto, usuarioId);
    }
    constructor(incidenciaService){
        this.incidenciaService = incidenciaService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:crear'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createincidenciadto.CreateIncidenciaDto === "undefined" ? Object : _createincidenciadto.CreateIncidenciaDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:listar'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:ver'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:editar'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateincidenciadto.UpdateIncidenciaDto === "undefined" ? Object : _updateincidenciadto.UpdateIncidenciaDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaController.prototype, "update", null);
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
], IncidenciaController.prototype, "remove", null);
_ts_decorate([
    (0, _common.Patch)(':id/resolver'),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:resolver'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _resolverincidenciadto.ResolverIncidenciaDto === "undefined" ? Object : _resolverincidenciadto.ResolverIncidenciaDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaController.prototype, "resolver", null);
_ts_decorate([
    (0, _common.Post)('reportar'),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:crear'),
    (0, _swagger.ApiOperation)({
        summary: 'Reporta una nueva incidencia vinculada a una recepción'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'Incidencia reportada correctamente'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _reportincidenciadto.ReportIncidenciaDto === "undefined" ? Object : _reportincidenciadto.ReportIncidenciaDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaController.prototype, "reportar", null);
_ts_decorate([
    (0, _common.Post)(':id/resolver'),
    (0, _requirepermissionsdecorator.RequirePermissions)('incidencias:resolver'),
    (0, _swagger.ApiOperation)({
        summary: 'Resuelve una incidencia de forma transaccional'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'Incidencia resuelta correctamente'
    }),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_param(2, (0, _getuserdecorator.GetUser)('id')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _resolveincidenciadto.ResolveIncidenciaDto === "undefined" ? Object : _resolveincidenciadto.ResolveIncidenciaDto,
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], IncidenciaController.prototype, "resolverTransaccional", null);
IncidenciaController = _ts_decorate([
    (0, _swagger.ApiTags)('incidencias'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _permisosguard.PermisosGuard),
    (0, _common.Controller)('incidencias'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _incidenciaservice.IncidenciaService === "undefined" ? Object : _incidenciaservice.IncidenciaService
    ])
], IncidenciaController);

//# sourceMappingURL=incidencia.controller.js.map