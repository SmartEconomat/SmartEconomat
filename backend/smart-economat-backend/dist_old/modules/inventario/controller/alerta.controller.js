"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AlertaController", {
    enumerable: true,
    get: function() {
        return AlertaController;
    }
});
const _common = require("@nestjs/common");
const _inventarioservice = require("../service/inventario.service");
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
let AlertaController = class AlertaController {
    alertasCaducidad() {
        return this.inventarioService.obtenerAlertasCaducidad();
    }
    alertasStock() {
        return this.inventarioService.obtenerAlertasStock();
    }
    constructor(inventarioService){
        this.inventarioService = inventarioService;
    }
};
_ts_decorate([
    (0, _common.Get)('caducidad'),
    (0, _requirepermissionsdecorator.RequirePermissions)('inventario:ver'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], AlertaController.prototype, "alertasCaducidad", null);
_ts_decorate([
    (0, _common.Get)('stock'),
    (0, _requirepermissionsdecorator.RequirePermissions)('inventario:ver'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", typeof Promise === "undefined" ? Object : Promise)
], AlertaController.prototype, "alertasStock", null);
AlertaController = _ts_decorate([
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _permisosguard.PermisosGuard),
    (0, _common.Controller)('alertas'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _inventarioservice.InventarioService === "undefined" ? Object : _inventarioservice.InventarioService
    ])
], AlertaController);

//# sourceMappingURL=alerta.controller.js.map