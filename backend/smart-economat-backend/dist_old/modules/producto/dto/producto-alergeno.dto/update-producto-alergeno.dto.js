"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateProductoAlergenoDto", {
    enumerable: true,
    get: function() {
        return UpdateProductoAlergenoDto;
    }
});
const _nestjsi18n = require("nestjs-i18n");
const _classvalidator = require("class-validator");
const _productoenums = require("../../enums/producto.enums");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let UpdateProductoAlergenoDto = class UpdateProductoAlergenoDto {
};
_ts_decorate([
    (0, _classvalidator.IsArray)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY')
    }),
    (0, _classvalidator.ArrayNotEmpty)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_LISTA_DE_AL_RGENOS_NO_PUEDE_ESTAR_VAC')
    }),
    (0, _classvalidator.IsEnum)(_productoenums.Alergeno, {
        each: true,
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.UNO_O_M_S_AL_RGENOS_INDICADOS_NO_SON_V_L')
    }),
    _ts_metadata("design:type", Array)
], UpdateProductoAlergenoDto.prototype, "alergenos", void 0);

//# sourceMappingURL=update-producto-alergeno.dto.js.map