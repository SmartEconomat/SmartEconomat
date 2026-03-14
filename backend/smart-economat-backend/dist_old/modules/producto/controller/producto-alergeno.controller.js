"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductoAlergenoController", {
    enumerable: true,
    get: function() {
        return ProductoAlergenoController;
    }
});
const _common = require("@nestjs/common");
const _pipes = require("../../../common/pipes");
const _productoalergenoservice = require("../service/producto-alergeno.service");
const _createproductoalergenodto = require("../dto/producto-alergeno.dto/create-producto-alergeno.dto");
const _updateproductoalergenodto = require("../dto/producto-alergeno.dto/update-producto-alergeno.dto");
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
let ProductoAlergenoController = class ProductoAlergenoController {
    create(createDto) {
        return this.productoAlergenoService.create(createDto);
    }
    findAll(idProducto) {
        return this.productoAlergenoService.findAll(idProducto);
    }
    findOne(idProducto) {
        return this.productoAlergenoService.findOne(idProducto);
    }
    update(idProducto, updateDto) {
        return this.productoAlergenoService.update(idProducto, updateDto);
    }
    remove(idProducto, alergeno) {
        return this.productoAlergenoService.remove(idProducto, alergeno);
    }
    constructor(productoAlergenoService){
        this.productoAlergenoService = productoAlergenoService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:editar'),
    (0, _common.HttpCode)(_common.HttpStatus.CREATED),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createproductoalergenodto.CreateProductoAlergenoDto === "undefined" ? Object : _createproductoalergenodto.CreateProductoAlergenoDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], ProductoAlergenoController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:ver'),
    _ts_param(0, (0, _common.Query)('idProducto')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], ProductoAlergenoController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:ver'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], ProductoAlergenoController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:editar'),
    _ts_param(0, (0, _common.Param)('id', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateproductoalergenodto.UpdateProductoAlergenoDto === "undefined" ? Object : _updateproductoalergenodto.UpdateProductoAlergenoDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], ProductoAlergenoController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':idProducto/:alergeno'),
    (0, _requirepermissionsdecorator.RequirePermissions)('productos:editar'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    _ts_param(0, (0, _common.Param)('idProducto', _pipes.ParseUUIDv7Pipe)),
    _ts_param(1, (0, _common.Param)('alergeno')),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        String
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], ProductoAlergenoController.prototype, "remove", null);
ProductoAlergenoController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _permisosguard.PermisosGuard),
    (0, _common.Controller)('producto-alergenos'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _productoalergenoservice.ProductoAlergenoService === "undefined" ? Object : _productoalergenoservice.ProductoAlergenoService
    ])
], ProductoAlergenoController);

//# sourceMappingURL=producto-alergeno.controller.js.map