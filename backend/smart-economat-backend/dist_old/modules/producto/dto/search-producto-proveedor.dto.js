"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "SearchProductoProveedorDto", {
    enumerable: true,
    get: function() {
        return SearchProductoProveedorDto;
    }
});
const _nestjsi18n = require("nestjs-i18n");
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let SearchProductoProveedorDto = class SearchProductoProveedorDto {
    constructor(){
        this.offset = 0;
        this.limit = 20;
    }
};
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_T_RMINO_DE_B_SQUEDA_DEBE_SER_UNA_CADE')
    }),
    (0, _classvalidator.MaxLength)(100, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_T_RMINO_DE_B_SQUEDA_NO_PUEDE_EXCEDER')
    }),
    _ts_metadata("design:type", String)
], SearchProductoProveedorDto.prototype, "q", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_OFFSET_DEBE_SER_UN_ENTERO')
    }),
    (0, _classvalidator.Min)(0, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_OFFSET_NO_PUEDE_SER_NEGATIVO')
    }),
    _ts_metadata("design:type", Number)
], SearchProductoProveedorDto.prototype, "offset", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Type)(()=>Number),
    (0, _classvalidator.IsInt)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_L_MITE_DEBE_SER_UN_ENTERO')
    }),
    (0, _classvalidator.Min)(1, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_L_MITE_DEBE_SER_AL_MENOS_1')
    }),
    (0, _classvalidator.Max)(50, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_L_MITE_NO_PUEDE_EXCEDER_50')
    }),
    _ts_metadata("design:type", Number)
], SearchProductoProveedorDto.prototype, "limit", void 0);

//# sourceMappingURL=search-producto-proveedor.dto.js.map