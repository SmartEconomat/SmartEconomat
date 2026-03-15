"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "UsuarioRol", {
    enumerable: true,
    get: function() {
        return UsuarioRol;
    }
});
const _typeorm = require("typeorm");
const _usuarioentity = require("../../usuario/usuario.entity/usuario.entity");
const _rolentity = require("./rol.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let UsuarioRol = class UsuarioRol {
};
_ts_decorate([
    (0, _typeorm.PrimaryColumn)({
        type: 'uuid',
        name: 'usuario_id'
    }),
    _ts_metadata("design:type", String)
], UsuarioRol.prototype, "usuarioId", void 0);
_ts_decorate([
    (0, _typeorm.PrimaryColumn)({
        type: 'uuid',
        name: 'rol_id'
    }),
    _ts_metadata("design:type", String)
], UsuarioRol.prototype, "rolId", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        type: 'timestamp',
        name: 'asignado_en'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], UsuarioRol.prototype, "asignadoEn", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'uuid',
        nullable: true,
        name: 'asignado_por'
    }),
    _ts_metadata("design:type", String)
], UsuarioRol.prototype, "asignadoPor", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'boolean',
        default: true
    }),
    _ts_metadata("design:type", Boolean)
], UsuarioRol.prototype, "activo", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_usuarioentity.Usuario, {
        onDelete: 'CASCADE'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'usuario_id'
    }),
    _ts_metadata("design:type", typeof _usuarioentity.Usuario === "undefined" ? Object : _usuarioentity.Usuario)
], UsuarioRol.prototype, "usuario", void 0);
_ts_decorate([
    (0, _typeorm.ManyToOne)(()=>_rolentity.Rol, {
        onDelete: 'CASCADE'
    }),
    (0, _typeorm.JoinColumn)({
        name: 'rol_id'
    }),
    _ts_metadata("design:type", typeof _rolentity.Rol === "undefined" ? Object : _rolentity.Rol)
], UsuarioRol.prototype, "rol", void 0);
UsuarioRol = _ts_decorate([
    (0, _typeorm.Entity)({
        name: 'usuario_rol'
    }),
    (0, _typeorm.Index)('idx_usuario_rol_usuario', [
        'usuarioId'
    ]),
    (0, _typeorm.Index)('idx_usuario_rol_rol', [
        'rolId'
    ]),
    (0, _typeorm.Index)('idx_usuario_rol_activo', [
        'activo'
    ])
], UsuarioRol);

//# sourceMappingURL=usuario-rol.entity.js.map