import { Injectable } from '@nestjs/common';
import { MovimientoPort } from '../../modules/movimiento/ports/movimiento.port';
import { CreateMovimientoDto } from '../../modules/movimiento/dto/create-movimiento.dto';
import { TipoMovimiento } from '../../modules/movimiento/enums/movimiento.enums';

/**
 * Helper service to track movements across all services
 * This ensures that every user action creates a movimiento record
 */
@Injectable()
export class MovimientoHelper {
  constructor(private readonly movimientoPort: MovimientoPort) {}

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
   */
  async createMovimiento(
    userId: string,
    tipo: TipoMovimiento,
    entidad: string,
    entidadId: string,
    cantidad: number,
    inventarioId?: string,
    productoProveedorId?: string,
    descripcion?: string
  ) {
    const createMovimientoDto: CreateMovimientoDto = {
      tipo,
      cantidad,
      entidadTipo: entidad,
      entidadId,
      usuario: userId,
      inventario: inventarioId || undefined,
      productoProveedor: productoProveedorId || undefined,
      descripcion,
    };

    const movimiento = await this.movimientoPort.create(createMovimientoDto);

    return movimiento;
  }

  /**
   * Helper to create movement for product creation
   */
  async trackProductoCreation(
    userId: string,
    productoId: string,
    descripcion?: string
  ) {
    return this.createMovimiento(
      userId,
      TipoMovimiento.ENTRADA,
      'Producto',
      productoId,
      0,
      undefined,
      undefined,
      descripcion || `Creación de producto ${productoId}`
    );
  }

  /**
   * Helper to create movement for product update
   */
  async trackProductoUpdate(
    userId: string,
    productoId: string,
    descripcion?: string
  ) {
    return this.createMovimiento(
      userId,
      TipoMovimiento.AJUSTE,
      'Producto',
      productoId,
      0,
      undefined,
      undefined,
      descripcion || `Actualización de producto ${productoId}`
    );
  }

  /**
   * Helper to create movement for product deletion
   */
  async trackProductoDeletion(
    userId: string,
    productoId: string,
    descripcion?: string
  ) {
    return this.createMovimiento(
      userId,
      TipoMovimiento.SALIDA,
      'Producto',
      productoId,
      0,
      undefined,
      undefined,
      descripcion || `Eliminación de producto ${productoId}`
    );
  }

  /**
   * Helper to create movement for inventory operations
   */
  async trackInventarioMovimiento(
    userId: string,
    inventarioId: string,
    tipo: TipoMovimiento,
    cantidad: number,
    productoProveedorId?: string,
    entidad?: string,
    entidadId?: string,
    descripcion?: string
  ) {
    return this.createMovimiento(
      userId,
      tipo,
      entidad || 'Inventario',
      entidadId || inventarioId,
      cantidad,
      inventarioId,
      productoProveedorId,
      descripcion
    );
  }

  /**
   * Helper to create movement for pedido operations
   */
  async trackPedidoCreation(
    userId: string,
    pedidoId: string,
    descripcion?: string
  ) {
    return this.createMovimiento(
      userId,
      TipoMovimiento.PEDIDO,
      'Pedido',
      pedidoId,
      0,
      undefined,
      undefined,
      descripcion || `Creación de pedido ${pedidoId}`
    );
  }

  /**
   * Helper to create movement for recepcion operations
   */
  async trackRecepcion(
    userId: string,
    recepcionId: string,
    cantidad: number,
    inventarioId?: string,
    productoProveedorId?: string,
    descripcion?: string
  ) {
    return this.createMovimiento(
      userId,
      TipoMovimiento.ENTRADA_COMPRA,
      'Recepcion',
      recepcionId,
      cantidad,
      inventarioId,
      productoProveedorId,
      descripcion || `Recepción ${recepcionId}`
    );
  }
}
