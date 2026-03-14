"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "CreateProveedorDto", {
    enumerable: true,
    get: function() {
        return CreateProveedorDto;
    }
});
const _classvalidator = require("class-validator");
const _classtransformer = require("class-transformer");
const _trimstringtransformer = require("../../../common/transformers/trim-string.transformer");
const _lowercasestringtransformer = require("../../../common/transformers/lowercase-string.transformer");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let CreateProveedorDto = class CreateProveedorDto {
};
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.IsNotEmpty)(),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata("design:type", String)
], CreateProveedorDto.prototype, "nombre", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(100),
    _ts_metadata("design:type", String)
], CreateProveedorDto.prototype, "contacto", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(50),
    _ts_metadata("design:type", String)
], CreateProveedorDto.prototype, "telefono", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_lowercasestringtransformer.LowercaseStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(255),
    _ts_metadata("design:type", String)
], CreateProveedorDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    _ts_metadata("design:type", String)
], CreateProveedorDto.prototype, "direccion", void 0);
_ts_decorate([
    (0, _classvalidator.IsOptional)(),
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    (0, _classvalidator.IsString)(),
    (0, _classvalidator.MaxLength)(20),
    _ts_metadata("design:type", String)
], CreateProveedorDto.prototype, "nif", void 0);

//# sourceMappingURL=create-proveedor.dto.js.map