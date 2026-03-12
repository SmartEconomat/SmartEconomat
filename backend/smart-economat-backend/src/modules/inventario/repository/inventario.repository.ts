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
    const qb = this.createQueryBuilder('inv')
      .innerJoin('inv.productoProveedor', 'pp')
      .innerJoin('pp.producto', 'producto')
      .innerJoin('inv.ubicacion', 'ubicacion')
      .select('producto.id', 'productoId')
      .addSelect('producto.nombre', 'productoNombre')
      .addSelect('SUM(inv.cantidadActual)', 'stock');

    if (dto.productoId) {
      qb.andWhere('producto.id = :productoId', { productoId: dto.productoId });
    }

    if (dto.ubicacionId) {
      qb.andWhere('ubicacion.id = :ubicacionId', {
        ubicacionId: dto.ubicacionId,
      });
    }

    if (dto.onlyLowStock) {
      qb.andWhere('inv.cantidadActual < inv.cantidadMinima');
    }

    if (dto.consolidado) {
      qb.groupBy('producto.id').addGroupBy('producto.nombre');

      const rows = await qb.getRawMany<{
        productoId: string;
        productoNombre: string;
        stock: string;
      }>();

      return rows.map((r) => ({
        productoId: r.productoId,
        productoNombre: r.productoNombre,
        stockTotal: Number(r.stock),
      }));
    }

    qb.addSelect('ubicacion.id', 'ubicacionId')
      .addSelect('ubicacion.nombre', 'ubicacionNombre')
      .groupBy('producto.id')
      .addGroupBy('producto.nombre')
      .addGroupBy('ubicacion.id')
      .addGroupBy('ubicacion.nombre');

    const rows = await qb.getRawMany<{
      productoId: string;
      productoNombre: string;
      ubicacionId: string;
      ubicacionNombre: string;
      stock: string;
    }>();

    return rows.map((r) => ({
      productoId: r.productoId,
      productoNombre: r.productoNombre,
      ubicacionId: r.ubicacionId,
      ubicacionNombre: r.ubicacionNombre,
      stock: Number(r.stock),
    }));
  }
}
