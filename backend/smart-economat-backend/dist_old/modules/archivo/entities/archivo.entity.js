"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Archivo", {
    enumerable: true,
    get: function() {
        return Archivo;
    }
});
const _typeorm = require("typeorm");
const _baseentity = require("../../../common/entities/base.entity");
const _usuarioentity = require("../../usuario/usuario.entity/usuario.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Archivo = class Archivo extends _baseentity.BaseEntity {
};
_ts_decorate([
    (0, _typeorm.Column)(),
    _ts_metadata("design:type", String)
], Archivo.prototype, "nombre", void 0);
_ts_decorate([
    (0, _typeorm.Column)(),
    _ts_metadata("design:type", String)
], Archivo.prototype, "url", void 0);
_ts_decorate([
    (0, _typeorm.Column)(),
    _ts_metadata("design:type", Number)
], Archivo.prototype, "tamano", void 0);
_ts_decorate([
    (0, _typeorm.Column)(),
    _ts_metadata("design:type", String)
], Archivo.prototype, "mimeType", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_usuarioentity.Usuario, {
        nullable: true
    }),
    _ts_metadata("design:type", typeof _usuarioentity.Usuario === "undefined" ? Object : _usuarioentity.Usuario)
], Archivo.prototype, "usuario", void 0);
Archivo = _ts_decorate([
    (0, _typeorm.Entity)('archivos')
], Archivo);

//# sourceMappingURL=archivo.entity.js.map