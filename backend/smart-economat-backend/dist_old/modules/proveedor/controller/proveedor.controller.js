"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProveedorController", {
    enumerable: true,
    get: function() {
        return ProveedorController;
    }
});
const _common = require("@nestjs/common");
const _createproveedordto = require("../dto/create-proveedor.dto");
const _swagger = require("@nestjs/swagger");
const _updateproveedordto = require("../dto/update-proveedor.dto");
const _paginationquerydto = require("../../../common/dto/pagination-query.dto");
const _proveedorservice = require("../service/proveedor.service");
const _jwtauthguard = require("../../auth/guards/jwt-auth.guard");
const _roleguard = require("../../auth/guards/role.guard");
const _rolesdecorator = require("../../auth/decorators/roles.decorator");
const _usuarioenums = require("../../usuario/enums/usuario.enums");
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
let ProveedorController = class ProveedorController {
    create(dto) {
        return this.proveedorService.create(dto);
    }
    findAll(query) {
        return this.proveedorService.findAll(query);
    }
    findOne(id) {
        return this.proveedorService.findOne(id);
    }
    update(id, dto) {
        return this.proveedorService.update(id, dto);
    }
    remove(id) {
        return this.proveedorService.remove(id);
    }
    constructor(proveedorService){
        this.proveedorService = proveedorService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createproveedordto.CreateProveedorDto === "undefined" ? Object : _createproveedordto.CreateProveedorDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], ProveedorController.prototype, "create", null);
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
], ProveedorController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], ProveedorController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateproveedordto.UpdateProveedorDto === "undefined" ? Object : _updateproveedordto.UpdateProveedorDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], ProveedorController.prototype, "update", null);
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
], ProveedorController.prototype, "remove", null);
ProveedorController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _roleguard.RolesGuard),
    (0, _common.Controller)('proveedor'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _proveedorservice.ProveedorService === "undefined" ? Object : _proveedorservice.ProveedorService
    ])
], ProveedorController);

//# sourceMappingURL=proveedor.controller.js.map