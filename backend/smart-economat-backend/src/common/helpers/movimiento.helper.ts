import { Injectable } from '@nestjs/common';
import { MovimientoPort } from '../../modules/movimiento/ports/movimiento.port';
import { CreateMovimientoDto } from '../../modules/movimiento/dto/create-movimiento.dto';
import { TipoMovimiento } from '../../modules/movimiento/enums/movimiento.enums';

/**
 * Documentación en español.
 */
@Injectable()
export class MovimientoHelper {
  constructor(private readonly movimientoPort: MovimientoPort) {}

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
     */
  async trackProductoRestore(
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
      descripcion || `Restauración de producto ${productoId}`
    );
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
