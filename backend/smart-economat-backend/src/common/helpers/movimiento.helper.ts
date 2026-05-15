import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { MovimientoPort } from '../../modules/movimiento/ports/movimiento.port';
import { CreateMovimientoDto } from '../../modules/movimiento/dto/create-movimiento.dto';
import {
  TipoMovimiento,
  AccionMovimiento,
} from '../../modules/movimiento/enums/movimiento.enums';

/**
 * Ayudante para facilitar el registro de movimientos de stock y auditoría.
 * Proporciona métodos específicos para rastrear acciones sobre productos, inventario y pedidos.
 */
@Injectable()
export class MovimientoHelper {
  /**
   * Construye la instancia configurada.
   * @undefined {MovimientoPort} movimientoPort - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly movimientoPort: MovimientoPort) {}

  private normalizeNullableId(value?: string): string | undefined {
    return value && value.trim().length > 0 ? value : undefined;
  }

  /**
   * Registra un movimiento genérico en el sistema.
   * @param userId ID del usuario que genera el movimiento.
   * @param tipo Tipo de movimiento (ENTRADA, SALIDA, etc.).
   * @param entidad Nombre de la entidad afectada.
   * @param entidadId UUID de la entidad.
   * @param cantidad Cantidad involucrada en el movimiento.
   * @param inventarioId ID del registro de inventario (opcional).
   * @param productoProveedorId ID de la relación producto-proveedor (opcional).
   * @param descripcion Detalle textual de la acción.
   * @param accion Acción realizada (CREATE, UPDATE, etc.).
   * @param before Datos antes del cambio.
   * @param after Datos después del cambio.
   * @param manager EntityManager opcional para transacciones.
   * @returns El registro del movimiento creado.
   */
  async createMovimiento(
    userId: string | undefined,
    tipo: TipoMovimiento,
    entidad: string,
    entidadId: string,
    cantidad?: number,
    inventarioId?: string,
    productoProveedorId?: string,
    descripcion?: string,
    accion?: AccionMovimiento,
    before?: any,
    after?: any,
    manager?: EntityManager
  ) {
    const createMovimientoDto: CreateMovimientoDto = {
      tipo,
      accion,
      cantidad,
      entidadTipo: entidad,
      entidadId,
      usuario: this.normalizeNullableId(userId),
      inventario: inventarioId || undefined,
      productoProveedor: productoProveedorId || undefined,
      descripcion,
      datosAntes: before,
      datosDespues: after,
    };

    const movimiento = await this.movimientoPort.create(
      createMovimientoDto,
      manager
    );

    return movimiento;
  }

