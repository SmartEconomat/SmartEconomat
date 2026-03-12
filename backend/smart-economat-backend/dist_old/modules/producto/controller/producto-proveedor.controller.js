"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductoProveedorController", {
    enumerable: true,
    get: function() {
        return ProductoProveedorController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _productoproveedorservice = require("../service/producto-proveedor.service");
const _paginationquerydto = require("../../../common/dto/pagination-query.dto");
const _updateprecioproductodto = require("../dto/update-precio-producto.dto");
const _historialentity = require("../historial-precio-proveedor.entity/historial.entity");
const _searchproductoproveedordto = require("../dto/search-producto-proveedor.dto");
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
let ProductoProveedorController = class ProductoProveedorController {
    async updatePrecio(id, updatePrecioProductoDto) {
        return this.productoProveedorService.updatePrecio(id, updatePrecioProductoDto);
    }
    async search(dto) {
        return this.productoProveedorService.search(dto);
    }
    async getHistorial(id, query) {
        return this.productoProveedorService.getHistorial(id, query);
    }
    constructor(productoProveedorService){
        this.productoProveedorService = productoProveedorService;
    }
};
_ts_decorate([
    (0, _common.Patch)(':id/precio'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiOperation)({
        summary: 'Actualizar el precio de un producto de un proveedor y registrar histórico'
    }),
    (0, _swagger.ApiParam)({
        name: 'id',
        description: 'docs.ID_DEL_PRODUCTOPROVEEDOR'
    }),
    (0, _swagger.ApiResponse)({
        status: _common.HttpStatus.OK,
        description: 'docs.PRECIO_ACTUALIZADO_CORRECTAMENTE'
    }),
    (0, _swagger.ApiResponse)({
        status: _common.HttpStatus.NOT_FOUND,
        description: 'docs.PRODUCTO_PROVEEDOR_NO_ENCONTRADO'
    }),
    (0, _swagger.ApiResponse)({
        status: _common.HttpStatus.CONFLICT,
        description: 'docs.EL_PRECIO_ES_IGUAL_AL_ACTUAL'
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updateprecioproductodto.UpdatePrecioProductoDto === "undefined" ? Object : _updateprecioproductodto.UpdatePrecioProductoDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ProductoProveedorController.prototype, "updatePrecio", null);
_ts_decorate([
    (0, _common.Get)('search'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    (0, _common.HttpCode)(_common.HttpStatus.OK),
    (0, _swagger.ApiOperation)({
        summary: 'Buscar relaciones producto-proveedor (autocomplete)'
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _searchproductoproveedordto.SearchProductoProveedorDto === "undefined" ? Object : _searchproductoproveedordto.SearchProductoProveedorDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ProductoProveedorController.prototype, "search", null);
_ts_decorate([
    (0, _common.Get)(':id/historial'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    (0, _swagger.ApiOperation)({
        summary: 'Obtener el historial de precios de un producto proveedor'
    }),
    (0, _swagger.ApiParam)({
        name: 'id',
        description: 'docs.ID_DEL_PRODUCTOPROVEEDOR'
    }),
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
    (0, _swagger.ApiResponse)({
        status: _common.HttpStatus.OK,
        description: 'docs.HISTORIAL_DE_PRECIOS_RECUPERADO_CORRECTA',
        type: [
            _historialentity.HistorialPrecio
        ]
    }),
    (0, _swagger.ApiResponse)({
        status: _common.HttpStatus.NOT_FOUND,
        description: 'docs.PRODUCTO_PROVEEDOR_NO_ENCONTRADO'
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _paginationquerydto.PaginationQueryDto === "undefined" ? Object : _paginationquerydto.PaginationQueryDto
    ]),
    _ts_metadata("design:returntype", Promise)
], ProductoProveedorController.prototype, "getHistorial", null);
ProductoProveedorController = _ts_decorate([
    (0, _swagger.ApiTags)('Producto Proveedor'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _roleguard.RolesGuard),
    (0, _common.Controller)('producto-proveedor'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _productoproveedorservice.ProductoProveedorService === "undefined" ? Object : _productoproveedorservice.ProductoProveedorService
    ])
], ProductoProveedorController);

//# sourceMappingURL=producto-proveedor.controller.js.map