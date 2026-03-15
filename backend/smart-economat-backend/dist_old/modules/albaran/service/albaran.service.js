"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "AlbaranService", {
    enumerable: true,
    get: function() {
        return AlbaranService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _albaranentity = require("../albaran.entity/albaran.entity");
const _i18nhelper = require("../../../common/helpers/i18n.helper");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
function _ts_param(paramIndex, decorator) {
    return function(target, key) {
        decorator(target, key, paramIndex);
    };
}
let AlbaranService = class AlbaranService {
    async create(dto) {
        const albaran = this.albaranRepository.create(dto);
        return await this.albaranRepository.save(albaran);
    }
    async findAll() {
        return this.albaranRepository.find({
            relations: [
                'albaranPedidoRecepcion'
            ],
            order: {
                fecha: 'DESC'
            }
        });
    }
    async findOne(id) {
        const albaran = await this.albaranRepository.findOne({
            where: {
                id
            },
            relations: [
                'albaranPedidoRecepcion'
            ]
        });
        if (!albaran) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('ALBARAN_NOT_FOUND'));
        }
        return albaran;
    }
    async update(id, dto) {
        const albaran = await this.findOne(id);
        this.albaranRepository.merge(albaran, dto);
        return this.albaranRepository.save(albaran);
    }
    async remove(id) {
        const result = await this.albaranRepository.delete(id);
        if (result.affected === 0) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('ALBARAN_NOT_FOUND'));
        }
    }
    constructor(albaranRepository){
        this.albaranRepository = albaranRepository;
    }
};
AlbaranService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_albaranentity.Albaran)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], AlbaranService);

//# sourceMappingURL=albaran.service.js.map