  /**
   * Expone "log" en smart-economat-backend (Nest).
   * @undefined {{ userId?: string; tipo?: TipoMovimiento; accion?: AccionMovimiento; entidad: string; entidadId: string; cantidad?: number; inventarioId?: string; productoProveedorId?: string; descripcion?: string; before?: unknown; after?: unknown; manager?: EntityManager; }} params - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity").Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  async log(params: {
    userId?: string;
    tipo?: TipoMovimiento;
    accion?: AccionMovimiento;
    entidad: string;
    entidadId: string;
    cantidad?: number;
    inventarioId?: string;
    productoProveedorId?: string;
    descripcion?: string;
    before?: unknown;
    after?: unknown;
    manager?: EntityManager;
  }) {
    return this.createMovimiento(
      this.normalizeNullableId(params.userId),
      params.tipo || TipoMovimiento.AUDITORIA,
      params.entidad,
      params.entidadId,
      params.cantidad,
      this.normalizeNullableId(params.inventarioId),
      this.normalizeNullableId(params.productoProveedorId),
      params.descripcion,
      params.accion,
      params.before,
      params.after,
      params.manager
    );
  }

  /**
   * Método genérico para rastrear acciones de auditoría.
   */
  /**
   * Expone "trackAction" en smart-economat-backend (Nest).
   * @undefined {{ userId?: string; entidad: string; entidadId: string; accion: AccionMovimiento; descripcion?: string; before?: any; after?: any; tipo?: TipoMovimiento; cantidad?: number; manager?: EntityManager; }} params - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity").Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  async trackAction(params: {
    userId?: string;
    entidad: string;
    entidadId: string;
    accion: AccionMovimiento;
    descripcion?: string;
    before?: any;
    after?: any;
    tipo?: TipoMovimiento;
    cantidad?: number;
    manager?: EntityManager;
  }) {
    return this.log({
      userId: params.userId,
      tipo: params.tipo || TipoMovimiento.AUDITORIA,
      entidad: params.entidad,
      entidadId: params.entidadId,
      cantidad: params.cantidad,
      descripcion: params.descripcion,
      accion: params.accion,
      before: params.before,
      after: params.after,
      manager: params.manager,
    });
  }

  /**
   * Registra la creación de un nuevo producto maestro.
   * @param userId Usuario creador.
   * @param productoId UUID del producto.
   * @param descripcion Descripción opcional.
   */
  /**
   * Expone "trackProductoCreation" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} productoId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} descripcion - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity").Movimiento>} Datos efectivos después de ejecutar la operación.
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
      descripcion || `Creación de producto ${productoId}`,
      AccionMovimiento.CREATE
    );
  }

  /**
   * Registra la actualización de datos de un producto maestro.
   */
  /**
   * Expone "trackProductoUpdate" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} productoId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} descripcion - Entrada efectiva esperada por el contrato.
   * @undefined {any} before - Entrada efectiva esperada por el contrato.
   * @undefined {any} after - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity").Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  async trackProductoUpdate(
    userId: string,
    productoId: string,
    descripcion?: string,
    before?: any,
    after?: any
  ) {
    return this.createMovimiento(
      userId,
      TipoMovimiento.AJUSTE,
      'Producto',
      productoId,
      0,
      undefined,
      undefined,
      descripcion || `Actualización de producto ${productoId}`,
      AccionMovimiento.UPDATE,
      before,
      after
    );
  }

  /**
   * Registra la restauración (un-delete) de un producto.
   */
  /**
   * Expone "trackProductoRestore" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} productoId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} descripcion - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity").Movimiento>} Datos efectivos después de ejecutar la operación.
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
      descripcion || `Restauración de producto ${productoId}`,
      AccionMovimiento.UPDATE
    );
  }

  /**
   * Registra la eliminación lógica de un producto.
   */
  /**
   * Expone "trackProductoDeletion" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} productoId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} descripcion - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity").Movimiento>} Datos efectivos después de ejecutar la operación.
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
      descripcion || `Eliminación de producto ${productoId}`,
      AccionMovimiento.DELETE
    );
  }

  /**
   * Registra un cambio en el inventario físico.
   */
  /**
   * Expone "trackInventarioMovimiento" en smart-economat-backend (Nest).
   * @undefined {string | undefined} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} inventarioId - Entrada efectiva esperada por el contrato.
   * @undefined {TipoMovimiento} tipo - Entrada efectiva esperada por el contrato.
   * @undefined {number} cantidad - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} productoProveedorId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} entidad - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} entidadId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} descripcion - Entrada efectiva esperada por el contrato.
   * @undefined {AccionMovimiento | undefined} accion - Entrada efectiva esperada por el contrato.
   * @undefined {any} before - Entrada efectiva esperada por el contrato.
   * @undefined {any} after - Entrada efectiva esperada por el contrato.
   * @undefined {EntityManager | undefined} manager - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity").Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  async trackInventarioMovimiento(
    userId: string | undefined,
    inventarioId: string,
    tipo: TipoMovimiento,
    cantidad: number,
    productoProveedorId?: string,
    entidad?: string,
    entidadId?: string,
    descripcion?: string,
    accion?: AccionMovimiento,
    before?: any,
    after?: any,
    manager?: EntityManager
  ) {
    return this.createMovimiento(
      userId,
      tipo,
      entidad || 'Inventario',
      entidadId || inventarioId,
      cantidad,
      inventarioId,
      productoProveedorId,
      descripcion,
      accion,
      before,
      after,
      manager
    );
  }

  /**
   * Registra la creación de un nuevo pedido.
   */
  /**
   * Expone "trackPedidoCreation" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} pedidoId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} descripcion - Entrada efectiva esperada por el contrato.
   * @undefined {any} after - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity").Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  async trackPedidoCreation(
    userId: string,
    pedidoId: string,
    descripcion?: string,
    after?: any,
    manager?: EntityManager
  ) {
    return this.createMovimiento(
      userId,
      TipoMovimiento.PEDIDO,
      'Pedido',
      pedidoId,
      0,
      undefined,
      undefined,
      descripcion || `Creación de pedido ${pedidoId}`,
      AccionMovimiento.CREATE,
      undefined,
      after,
      manager
    );
  }

  /**
   * Registra la recepción de mercancía vinculada a una compra.
   */
  /**
   * Expone "trackRecepcion" en smart-economat-backend (Nest).
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {string} recepcionId - Entrada efectiva esperada por el contrato.
   * @undefined {number} cantidad - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} inventarioId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} productoProveedorId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} descripcion - Entrada efectiva esperada por el contrato.
   * @undefined {AccionMovimiento | undefined} accion - Entrada efectiva esperada por el contrato.
   * @undefined {any} before - Entrada efectiva esperada por el contrato.
   * @undefined {any} after - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/movimiento/movimiento.entity/movimiento.entity").Movimiento>} Datos efectivos después de ejecutar la operación.
   */
  async trackRecepcion(
    userId: string,
    recepcionId: string,
    cantidad: number,
    inventarioId?: string,
    productoProveedorId?: string,
    descripcion?: string,
    accion?: AccionMovimiento,
    before?: any,
    after?: any
  ) {
    return this.createMovimiento(
      userId,
      TipoMovimiento.ENTRADA_COMPRA,
      'Recepcion',
      recepcionId,
      cantidad,
      inventarioId,
      productoProveedorId,
      descripcion || `Recepción ${recepcionId}`,
      accion || AccionMovimiento.CREATE,
      before,
      after
    );
  }
}
