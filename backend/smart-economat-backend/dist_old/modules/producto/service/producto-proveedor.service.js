"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "ProductoProveedorService", {
    enumerable: true,
    get: function() {
        return ProductoProveedorService;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("typeorm");
const _productoproveedorentity = require("../producto-proveedor.entity/producto-proveedor.entity");
const _historialentity = require("../historial-precio-proveedor.entity/historial.entity");
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
let ProductoProveedorService = class ProductoProveedorService {
    async updatePrecio(idProductoProveedor, updatePrecioDto) {
        const { nuevoPrecio } = updatePrecioDto;
        return await this.dataSource.transaction(async (manager)=>{
            const productoProveedor = await manager.findOne(_productoproveedorentity.ProductoProveedor, {
                where: {
                    id: idProductoProveedor
                }
            });
            if (!productoProveedor) {
                throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND'));
            }
            if (productoProveedor.precioUnitario === nuevoPrecio) {
                throw new _common.ConflictException(_i18nhelper.I18nHelper.getError('PRICE_NOT_CHANGED'));
            }
            const previousPrice = productoProveedor.precioUnitario;
            if (previousPrice !== undefined && previousPrice !== null) {
                const historial = new _historialentity.HistorialPrecio();
                historial.productoProveedor = productoProveedor;
                historial.precio = previousPrice;
                await manager.save(_historialentity.HistorialPrecio, historial);
            }
            productoProveedor.precioUnitario = nuevoPrecio;
            return await manager.save(_productoproveedorentity.ProductoProveedor, productoProveedor);
        });
    }
    async getHistorial(idProductoProveedor, query) {
        const repo = this.dataSource.getRepository(_historialentity.HistorialPrecio);
        const ppExists = await this.dataSource.manager.findOne(_productoproveedorentity.ProductoProveedor, {
            where: {
                id: idProductoProveedor
            }
        });
        if (!ppExists) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND'));
        }
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 20, 100);
        const [data, total] = await repo.findAndCount({
            where: {
                productoProveedor: {
                    id: idProductoProveedor
                }
            },
            order: {
                fecha: 'DESC'
            },
            skip: (page - 1) * limit,
            take: limit
        });
        const totalPages = Math.ceil(total / limit) || 1;
        return {
            data,
            total,
            page,
            limit,
            totalPages
        };
    }
    async search(dto) {
        const q = (dto.q ?? '').trim();
        const limit = dto.limit ?? 20;
        const offset = dto.offset ?? 0;
        const repo = this.dataSource.getRepository(_productoproveedorentity.ProductoProveedor);
        const qb = repo.createQueryBuilder('pp').leftJoin('pp.producto', 'producto').leftJoin('pp.proveedor', 'proveedor').select([
            'pp.id',
            'pp.marca',
            'pp.codigoBarras',
            'pp.precioUnitario',
            'producto.id',
            'producto.nombre',
            'proveedor.id',
            'proveedor.nombre'
        ]).orderBy('producto.nombre', 'ASC').addOrderBy('proveedor.nombre', 'ASC').take(limit).skip(offset);
        if (q.length > 0) {
            qb.where('(producto.nombre ILIKE :q OR proveedor.nombre ILIKE :q OR pp.marca ILIKE :q OR pp.codigoBarras ILIKE :q)', {
                q: `%${q}%`
            });
        }
        const rows = await qb.getMany();
        return rows.map((pp)=>({
                id: pp.id,
                productoId: pp.producto?.id,
                productoNombre: pp.producto?.nombre,
                proveedorId: pp.proveedor?.id,
                proveedorNombre: pp.proveedor?.nombre,
                marca: pp.marca,
                codigoBarras: pp.codigoBarras,
                precioUnitario: pp.precioUnitario
            }));
    }
    constructor(dataSource){
        this.dataSource = dataSource;
    }
};
ProductoProveedorService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm.DataSource === "undefined" ? Object : _typeorm.DataSource
    ])
], ProductoProveedorService);

//# sourceMappingURL=producto-proveedor.service.js.map