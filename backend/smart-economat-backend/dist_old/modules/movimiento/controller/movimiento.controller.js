"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MovimientoController", {
    enumerable: true,
    get: function() {
        return MovimientoController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _movimientoservice = require("../service/movimiento.service");
const _paginationquerydto = require("../../../common/dto/pagination-query.dto");
const _createmovimientodto = require("../dto/create-movimiento.dto");
const _updatemovimientodto = require("../dto/update-movimiento.dto");
const _movimientohistorydto = require("../dto/movimiento-history.dto");
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
let MovimientoController = class MovimientoController {
    create(dto) {
        return this.movimientoService.create(dto);
    }
    findAll(query) {
        return this.movimientoService.findAll(query);
    }
    getMovimientoHistory(dto) {
        return this.movimientoService.getMovimientoHistory(dto);
    }
    findOne(id) {
        return this.movimientoService.findOne(id);
    }
    update(id, dto) {
        return this.movimientoService.update(id, dto);
    }
    remove(id) {
        return this.movimientoService.remove(id);
    }
    constructor(movimientoService){
        this.movimientoService = movimientoService;
    }
};
_ts_decorate([
    (0, _common.Post)(),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    (0, _swagger.ApiOperation)({
        summary: 'Crear un nuevo movimiento',
        description: 'docs.SOLO_ADMINISTRADORES_Y_PROFESORES_PUEDEN'
    }),
    (0, _swagger.ApiResponse)({
        status: 201,
        description: 'docs.MOVIMIENTO_CREADO_EXITOSAMENTE'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'docs.DATOS_INV_LIDOS'
    }),
    (0, _swagger.ApiResponse)({
        status: 403,
        description: 'docs.ACCESO_DENEGADO_ROL_INSUFICIENTE'
    }),
    _ts_param(0, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _createmovimientodto.CreateMovimientoDto === "undefined" ? Object : _createmovimientodto.CreateMovimientoDto
    ]),
    _ts_metadata("design:returntype", void 0)
], MovimientoController.prototype, "create", null);
_ts_decorate([
    (0, _common.Get)(),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR, _usuarioenums.rolUsuario.ALUMNO),
    (0, _swagger.ApiOperation)({
        summary: 'Listar todos los movimientos',
        description: 'docs.RETORNA_TODOS_LOS_MOVIMIENTOS_ORDENADOS'
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
        status: 200,
        description: 'docs.LISTA_DE_MOVIMIENTOS_PAGINADA'
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _paginationquerydto.PaginationQueryDto === "undefined" ? Object : _paginationquerydto.PaginationQueryDto
    ]),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], MovimientoController.prototype, "findAll", null);
