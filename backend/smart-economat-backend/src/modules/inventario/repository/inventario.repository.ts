import { Between, DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Inventario } from '../inventario.entity/inventario.entity';
import { InventoryQueryDto } from '../dto/inventory-query.dto';
import {
  StockConsolidadoDto,
  StockPorUbicacionDto,
} from '../dto/stock-result.dto';

/** Clase pública (InventarioRepository). Paquete: smart-economat-backend (Nest). */
@Injectable()
/**
 * Repositorio para operaciones de persistencia de inventario.
 */
export class InventarioRepository extends Repository<Inventario> {
  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(private dataSource: DataSource) {
    super(Inventario, dataSource.createEntityManager());
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findByProductoProveedor" en smart-economat-backend (Nest).
   * @undefined {string} productoProveedorId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Inventario[]>} Datos efectivos después de ejecutar la operación.
   */
  async findByProductoProveedor(
    productoProveedorId: string
  ): Promise<Inventario[]> {
    return this.find({
      where: { productoProveedor: { id: productoProveedorId } },
      relations: [
        'productoProveedor',
        'productoProveedor.producto',
        'productoProveedor.proveedor',
      ],
    });
  }

  /**
   * Busca stock bajo.
   * @returns Valor resultante de la operación.
   */
  /**
   * Expone "findStockBajo" en smart-economat-backend (Nest).
   * @undefined {Promise<Inventario[]>} Datos efectivos después de ejecutar la operación.
   */
  async findStockBajo(): Promise<Inventario[]> {
    return this.createQueryBuilder('inventario')
      .where('inventario.cantidad_actual < inventario.cantidad_minima')
      .leftJoinAndSelect('inventario.productoProveedor', 'productoProveedor')
      .leftJoinAndSelect('productoProveedor.producto', 'producto')
      .leftJoinAndSelect('productoProveedor.proveedor', 'proveedor')
      .leftJoinAndSelect('inventario.ubicacion', 'ubicacion')
      .getMany();
  }

  /**
   * Busca caducidad proxima.
   *
   * @param dias Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  async findCaducidadProxima(dias: number = 7): Promise<Inventario[]> {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + dias);
    return this.find({
      where: { fechaCaducidad: Between(hoy, limite) },
    });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "queryStock" en smart-economat-backend (Nest).
   * @undefined {InventoryQueryDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]>} Datos efectivos después de ejecutar la operación.
   */
  async queryStock(
    dto: InventoryQueryDto
  ): Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]> {
    const query = this.createQueryBuilder('inv')
      .innerJoinAndSelect('inv.productoProveedor', 'pp')
      .innerJoinAndSelect('pp.producto', 'producto')
      .innerJoinAndSelect('pp.proveedor', 'proveedor')
      .leftJoinAndSelect('inv.ubicacion', 'ubicacion');

    if (dto.ubicacionId) {
      query.andWhere('ubicacion.id = :ubicacionId', {
        ubicacionId: dto.ubicacionId,
      });
    }

    if (dto.productoId) {
      query.andWhere('producto.id = :productoId', {
        productoId: dto.productoId,
      });
    }

    if (dto.search) {
      query.andWhere(
        '(producto.nombre ILIKE :search OR producto.codigoBarras ILIKE :search OR ubicacion.nombre ILIKE :search OR proveedor.nombre ILIKE :search)',
        { search: `%${dto.search}%` }
      );
    }

    if (dto.onlyLowStock) {
      query.andWhere('inv.cantidadActual < inv.cantidadMinima');
    }

    const inventarioItems = await query.getMany();

    if (dto.consolidado) {
      const consolidated = new Map<string, StockConsolidadoDto>();

      for (const item of inventarioItems) {
        const producto = item.productoProveedor.producto;
        const existing = consolidated.get(producto.id);

        if (existing) {
          existing.stockTotal += Number(item.cantidadActual);
          continue;
        }

        consolidated.set(producto.id, {
          productoId: producto.id,
          productoNombre: producto.nombre,
          stockTotal: Number(item.cantidadActual),
        });
      }

      return Array.from(consolidated.values());
    }

    const byLocation = new Map<string, StockPorUbicacionDto>();

    for (const item of inventarioItems) {
      const producto = item.productoProveedor.producto;
      const ubicacion = item.ubicacion;
      const uId = ubicacion?.id ?? 'no-location';
      const uNombre = ubicacion?.nombre ?? 'Sin ubicación';
      const key = `${producto.id}:${uId}`;
      const existing = byLocation.get(key);

      if (existing) {
        existing.stock += Number(item.cantidadActual);
        continue;
      }

      byLocation.set(key, {
        productoId: producto.id,
        productoNombre: producto.nombre,
        ubicacionId: uId,
        ubicacionNombre: uNombre,
        stock: Number(item.cantidadActual),
      });
    }

    return Array.from(byLocation.values());
  }
}
