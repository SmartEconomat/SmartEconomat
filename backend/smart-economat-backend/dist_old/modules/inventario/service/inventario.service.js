"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "InventarioService", {
    enumerable: true,
    get: function() {
        return InventarioService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _inventariorepository = require("../repository/inventario.repository");
const _productoproveedorentity = require("../../producto/producto-proveedor.entity/producto-proveedor.entity");
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _movimientohelper = require("../../../common/helpers/movimiento.helper");
const _movimientoenums = require("../../movimiento/enums/movimiento.enums");
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
let InventarioService = class InventarioService {
    async create(dto, userId) {
        const productoProveedor = await this.productoProveedorRepository.findOne({
            where: {
                id: dto.productoProveedorId
            }
        });
        if (!productoProveedor) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND'));
        }
        const inventario = this.inventarioRepository.create({
            productoProveedor,
            cantidadActual: dto.cantidadActual,
            cantidadMinima: dto.cantidadMinima,
            cantidadMaxima: dto.cantidadMaxima ?? null,
            ubicacion: {
                id: dto.ubicacionId
            },
            fechaCaducidad: dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null
        });
        try {
            const savedInventario = await this.inventarioRepository.save(inventario);
            await this.movimientoHelper.trackInventarioMovimiento(userId, savedInventario.id, _movimientoenums.TipoMovimiento.ENTRADA, dto.cantidadActual, dto.productoProveedorId, 'Inventario', savedInventario.id, `Creación de inventario: ${productoProveedor.producto.nombre}`);
            return savedInventario;
        } catch (err) {
            if (err instanceof _typeorm1.QueryFailedError) {
                throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('INVENTARIO_CONSTRAINT_VIOLATION'));
            }
            throw err;
        }
    }
    async findAll() {
        return this.inventarioRepository.find({
            relations: [
                'productoProveedor',
                'productoProveedor.producto',
                'productoProveedor.proveedor',
                'ubicacion'
            ]
        });
    }
    async findOne(id) {
        const inventario = await this.inventarioRepository.findOne({
            where: {
                id
            },
            relations: [
                'productoProveedor',
                'productoProveedor.producto',
                'productoProveedor.proveedor',
                'ubicacion'
            ]
        });
        if (!inventario) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('INVENTARIO_NOT_FOUND'));
        }
        return inventario;
    }
    async update(id, dto, userId) {
        const inventario = await this.findOne(id);
        const oldCantidad = inventario.cantidadActual;
        if (dto.productoProveedorId !== undefined) {
            const productoProveedor = await this.productoProveedorRepository.findOne({
                where: {
                    id: dto.productoProveedorId
                }
            });
            if (!productoProveedor) {
                throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND'));
            }
            inventario.productoProveedor = productoProveedor;
        }
        if (dto.cantidadActual !== undefined) inventario.cantidadActual = dto.cantidadActual;
        if (dto.cantidadMinima !== undefined) inventario.cantidadMinima = dto.cantidadMinima;
        if (dto.cantidadMaxima !== undefined) inventario.cantidadMaxima = dto.cantidadMaxima ?? null;
        if (dto.ubicacionId !== undefined) inventario.ubicacion = {
            id: dto.ubicacionId
        };
        if (dto.fechaCaducidad !== undefined) inventario.fechaCaducidad = dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null;
        try {
            await this.inventarioRepository.save(inventario);
            if (dto.cantidadActual !== undefined && dto.cantidadActual !== oldCantidad) {
                const cantidad = Math.abs(dto.cantidadActual - oldCantidad);
                const tipo = dto.cantidadActual > oldCantidad ? _movimientoenums.TipoMovimiento.ENTRADA : _movimientoenums.TipoMovimiento.SALIDA;
                await this.movimientoHelper.trackInventarioMovimiento(userId, id, tipo, cantidad, inventario.productoProveedor.id, 'Inventario', id, `Ajuste de inventario: ${inventario.productoProveedor.producto.nombre} (${oldCantidad} -> ${dto.cantidadActual})`);
            }
        } catch (err) {
            if (err instanceof _typeorm1.QueryFailedError) {
                throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('INVENTARIO_CONSTRAINT_VIOLATION'));
            }
            throw err;
        }
        return this.findOne(id);
    }
    async remove(id, userId) {
        const inventario = await this.findOne(id);
        const result = await this.inventarioRepository.softDelete(id);
        if (result.affected === 0) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('INVENTARIO_NOT_FOUND'));
        }
        await this.movimientoHelper.trackInventarioMovimiento(userId, id, _movimientoenums.TipoMovimiento.SALIDA, inventario.cantidadActual, inventario.productoProveedor.id, 'Inventario', id, `Eliminación de inventario: ${inventario.productoProveedor.producto.nombre}`);
    }
    async obtenerAlertasCaducidad() {
        const productos = await this.inventarioRepository.findCaducidadProxima();
        return productos.filter((p)=>p.fechaCaducidad !== null).map((p)=>({
                id: p.id,
                fechaCaducidad: p.fechaCaducidad.toISOString()
            }));
    }
    async obtenerAlertasStock() {
        const productos = await this.inventarioRepository.findStockBajo();
        return productos.map((p)=>({
                id: p.id,
                cantidadActual: p.cantidadActual,
                cantidadMinima: p.cantidadMinima
            }));
    }
    constructor(inventarioRepository, productoProveedorRepository, movimientoHelper){
        this.inventarioRepository = inventarioRepository;
        this.productoProveedorRepository = productoProveedorRepository;
        this.movimientoHelper = movimientoHelper;
    }
};
InventarioService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(1, (0, _typeorm.InjectRepository)(_productoproveedorentity.ProductoProveedor)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _inventariorepository.InventarioRepository === "undefined" ? Object : _inventariorepository.InventarioRepository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _movimientohelper.MovimientoHelper === "undefined" ? Object : _movimientohelper.MovimientoHelper
    ])
], InventarioService);

//# sourceMappingURL=inventario.service.js.map