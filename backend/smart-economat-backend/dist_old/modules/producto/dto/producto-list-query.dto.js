"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductoListQueryDto", {
    enumerable: true,
    get: function() {
        return ProductoListQueryDto;
    }
});
const _classvalidator = require("class-validator");
const _paginationquerydto = require("../../../common/dto/pagination-query.dto");
const _productoenums = require("../enums/producto.enums");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let ProductoListQueryDto = class ProductoListQueryDto extends _paginationquerydto.PaginationQueryDto {
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_productoenums.TipoProducto),
    _ts_metadata("design:type", typeof _productoenums.TipoProducto === "undefined" ? Object : _productoenums.TipoProducto)
], ProductoListQueryDto.prototype, "tipo", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], ProductoListQueryDto.prototype, "alergenos", void 0);

//# sourceMappingURL=producto-list-query.dto.js.map