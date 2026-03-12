"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateProductoDto", {
    enumerable: true,
    get: function() {
        return CreateProductoDto;
    }
});
const _nestjsi18n = require("nestjs-i18n");
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _addproveedortoproductodto = require("./producto-proveedor.dto/add-proveedor-to-producto.dto");
const _productoenums = require("../enums/producto.enums");
const _trimstringtransformer = require("../../../common/transformers/trim-string.transformer");
const _uppercasestringtransformer = require("../../../common/transformers/uppercase-string.transformer");
const _stringtodatetransformer = require("../../../common/transformers/string-to-date.transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreateProductoDto = class CreateProductoDto {
};
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_NOMBRE_DEBE_SER_UNA_CADENA_DE_TEXTO')
    }),
    (0, _classvalidator.IsNotEmpty)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_NOMBRE_ES_OBLIGATORIO')
    }),
    (0, _classvalidator.MaxLength)(100, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_NOMBRE_NO_PUEDE_EXCEDER_LOS_100_CARAC')
    }),
    _ts_metadata("design:type", String)
], CreateProductoDto.prototype, "nombre", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_MARCA_DEBE_SER_UNA_CADENA_DE_TEXTO')
    }),
    (0, _classvalidator.MaxLength)(100, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_MARCA_NO_PUEDE_EXCEDER_LOS_100_CARACT')
    }),
    _ts_metadata("design:type", String)
], CreateProductoDto.prototype, "marca", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_DESCRIPCI_N_DEBE_SER_UNA_CADENA_DE_TE')
    }),
    (0, _classvalidator.MaxLength)(1000, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_DESCRIPCI_N_NO_PUEDE_EXCEDER_LOS_1000')
    }),
    _ts_metadata("design:type", String)
], CreateProductoDto.prototype, "descripcion", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_productoenums.UnidadMedida, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_UNIDAD_DEL_PRODUCTO_NO_ES_V_LIDA')
    }),
    _ts_metadata("design:type", typeof _productoenums.UnidadMedida === "undefined" ? Object : _productoenums.UnidadMedida)
], CreateProductoDto.prototype, "unidad", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_stringtodatetransformer.StringToDateTransformer.transform),
    (0, _classtransformer.Type)(()=>Date),
    (0, _classvalidator.IsDate)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_FECHA_DE_CADUCIDAD_DEBE_SER_UNA_FECHA')
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], CreateProductoDto.prototype, "fechaCaducidad", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_RUTA_DE_LA_IMAGEN_DEBE_SER_UNA_CADENA')
    }),
    (0, _classvalidator.MaxLength)(200, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LA_RUTA_DE_LA_IMAGEN_NO_PUEDE_EXCEDER_LO')
    }),
    _ts_metadata("design:type", String)
], CreateProductoDto.prototype, "pathImg", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsEnum)(_productoenums.TipoProducto, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_TIPO_DE_PRODUCTO_NO_ES_V_LIDO')
    }),
    _ts_metadata("design:type", typeof _productoenums.TipoProducto === "undefined" ? Object : _productoenums.TipoProducto)
], CreateProductoDto.prototype, "tipo", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_uppercasestringtransformer.UppercaseStringTransformer.transform),
    (0, _classvalidator.IsString)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UNA_CADENA')
    }),
    (0, _classvalidator.MaxLength)(13, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_C_DIGO_DE_BARRAS_NO_PUEDE_EXCEDER_LOS')
    }),
    (0, _classvalidator.Matches)(/^\d{13}$/, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_C_DIGO_DE_BARRAS_DEBE_SER_UN_EAN_13_D')
    }),
    _ts_metadata("design:type", String)
], CreateProductoDto.prototype, "codigoBarras", void 0);
_ts_decorate([
    (0, _classvalidator.IsNumber)({}, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_CONTENIDO_DEBE_SER_UN_N_MERO')
    }),
    (0, _classvalidator.Min)(0, {
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.EL_CONTENIDO_NO_PUEDE_SER_NEGATIVO')
    }),
    _ts_metadata("design:type", Number)
], CreateProductoDto.prototype, "contenido", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LOS_AL_RGENOS_DEBEN_SER_UN_ARRAY')
    }),
    (0, _classvalidator.IsEnum)(_productoenums.Alergeno, {
        each: true,
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.AL_RGENO_NO_V_LIDO')
    }),
    _ts_metadata("design:type", Array)
], CreateProductoDto.prototype, "alergenos", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classvalidator.IsArray)({
        message: (0, _nestjsi18n.i18nValidationMessage)('validation.LOS_PROVEEDORES_DEBEN_SER_UN_ARRAY')
    }),
    (0, _classvalidator.ValidateNested)({
        each: true
    }),
    (0, _classtransformer.Type)(()=>_addproveedortoproductodto.AddProveedorToProductoDto),
    _ts_metadata("design:type", Array)
], CreateProductoDto.prototype, "proveedores", void 0);

//# sourceMappingURL=create-producto.dto.js.map