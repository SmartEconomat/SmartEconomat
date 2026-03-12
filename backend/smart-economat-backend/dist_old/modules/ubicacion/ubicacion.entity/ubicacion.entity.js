"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "Ubicacion", {
    enumerable: true,
    get: function() {
        return Ubicacion;
    }
});
const _typeorm = require("typeorm");
const _baseentity = require("../../../common/entities/base.entity");
const _inventarioentity = require("../../inventario/inventario.entity/inventario.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let Ubicacion = class Ubicacion extends _baseentity.BaseEntity {
};
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 150,
        unique: true
    }),
    _ts_metadata("design:type", String)
], Ubicacion.prototype, "nombre", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'varchar',
        length: 255,
        nullable: true
    }),
    _ts_metadata("design:type", String)
], Ubicacion.prototype, "descripcion", void 0);
_ts_decorate([
    (0, _typeorm.OneToMany)(()=>_inventarioentity.Inventario, (inventario)=>inventario.ubicacion),
    _ts_metadata("design:type", typeof Relation === "undefined" ? Object : Relation)
], Ubicacion.prototype, "inventarios", void 0);
Ubicacion = _ts_decorate([
    (0, _typeorm.Entity)({
        name: 'ubicacion'
    })
], Ubicacion);

//# sourceMappingURL=ubicacion.entity.js.map