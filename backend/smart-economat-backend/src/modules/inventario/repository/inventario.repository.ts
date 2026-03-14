import { Between, DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Inventario } from '../inventario.entity/inventario.entity';
import { InventoryQueryDto } from '../dto/inventory-query.dto';
import {
  StockConsolidadoDto,
  StockPorUbicacionDto,
} from '../dto/stock-result.dto';

@Injectable()
export class InventarioRepository extends Repository<Inventario> {
  constructor(private dataSource: DataSource) {
    super(Inventario, dataSource.createEntityManager());
  }

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

  async findStockBajo(): Promise<Inventario[]> {
    return this.createQueryBuilder('inventario')
      .where('inventario.cantidad_actual < inventario.cantidad_minima')
      .leftJoinAndSelect('inventario.productoProveedor', 'productoProveedor')
      .leftJoinAndSelect('productoProveedor.producto', 'producto')
      .leftJoinAndSelect('productoProveedor.proveedor', 'proveedor')
      .getMany();
  }

  async findCaducidadProxima(dias: number = 7): Promise<Inventario[]> {
    const hoy = new Date();
    const limite = new Date();
    limite.setDate(hoy.getDate() + dias);
    return this.find({
      where: { fechaCaducidad: Between(hoy, limite) },
    });
  }

  async queryStock(
    dto: InventoryQueryDto
  ): Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]> {
    const inventarioItems = await this.createQueryBuilder('inv')
      .innerJoinAndSelect('inv.productoProveedor', 'pp')
      .innerJoinAndSelect('pp.producto', 'producto')
      .innerJoinAndSelect('inv.ubicacion', 'ubicacion')
      .where(dto.ubicacionId ? 'ubicacion.id = :ubicacionId' : '1=1', {
        ubicacionId: dto.ubicacionId,
      })
      .getMany();

    const filteredItems = inventarioItems.filter((item) => {
      if (
        dto.productoId &&
        item.productoProveedor.producto.id !== dto.productoId
      ) {
        return false;
      }

      if (dto.onlyLowStock && !(item.cantidadActual < item.cantidadMinima)) {
        return false;
      }

      return true;
    });

    if (dto.consolidado) {
      const consolidated = new Map<string, StockConsolidadoDto>();

      for (const item of filteredItems) {
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

    for (const item of filteredItems) {
      const producto = item.productoProveedor.producto;
      const ubicacion = item.ubicacion;
      const key = `${producto.id}:${ubicacion.id}`;
      const existing = byLocation.get(key);

      if (existing) {
        existing.stock += Number(item.cantidadActual);
        continue;
      }

      byLocation.set(key, {
        productoId: producto.id,
        productoNombre: producto.nombre,
        ubicacionId: ubicacion.id,
        ubicacionNombre: ubicacion.nombre,
        stock: Number(item.cantidadActual),
      });
    }

    return Array.from(byLocation.values());
  }
}
