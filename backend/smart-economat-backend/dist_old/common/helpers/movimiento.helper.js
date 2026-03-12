"use strict";
Object.defineProperty(exports, "__esModule", {
    value: true
});
Object.defineProperty(exports, "MovimientoHelper", {
    enumerable: true,
    get: function() {
        return MovimientoHelper;
    }
});
const _common = require("@nestjs/common");
const _movimientoservice = require("../../modules/movimiento/service/movimiento.service");
const _movimientoenums = require("../../modules/movimiento/enums/movimiento.enums");
function _ts_decorate(decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for(var i = decorators.length - 1; i >= 0; i--)if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
}
function _ts_metadata(k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
}
let MovimientoHelper = class MovimientoHelper {
    /**
   * Create a movement record for any user action
   * @param userId ID of the user performing the action
   * @param tipo Type of movement (ENTRADA, SALIDA, AJUSTE, etc.)
   * @param entidad Entity type that caused the movement
   * @param entidadId ID of the entity that caused the movement
   * @param cantidad Quantity moved (always positive)
   * @param inventarioId ID of the inventory item affected
   * @param productoProveedorId ID of the product provider affected
   * @param descripcion Optional description of the movement
   */ async createMovimiento(userId, tipo, entidad, entidadId, cantidad, inventarioId, productoProveedorId, descripcion) {
        const createMovimientoDto = {
            tipo,
            cantidad,
            entidadTipo: entidad,
            entidadId,
            usuario: userId,
            inventario: inventarioId || undefined,
            descripcion
        };
        const movimiento = await this.movimientoService.create(createMovimientoDto);
        return movimiento;
    }
    /**
   * Helper to create movement for product creation
   */ async trackProductoCreation(userId, productoId, descripcion) {
        return this.createMovimiento(userId, _movimientoenums.TipoMovimiento.ENTRADA, 'Producto', productoId, 0, undefined, undefined, descripcion || `Creación de producto ${productoId}`);
    }
    /**
   * Helper to create movement for product update
   */ async trackProductoUpdate(userId, productoId, descripcion) {
        return this.createMovimiento(userId, _movimientoenums.TipoMovimiento.AJUSTE, 'Producto', productoId, 0, undefined, undefined, descripcion || `Actualización de producto ${productoId}`);
    }
    /**
   * Helper to create movement for product deletion
   */ async trackProductoDeletion(userId, productoId, descripcion) {
        return this.createMovimiento(userId, _movimientoenums.TipoMovimiento.SALIDA, 'Producto', productoId, 0, undefined, undefined, descripcion || `Eliminación de producto ${productoId}`);
    }
    /**
   * Helper to create movement for inventory operations
   */ async trackInventarioMovimiento(userId, inventarioId, tipo, cantidad, productoProveedorId, entidad, entidadId, descripcion) {
        return this.createMovimiento(userId, tipo, entidad || 'Inventario', entidadId || inventarioId, cantidad, inventarioId, productoProveedorId, descripcion);
    }
    /**
   * Helper to create movement for pedido operations
   */ async trackPedidoCreation(userId, pedidoId, descripcion) {
        return this.createMovimiento(userId, _movimientoenums.TipoMovimiento.PEDIDO, 'Pedido', pedidoId, 0, undefined, undefined, descripcion || `Creación de pedido ${pedidoId}`);
    }
    /**
   * Helper to create movement for recepcion operations
   */ async trackRecepcion(userId, recepcionId, cantidad, inventarioId, productoProveedorId, descripcion) {
        return this.createMovimiento(userId, _movimientoenums.TipoMovimiento.ENTRADA_COMPRA, 'Recepcion', recepcionId, cantidad, inventarioId, productoProveedorId, descripcion || `Recepción ${recepcionId}`);
    }
    constructor(movimientoService){
        this.movimientoService = movimientoService;
    }
};
MovimientoHelper = _ts_decorate([
    (0, _common.Injectable)(),
    _ts_metadata("design:type", Function),
    _ts_metadata("design:paramtypes", [
        typeof _movimientoservice.MovimientoService === "undefined" ? Object : _movimientoservice.MovimientoService
    ])
], MovimientoHelper);

//# sourceMappingURL=movimiento.helper.js.map