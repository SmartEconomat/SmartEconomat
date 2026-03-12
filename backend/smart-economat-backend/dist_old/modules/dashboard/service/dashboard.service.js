"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "DashboardService", {
    enumerable: true,
    get: function() {
        return DashboardService;
    }
});
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _common = require("@nestjs/common");
const _typeorm = require("@nestjs/typeorm");
const _typeorm1 = require("typeorm");
const _inventarioentity = require("../../inventario/inventario.entity/inventario.entity");
const _pedidoentity = require("../../pedido/pedido.entity/pedido.entity");
const _movimientoentity = require("../../movimiento/movimiento.entity/movimiento.entity");
const _productoentity = require("../../producto/producto.entity/producto.entity");
const _proveedorentity = require("../../proveedor/proveedor.entity/proveedor.entity");
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
let DashboardService = class DashboardService {
    async getStats() {
        this.logger.log(_i18nhelper.I18nHelper.translate('logs.FETCHING_DASHBOARD_STATISTICS'));
        const now = new Date();
        const expirationThreshold = new Date(now);
        expirationThreshold.setDate(now.getDate() + 7);
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        const valorInventarioRaw = await this.inventarioRepository.createQueryBuilder('inventario').leftJoinAndSelect('inventario.productoProveedor', 'pp').select('SUM(inventario.cantidad_actual * COALESCE(pp.precio_unitario, 0))', 'valorTotal').getRawOne();
        const valorTotal = parseFloat(valorInventarioRaw?.valorTotal ? String(valorInventarioRaw.valorTotal) : '0');
        const itemsBajoStock = await this.inventarioRepository.createQueryBuilder('inventario').where('inventario.cantidad_actual < inventario.cantidad_minima').getCount();
        const totalItems = await this.inventarioRepository.count();
        const porCaducar = await this.inventarioRepository.count({
            where: {
                fechaCaducidad: (0, _typeorm1.Between)(now, expirationThreshold)
            }
        });
        const caducados = await this.inventarioRepository.count({
            where: {
                fechaCaducidad: (0, _typeorm1.LessThan)(now)
            }
        });
        const pedidosPendientes = await this.pedidoRepository.count({
            where: {
                estado: (0, _typeorm1.In)([
                    _pedidoentity.EstadoPedido.PENDIENTE,
                    _pedidoentity.EstadoPedido.EN_PROCESO,
                    _pedidoentity.EstadoPedido.INCIDENCIA
                ])
            }
        });
        const incidenciasCount = await this.pedidoRepository.count({
            where: {
                estado: _pedidoentity.EstadoPedido.INCIDENCIA
            }
        });
        const completadosHoy = await this.pedidoRepository.count({
            where: {
                estado: _pedidoentity.EstadoPedido.RECIBIDO,
                fechaEntrega: (0, _typeorm1.Between)(startOfDay, endOfDay)
            }
        });
        const costePendienteRaw = await this.pedidoRepository.createQueryBuilder('pedido').select('SUM(pedido.coste_total)', 'costeTotal').where('pedido.estado IN (:...estados)', {
            estados: [
                _pedidoentity.EstadoPedido.PENDIENTE,
                _pedidoentity.EstadoPedido.EN_PROCESO,
                _pedidoentity.EstadoPedido.INCIDENCIA
            ]
        }).getRawOne();
        const costeTotalPendiente = parseFloat(costePendienteRaw?.costeTotal ? String(costePendienteRaw.costeTotal) : '0');
        const totalProductos = await this.productoRepository.count();
        const productosEsteMes = await this.productoRepository.count({
            where: {
                createdAt: (0, _typeorm1.Between)(startOfMonth, endOfMonth)
            }
        });
        const totalProveedores = await this.proveedorRepository.count();
        const movimientosRecientes = await this.movimientoRepository.find({
            take: 5,
            order: {
                createdAt: 'DESC'
            },
            relations: [
                'usuario'
            ]
        });
        const productIds = movimientosRecientes.filter((m)=>m.entidad === 'PRODUCTO').map((m)=>m.entidadId);
        const productMap = new Map();
        if (productIds.length > 0) {
            const products = await this.productoRepository.find({
                where: {
                    id: (0, _typeorm1.In)(productIds)
                },
                select: [
                    'id',
                    'nombre'
                ]
            });
            products.forEach((p)=>productMap.set(p.id, p.nombre));
        }
        const movimientosConNombres = movimientosRecientes.map((m)=>{
            const plain = {
                ...m
            };
            if (m.entidad === 'PRODUCTO' && productMap.has(m.entidadId)) {
                plain.productoNombre = productMap.get(m.entidadId);
            }
            return plain;
        });
        return {
            totalProductos,
            productosEsteMes,
            totalProveedores,
            inventario: {
                valorTotal,
                totalItems,
                itemsBajoStock
            },
            pedidos: {
                pendientes: pedidosPendientes,
                completadosHoy,
                costeTotalPendiente,
                incidencias: incidenciasCount
            },
            alertas: {
                porCaducar,
                caducados
            },
            movimientosRecientes: movimientosConNombres
        };
    }
    constructor(inventarioRepository, pedidoRepository, movimientoRepository, productoRepository, proveedorRepository){
        this.inventarioRepository = inventarioRepository;
        this.pedidoRepository = pedidoRepository;
        this.movimientoRepository = movimientoRepository;
        this.productoRepository = productoRepository;
        this.proveedorRepository = proveedorRepository;
        this.logger = new _common.Logger(DashboardService.name);
    }
};
DashboardService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_param(0, (0, _typeorm.InjectRepository)(_inventarioentity.Inventario)),
    _ts_param(1, (0, _typeorm.InjectRepository)(_pedidoentity.Pedido)),
    _ts_param(2, (0, _typeorm.InjectRepository)(_movimientoentity.Movimiento)),
    _ts_param(3, (0, _typeorm.InjectRepository)(_productoentity.Producto)),
    _ts_param(4, (0, _typeorm.InjectRepository)(_proveedorentity.Proveedor)),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository,
        typeof _typeorm1.Repository === "undefined" ? Object : _typeorm1.Repository
    ])
], DashboardService);

//# sourceMappingURL=dashboard.service.js.map