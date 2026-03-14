"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "RecepcionController", {
    enumerable: true,
    get: function() {
        return RecepcionController;
    }
});
const _common = require("@nestjs/common");
const _createrecepciondto = require("../dto/create-recepcion.dto");
const _swagger = require("@nestjs/swagger");
const _updaterecepciondto = require("../dto/update-recepcion.dto");
const _recepcionservice = require("../service/recepcion.service");
const _paginationquerydto = require("../../../common/dto/pagination-query.dto");
const _jwtauthguard = require("../../auth/guards/jwt-auth.guard");
const _roleguard = require("../../auth/guards/role.guard");
const _rolesdecorator = require("../../auth/decorators/roles.decorator");
const _usuarioenums = require("../../usuario/enums/usuario.enums");
const _recepcionstockservice = require("../service/recepcion-stock.service");
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
let RecepcionController = class RecepcionController {
    create(dto, req) {
        const userId = req.user.sub;
        dto.usuarioId = dto.usuarioId || userId;
        return this.recepcionStockService.procesarRecepcion(dto);
    }
    findAll(query) {
        return this.recepcionService.findAll(query);
    }
    findOne(id) {
        return this.recepcionService.findOne(id);
    }
    update(id, dto) {
        return this.recepcionService.update(id, dto);
    }
    remove(id) {
        return this.recepcionService.remove(id);
    }
    constructor(recepcionService, recepcionStockService){
        this.recepcionService = recepcionService;
        this.recepcionStockService = recepcionStockService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_param(1, (0, _common.Request)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createrecepciondto.CreateRecepcionDto === "undefined" ? Object : _createrecepciondto.CreateRecepcionDto,
        Object
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], RecepcionController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    (0, _swagger.ApiQuery)({
        name: 'page',
        required: false,
        type: Number
    }),
    (0, _swagger.ApiQuery)({
        name: 'limit',
        required: false,
        type: Number
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _paginationquerydto.PaginationQueryDto === "undefined" ? Object : _paginationquerydto.PaginationQueryDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], RecepcionController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], RecepcionController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updaterecepciondto.UpdateRecepcionDto === "undefined" ? Object : _updaterecepciondto.UpdateRecepcionDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], RecepcionController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], RecepcionController.prototype, "remove", null);
RecepcionController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _roleguard.RolesGuard),
    (0, _common.Controller)('recepcion'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _recepcionservice.RecepcionService === "undefined" ? Object : _recepcionservice.RecepcionService,
        typeof _recepcionstockservice.RecepcionStockService === "undefined" ? Object : _recepcionstockservice.RecepcionStockService
    ])
], RecepcionController);

//# sourceMappingURL=recepcion.controller.js.map