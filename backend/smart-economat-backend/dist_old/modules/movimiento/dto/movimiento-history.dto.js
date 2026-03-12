"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MovimientoHistoryDto", {
    enumerable: true,
    get: function() {
        return MovimientoHistoryDto;
    }
});
const _nestjsi18n = require("nestjs-i18n");
const _classvalidator = require("class-validator");
const _movimientoenums = require("../enums/movimiento.enums");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let MovimientoHistoryDto = class MovimientoHistoryDto {
};
_ts_decorate([
    (0, _classvalidator.IsUUID)('7', {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ID_DE_LA_ENTIDAD_DEBE_SER_UN_UUID_V_L')
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], MovimientoHistoryDto.prototype, "entityId", void 0);
_ts_decorate([
    (0, _classvalidator.IsUUID)('7', {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ID_DEL_USUARIO_DEBE_SER_UN_UUID_V_LID')
    }),
    (0, _classvalidator.IsOptional)(),
    _ts_metadata("design:type", String)
], MovimientoHistoryDto.prototype, "userId", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_movimientoenums.TipoMovimiento, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_TIPO_DE_MOVIMIENTO_NO_ES_V_LIDO')
    }),
    _ts_metadata("design:type", typeof _movimientoenums.TipoMovimiento === "undefined" ? Object : _movimientoenums.TipoMovimiento)
], MovimientoHistoryDto.prototype, "type", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)({}, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_FECHA_DE_INICIO_DEBE_SER_UNA_FECHA_V')
    }),
    _ts_metadata("design:type", String)
], MovimientoHistoryDto.prototype, "startDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsDateString)({}, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_FECHA_DE_FIN_DEBE_SER_UNA_FECHA_V_LID')
    }),
    _ts_metadata("design:type", String)
], MovimientoHistoryDto.prototype, "endDate", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_SORTEO_DEBE_SER_UNA_CADENA_V_LIDA')
    }),
    _ts_metadata("design:type", String)
], MovimientoHistoryDto.prototype, "sortBy", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)([
        'ASC',
        'DESC'
    ], {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_ORDEN_DEBE_SER_ASC_O_DESC')
    }),
    _ts_metadata("design:type", String)
], MovimientoHistoryDto.prototype, "sortOrder", void 0);

//# sourceMappingURL=movimiento-history.dto.js.map