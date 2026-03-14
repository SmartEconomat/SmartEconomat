"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UpdateUbicacionDto", {
    enumerable: true,
    get: function() {
        return UpdateUbicacionDto;
    }
});
const _swagger = require("@nestjs/swagger");
const _classtransformer = require("class-transformer");
const _trimstringtransformer = require("../../../common/transformers/trim-string.transformer");
const _createubicaciondto = require("./create-ubicacion.dto");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let UpdateUbicacionDto = class UpdateUbicacionDto extends (0, _swagger.PartialType)(_createubicaciondto.CreateUbicacionDto) {
};
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    _ts_metadata("design:type", String)
], UpdateUbicacionDto.prototype, "nombre", void 0);
_ts_decorate([
    (0, _classtransformer.Transform)(_trimstringtransformer.TrimStringTransformer.transform),
    _ts_metadata("design:type", String)
], UpdateUbicacionDto.prototype, "descripcion", void 0);

//# sourceMappingURL=update-ubicacion.dto.js.map