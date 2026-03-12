"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "PedidoService", {
    enumerable: true,
    get: function() {
        return PedidoService;
    }
});
const _common = require("@nestjs/common");
const _estadopedidoenum = require("../enums/estado-pedido.enum");
const _pedidorepository = require("../repository/pedido.repository");
const _pedidoproductoentity = require("../pedido-producto.entity/pedido-producto.entity");
const _i18nhelper = require("../../../common/helpers/i18n.helper");
const _movimientohelper = require("../../../common/helpers/movimiento.helper");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let PedidoService = class PedidoService {
    async create(createPedidoDto, userId) {
        const { pedidoProductos, productos, fechaEntrega, proveedorId, ...pedidoFields } = createPedidoDto;
        const lineas = (pedidoProductos ?? []).map((pp)=>({
                productoProveedor: {
                    id: pp.productoProveedorId
                },
                cantidad: pp.cantidad,
                precioUnitario: pp.precioUnitario,
                observaciones: pp.observaciones
            })).concat((productos ?? []).map((p)=>({
                productoProveedor: {
                    id: p.idProductoProveedor
                },
                cantidad: p.cantidad,
                precioUnitario: p.precioUnitario,
                observaciones: p.observaciones
            })));
        if (lineas.length === 0) {
            throw new _common.BadRequestException('El pedido debe contener al menos un producto.');
        }
        const pedido = this.pedidoRepository.create({
            ...pedidoFields,
            proveedor: {
                id: proveedorId
            },
            estado: _estadopedidoenum.EstadoPedido.PENDIENTE,
            costeTotal: createPedidoDto.costeTotal || 0,
            pedidoProductos: lineas,
            ...fechaEntrega ? {
                fechaEntrega: new Date(fechaEntrega)
            } : {}
        });
        const savedPedido = await this.pedidoRepository.save(pedido);
        await this.movimientoHelper.trackPedidoCreation(userId, savedPedido.id, `Creación de pedido #${savedPedido.id}`);
        return savedPedido;
    }
    async findAll(query) {
        return await this.pedidoRepository.findAllPaginated(query, true);
    }
    async findOne(id) {
        const pedido = await this.pedidoRepository.findOneWithRelations(id, true);
        if (!pedido) {
            throw new _common.NotFoundException(_i18nhelper.I18nHelper.getError('ORDER_NOT_FOUND'));
        }
        return pedido;
    }
    async update(id, updatePedidoDto) {
        const pedido = await this.findOne(id);
        if (updatePedidoDto.fechaEntrega) {
            pedido.fechaEntrega = new Date(updatePedidoDto.fechaEntrega);
        }
        if (updatePedidoDto.estado) {
            pedido.estado = updatePedidoDto.estado;
        }
        if (updatePedidoDto.proveedorId) {
            pedido.proveedor = {
                id: updatePedidoDto.proveedorId
            };
        }
        const lineasOriginales = (updatePedidoDto.pedidoProductos ?? []).map((pp)=>({
                productoProveedor: {
                    id: pp.productoProveedorId
                },
                cantidad: pp.cantidad,
                precioUnitario: pp.precioUnitario,
                observaciones: pp.observaciones
            })).concat((updatePedidoDto.productos ?? []).map((p)=>({
                productoProveedor: {
                    id: p.idProductoProveedor
                },
                cantidad: p.cantidad,
                precioUnitario: p.precioUnitario,
                observaciones: p.observaciones
            })));
        if (lineasOriginales.length === 0 && (updatePedidoDto.pedidoProductos !== undefined || updatePedidoDto.productos !== undefined)) {
            throw new _common.BadRequestException('El pedido debe contener al menos un producto.');
        }
        if (updatePedidoDto.pedidoProductos !== undefined || updatePedidoDto.productos !== undefined) {
            await this.pedidoRepository.manager.delete(_pedidoproductoentity.PedidoProducto, {
                pedido: {
                    id
                }
            });
            pedido.pedidoProductos = lineasOriginales;
            const costeRedux = lineasOriginales.reduce((total, l)=>total + l.cantidad * l.precioUnitario, 0);
            pedido.costeTotal = updatePedidoDto.costeTotal ?? costeRedux;
        }
        return await this.pedidoRepository.save(pedido);
    }
    async updateFechaEntrega(id, dto) {
        const pedido = await this.findOne(id);
        if (dto.fechaEntrega) {
            pedido.fechaEntrega = new Date(dto.fechaEntrega);
            return await this.pedidoRepository.save(pedido);
        }
        return pedido;
    }
    async cancelarPedido(id, dto) {
        const pedido = await this.findOne(id);
        if (pedido.estado === _estadopedidoenum.EstadoPedido.RECIBIDO || pedido.estado === _estadopedidoenum.EstadoPedido.EN_PROCESO) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('ORDER_NOT_CANCELLABLE'));
        }
        pedido.cancelar(dto.motivoCancelacion);
        return await this.pedidoRepository.save(pedido);
    }
    async remove(id) {
        const pedido = await this.findOne(id);
        if (pedido.estado !== _estadopedidoenum.EstadoPedido.PENDIENTE && pedido.estado !== _estadopedidoenum.EstadoPedido.CANCELADO) {
            throw new _common.BadRequestException(_i18nhelper.I18nHelper.getError('ORDER_CANNOT_BE_DELETED'));
        }
        await this.pedidoRepository.remove(pedido);
    }
    constructor(pedidoRepository, movimientoHelper){
        this.pedidoRepository = pedidoRepository;
        this.movimientoHelper = movimientoHelper;
    }
};
PedidoService = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _pedidorepository.PedidoRepository === "undefined" ? Object : _pedidorepository.PedidoRepository,
        typeof _movimientohelper.MovimientoHelper === "undefined" ? Object : _movimientohelper.MovimientoHelper
    ])
], PedidoService);

//# sourceMappingURL=pedido.service.js.map