"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateProveedorDto", {
    enumerable: true,
    get: function() {
        return UpdateProveedorDto;
    }
});
const _mappedtypes = require("@nestjs/mapped-types");
const _classtransformer = require("class-transformer");
const _trimstringtransformer = require("../../../common/transformers/trim-string.transformer");
const _lowercasestringtransformer = require("../../../common/transformers/lowercase-string.transformer");
const _createproveedordto = require("./create-proveedor.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let UpdateProveedorDto = class UpdateProveedorDto extends (0, _mappedtypes.PartialType)(_createproveedordto.CreateProveedorDto) {
};
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    _ts_metadata("design:type", String)
], UpdateProveedorDto.prototype, "nombre", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    _ts_metadata("design:type", String)
], UpdateProveedorDto.prototype, "contacto", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    _ts_metadata("design:type", String)
], UpdateProveedorDto.prototype, "telefono", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(_lowercasestringtransformer.LowercaseStringTransformer.transform),
    _ts_metadata("design:type", String)
], UpdateProveedorDto.prototype, "email", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    _ts_metadata("design:type", String)
], UpdateProveedorDto.prototype, "direccion", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    _ts_metadata("design:type", String)
], UpdateProveedorDto.prototype, "nif", void 0);

//# sourceMappingURL=update-proveedor.dto.js.map