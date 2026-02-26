import { Between, DataSource, Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Inventario } from '../inventario.entity/inventario.entity';

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
}
