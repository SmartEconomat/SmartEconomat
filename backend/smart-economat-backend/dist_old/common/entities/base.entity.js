"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "BaseEntity", {
    enumerable: true,
    get: function() {
        return BaseEntity;
    }
});
const _typeorm = require("typeorm");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let BaseEntity = class BaseEntity {
};
_ts_decorate([
    (0, _typeorm.PrimaryColumn)('uuid', {
        default: ()=>'uuid_generate_v7()'
    }),
    _ts_metadata("design:type", String)
], BaseEntity.prototype, "id", void 0);
_ts_decorate([
    (0, _typeorm.CreateDateColumn)({
        type: 'timestamptz',
        name: 'created_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], BaseEntity.prototype, "createdAt", void 0);
_ts_decorate([
    (0, _typeorm.UpdateDateColumn)({
        type: 'timestamptz',
        name: 'updated_at'
    }),
    _ts_metadata("design:type", typeof Date === "undefined" ? Object : Date)
], BaseEntity.prototype, "updatedAt", void 0);
_ts_decorate([
    (0, _typeorm.DeleteDateColumn)({
        type: 'timestamptz',
        name: 'deleted_at',
        nullable: true
    }),
    _ts_metadata("design:type", Object)
], BaseEntity.prototype, "deletedAt", void 0);
_ts_decorate([
    (0, _typeorm.Column)({
        type: 'uuid',
        nullable: true,
        name: 'deleted_by'
    }),
    _ts_metadata("design:type", Object)
], BaseEntity.prototype, "deletedBy", void 0);
_ts_decorate([
    (0, _typeorm.VersionColumn)({
        default: 1
    }),
    _ts_metadata("design:type", Number)
], BaseEntity.prototype, "version", void 0);

//# sourceMappingURL=base.entity.js.map