"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DashboardController", {
    enumerable: true,
    get: function() {
        return DashboardController;
    }
});
const _common = require("@nestjs/common");
const _swagger = require("@nestjs/swagger");
const _dashboardstatsdto = require("../dto/dashboard-stats.dto");
const _dashboardservice = require("../service/dashboard.service");
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
let DashboardController = class DashboardController {
    async getStats() {
        return this.dashboardService.getStats();
    }
    constructor(dashboardService){
        this.dashboardService = dashboardService;
    }
};
_ts_decorate([
    (0, _common.Get)('stats'),
    (0, _requirepermissionsdecorator.RequirePermissions)('dashboard:ver_estadisticas'),
    (0, _swagger.ApiOperation)({
        summary: 'Get dashboard statistics (KPIs)'
    }),
    (0, _swagger.ApiResponse)({
        status: 200,
        description: 'docs.DASHBOARD_STATISTICS_RETRIEVED_SUCCESSFU',
        type: _dashboardstatsdto.DashboardStatsDto
    }),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", []),
    _ts_metadata("design:returntype", Promise)
], DashboardController.prototype, "getStats", null);
DashboardController = _ts_decorate([
    (0, _swagger.ApiTags)('Dashboard'),
    (0, _swagger.ApiBearerAuth)(),
    (0, _common.UseGuards)(_jwtauthguard.JwtAuthGuard, _permisosguard.PermisosGuard),
    (0, _common.Controller)('dashboard'),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _dashboardservice.DashboardService === "undefined" ? Object : _dashboardservice.DashboardService
    ])
], DashboardController);

//# sourceMappingURL=dashboard.controller.js.map