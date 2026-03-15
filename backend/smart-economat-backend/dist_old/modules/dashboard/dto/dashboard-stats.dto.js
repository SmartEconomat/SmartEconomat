"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DashboardStatsDto", {
    enumerable: true,
    get: function() {
        return DashboardStatsDto;
    }
});
const _classvalidator = require("class-validator");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let DashboardStatsDto = class DashboardStatsDto {
};
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], DashboardStatsDto.prototype, "totalProductos", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], DashboardStatsDto.prototype, "productosEsteMes", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)(),
    _ts_metadata("design:type", Number)
], DashboardStatsDto.prototype, "totalProveedores", void 0);
_ts_decorate([
    (0, _classvalidator.IsObject)(),
    _ts_metadata("design:type", Object)
], DashboardStatsDto.prototype, "inventario", void 0);
_ts_decorate([
    (0, _classvalidator.IsObject)(),
    _ts_metadata("design:type", Object)
], DashboardStatsDto.prototype, "pedidos", void 0);
_ts_decorate([
    (0, _classvalidator.IsObject)(),
    _ts_metadata("design:type", Object)
], DashboardStatsDto.prototype, "alertas", void 0);

//# sourceMappingURL=dashboard-stats.dto.js.map