"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MovimientoService", {
    enumerable: true,
    get: function() {
        return MovimientoService;
    }
});
const _common = require("@nestjs/common");
const _movimientorepository = require("../repository/movimiento.repository");
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
let MovimientoService = class MovimientoService {
    create(createMovimiento) {
        return this.movimientoRepo.createMovimiento(createMovimiento);
    }
    async findAll(query) {
        return this.movimientoRepo.findAll(query);
    }
    async findOne(id) {
        const mov = await this.movimientoRepo.findById(id);
        if (!mov) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('MOVEMENT_NOT_FOUND'));
        }
        return mov;
    }
    update(id, dto) {
        return this.movimientoRepo.updateMovimiento(id, dto);
    }
    async remove(id) {
        const result = await this.movimientoRepo.deleteMovimiento(id);
        if (!result.affected) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('MOVEMENT_NOT_FOUND'));
        }
    }
    /**
   * Obtiene el historial de movimientos de un producto o usuario.
   *
   * @param dto - DTOs con filtros (entityId, userId, type, startDate, endDate, sortBy, sortOrder)
   * @returns Array de movimientos ordenados cronológicamente
   * @throws BadRequestException si no proporciona entityId o userId
   * @throws NotFoundException si no hay movimientos que coincidan
   * @throws ForbiddenException si intenta acceder a datos no autorizados
   *
   * @example
   *
   * getMovimientoHistory({ entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5' })
   *
   *
   * getMovimientoHistory({
   *   entityId: '019c9b4f-74f8-7a6e-8b5b-96191c30c1e5',
   *   type: 'ENTRADA',
   *   startDate: '2026-01-01',
   *   endDate: '2026-02-28',
   *   sortBy: 'createdAt',
   *   sortOrder: 'DESC'
   * })
   */ async getMovimientoHistory(dto) {
        if (!dto.entityId && !dto.userId) {
            throw new _common.BadRequestException('Debe proporcionar entityId (ProductoProveedor) o userId (Usuario) para buscar el historial');
        }
        if (dto.startDate && dto.endDate) {
            const startDate = new Date(dto.startDate);
            const endDate = new Date(dto.endDate);
            if (startDate > endDate) {
                throw new _common.BadRequestException('La fecha de inicio no puede ser posterior a la fecha de fin');
            }
        }
        const movimientos = await this.movimientoRepo.findMovimientosByEntity(dto);
        if (!movimientos || movimientos.length === 0) {
            throw new _common.NotFoundException('No se encontraron movimientos que coincidan con los criterios especificados');
        }
        return movimientos;
    }
    constructor(movimientoRepo){
        this.movimientoRepo = movimientoRepo;
    }
};
MovimientoService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _movimientorepository.MovimientoRepository === "undefined" ? Object : _movimientorepository.MovimientoRepository
    ])
], MovimientoService);

//# sourceMappingURL=movimiento.service.js.map