_ts_decorate([
    (0, _common.Get)('historial'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR),
    (0, _swagger.ApiOperation)({
        summary: 'Obtener historial de movimientos (Trazabilidad)',
        description: 'docs.BUSCA_EL_HISTORIAL_DE_MOVIMIENTOS_DE_UN'
    }),
    (0, _swagger.ApiQuery)({
        name: 'entityId',
        required: false,
        type: 'string',
        description: 'docs.UUID_DEL_PRODUCTOPROVEEDOR_PARA_FILTRAR'
    }),
    (0, _swagger.ApiQuery)({
        name: 'userId',
        required: false,
        type: 'string',
        description: 'docs.UUID_DEL_USUARIO_PARA_FILTRAR_MOVIMIENTO'
    }),
    (0, _swagger.ApiQuery)({
        name: 'type',
        required: false,
        type: 'string',
        enum: [
            'entrada',
            'salida',
            'ajuste',
            'pedido',
            'entrada_compra'
        ],
        description: 'docs.TIPO_DE_MOVIMIENTO_A_FILTRAR'
    }),
    (0, _swagger.ApiQuery)({
        name: 'startDate',
        required: false,
        type: 'string',
        description: 'docs.FECHA_DE_INICIO_ISO_8601_EJ_2026_01_01'
    }),
    (0, _swagger.ApiQuery)({
        name: 'endDate',
        required: false,
        type: 'string',
        description: 'docs.FECHA_DE_FIN_ISO_8601_EJ_2026_02_28'
    }),
    (0, _swagger.ApiQuery)({
        name: 'sortBy',
        required: false,
        enum: [
            'createdAt',
            'cantidad'
        ],
        description: 'docs.CAMPO_POR_EL_QUE_ORDENAR'
    }),
    (0, _swagger.ApiQuery)({
        name: 'sortOrder',
        required: false,
        enum: [
            'ASC',
            'DESC'
        ],
        description: 'docs.ORDEN_DE_CLASIFICACI_N_ASCENDENTE_O_DESC'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'docs.HISTORIAL_DE_MOVIMIENTOS_ENCONTRADO_ORDE'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'docs.PAR_METROS_INV_LIDOS_O_NO_PROPORCIONA_EN'
    }),
    (0, _swagger.ApiResponse)({
        status: 403,
        description: 'docs.ACCESO_DENEGADO_ROL_INSUFICIENTE'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'docs.NO_SE_ENCONTRARON_MOVIMIENTOS_QUE_COINCI'
    }),
    _ts_param(0, (0, _common.Query)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _movimientohistorydto.MovimientoHistoryDto === "undefined" ? Object : _movimientohistorydto.MovimientoHistoryDto
    ]),
    _ts_metadata("design:returntype", void 0)
], MovimientoController.prototype, "getMovimientoHistory", null);
_ts_decorate([
    (0, _common.Get)(':id'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR, _usuarioenums.rolUsuario.PROFESOR, _usuarioenums.rolUsuario.ALUMNO),
    (0, _swagger.ApiOperation)({
        summary: 'Obtener un movimiento por ID',
        description: 'docs.RETORNA_LOS_DETALLES_COMPLETOS_DE_UN_MOV'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'docs.MOVIMIENTO_ENCONTRADO'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'docs.MOVIMIENTO_NO_ENCONTRADO'
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], MovimientoController.prototype, "findOne", null);
_ts_decorate([
    (0, _common.Patch)(':id'),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR),
    (0, _swagger.ApiOperation)({
        summary: 'Actualizar un movimiento',
        description: 'docs.SOLO_ADMINISTRADORES_PUEDEN_ACTUALIZAR_M'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'docs.MOVIMIENTO_ACTUALIZADO_EXITOSAMENTE'
    }),
    (0, _swagger.ApiResponse)({
        status: 400,
        description: 'docs.DATOS_INV_LIDOS'
    }),
    (0, _swagger.ApiResponse)({
        status: 403,
        description: 'docs.ACCESO_DENEGADO_SOLO_ADMINISTRADORES'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'docs.MOVIMIENTO_NO_ENCONTRADO'
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_param(1, (0, _common.Body)()),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String,
        typeof _updatemovimientodto.UpdateMovimientoDto === "undefined" ? Object : _updatemovimientodto.UpdateMovimientoDto
    ]),
    _ts_metadata("design:returntype", void 0)
], MovimientoController.prototype, "update", null);
_ts_decorate([
    (0, _common.Delete)(':id'),
    (0, _common.HttpCode)(_common.HttpStatus.NO_CONTENT),
    (0, _rolesdecorator.Roles)(_usuarioenums.rolUsuario.ADMINISTRADOR),
    (0, _swagger.ApiOperation)({
        summary: 'Eliminar un movimiento (soft delete)',
        description: 'docs.SOLO_ADMINISTRADORES_PUEDEN_ELIMINAR_MOV'
    }),
    (0, _swagger.ApiResponse)({
        status: 204,
        description: 'docs.MOVIMIENTO_ELIMINADO_EXITOSAMENTE'
    }),
    (0, _swagger.ApiResponse)({
        status: 403,
        description: 'docs.ACCESO_DENEGADO_SOLO_ADMINISTRADORES'
    }),
    (0, _swagger.ApiResponse)({
        status: 404,
        description: 'docs.MOVIMIENTO_NO_ENCONTRADO'
    }),
    _ts_param(0, (0, _common.Param)('id', _common.ParseUUIDPipe)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        String
    ]),
    _ts_metadata("design:returntype", void 0)
], MovimientoController.prototype, "remove", null);
MovimientoController = _ts_decorate([
    (0, _swagger.ApiTags)('movimientos'),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _roleguard.RolesGuard),
    (0, _common.Controller)('movimientos'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _movimientoservice.MovimientoService === "undefined" ? Object : _movimientoservice.MovimientoService
    ])
], MovimientoController);

//# sourceMappingURL=movimiento.controller.js.map