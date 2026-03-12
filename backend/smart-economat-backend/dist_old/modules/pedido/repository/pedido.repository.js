"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PedidoRepository", {
    enumerable: true,
    get: function() {
        return PedidoRepository;
    }
});
const _common = require("@nestjs/common");
const _typeorm = require("typeorm");
const _pedidoentity = require("../pedido.entity/pedido.entity");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PedidoRepository = class PedidoRepository extends _typeorm.Repository {
    async findAllWithRelations(loadRelations = false) {
        return await this.find({
            relations: loadRelations ? [
                'usuario',
                'proveedor',
                'pedidoProductos',
                'pedidoProductos.productoProveedor',
                'pedidoProductos.productoProveedor.producto',
                'pedidoProductos.productoProveedor.proveedor',
                'recepcionesPedido'
            ] : [],
            order: {
                createdAt: 'DESC'
            }
        });
    }
    async findAllPaginated(query, loadRelations = false) {
        const page = query.page ?? 1;
        const limit = Math.min(query.limit ?? 100, 100);
        const [data, total] = await this.findAndCount({
            relations: loadRelations ? [
                'usuario',
                'proveedor',
                'pedidoProductos',
                'pedidoProductos.productoProveedor',
                'pedidoProductos.productoProveedor.producto',
                'pedidoProductos.productoProveedor.proveedor',
                'recepcionesPedido'
            ] : [],
            order: {
                createdAt: 'DESC'
            },
            skip: (page - 1) * limit,
            take: limit
        });
        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit) || 1
        };
    }
    async findOneWithRelations(id, loadRelations = false) {
        return await this.findOne({
            where: {
                id
            },
            relations: loadRelations ? [
                'usuario',
                'proveedor',
                'pedidoProductos',
                'pedidoProductos.productoProveedor',
                'pedidoProductos.productoProveedor.producto',
                'pedidoProductos.productoProveedor.proveedor',
                'recepcionesPedido'
            ] : []
        });
    }
    async findByEstado(estado, loadRelations = false) {
        return await this.find({
            where: {
                estado: estado
            },
            relations: loadRelations ? [
                'usuario',
                'proveedor',
                'pedidoProductos',
                'pedidoProductos.productoProveedor',
                'pedidoProductos.productoProveedor.producto',
                'pedidoProductos.productoProveedor.proveedor'
            ] : [],
            order: {
                createdAt: 'DESC'
            }
        });
    }
    async findByUsuario(idUsuario, loadRelations = false) {
        return await this.find({
            where: {
                usuario: {
                    id: idUsuario
                }
            },
            relations: loadRelations ? [
                'usuario',
                'proveedor',
                'pedidoProductos',
                'pedidoProductos.productoProveedor',
                'pedidoProductos.productoProveedor.producto',
                'pedidoProductos.productoProveedor.proveedor'
            ] : [],
            order: {
                createdAt: 'DESC'
            }
        });
    }
    constructor(dataSource){
        super(_pedidoentity.Pedido, dataSource.createEntityManager()), this.dataSource = dataSource;
    }
};
PedidoRepository = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm.DataSource === "undefined" ? Object : _typeorm.DataSource
    ])
], PedidoRepository);

//# sourceMappingURL=pedido.repository.js.map