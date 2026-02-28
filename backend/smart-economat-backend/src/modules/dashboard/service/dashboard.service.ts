import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, In } from 'typeorm';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Pedido, EstadoPedido } from '../../pedido/pedido.entity/pedido.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    @InjectRepository(Inventario)
    private readonly inventarioRepository: Repository<Inventario>,
    @InjectRepository(Pedido)
    private readonly pedidoRepository: Repository<Pedido>,
    @InjectRepository(Movimiento)
    private readonly movimientoRepository: Repository<Movimiento>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>
  ) {}

  async getStats(): Promise<DashboardStatsDto> {
    this.logger.log('Fetching dashboard statistics...');

    const now = new Date();

    const expirationThreshold = new Date(now);
    expirationThreshold.setDate(now.getDate() + 7);

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0
    );

    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59,
      999
    );

    const valorInventarioRaw = await this.inventarioRepository
      .createQueryBuilder('inventario')
      .leftJoinAndSelect('inventario.productoProveedor', 'pp')
      .select(
        'SUM(inventario.cantidad_actual * COALESCE(pp.precio_unitario, 0))',
        'valorTotal'
      )
      .getRawOne();

    const valorTotal = parseFloat(
      valorInventarioRaw?.valorTotal
        ? String(valorInventarioRaw.valorTotal)
        : '0'
    );

    const itemsBajoStock = await this.inventarioRepository
      .createQueryBuilder('inventario')
      .where('inventario.cantidad_actual < inventario.cantidad_minima')
      .getCount();

    const totalItems = await this.inventarioRepository.count();

    const porCaducar = await this.inventarioRepository.count({
      where: {
        fechaCaducidad: Between(now, expirationThreshold),
      },
    });

    const caducados = await this.inventarioRepository.count({
      where: {
        fechaCaducidad: LessThan(now),
      },
    });

    const pedidosPendientes = await this.pedidoRepository.count({
      where: {
        estado: In([
          EstadoPedido.PENDIENTE,
          EstadoPedido.EN_PROCESO,
          EstadoPedido.INCIDENCIA,
        ]),
      },
    });

    const incidenciasCount = await this.pedidoRepository.count({
      where: {
        estado: EstadoPedido.INCIDENCIA,
      },
    });

    const completadosHoy = await this.pedidoRepository.count({
      where: {
        estado: EstadoPedido.RECIBIDO,
        fechaEntrega: Between(startOfDay, endOfDay),
      },
    });

    const costePendienteRaw = await this.pedidoRepository
      .createQueryBuilder('pedido')
      .select('SUM(pedido.coste_total)', 'costeTotal')
      .where('pedido.estado IN (:...estados)', {
        estados: [
          EstadoPedido.PENDIENTE,
          EstadoPedido.EN_PROCESO,
          EstadoPedido.INCIDENCIA,
        ],
      })
      .getRawOne();

    const costeTotalPendiente = parseFloat(
      costePendienteRaw?.costeTotal ? String(costePendienteRaw.costeTotal) : '0'
    );

    const totalProductos = await this.productoRepository.count();

    const productosEsteMes = await this.productoRepository.count({
      where: {
        createdAt: Between(startOfMonth, endOfMonth),
      },
    });

    const totalProveedores = await this.proveedorRepository.count();

    const movimientosRecientes = await this.movimientoRepository.find({
      take: 5,
      order: {
        createdAt: 'DESC',
      },
      relations: ['usuario'],
    });

    const productIds = movimientosRecientes
      .filter((m) => m.entidad === 'PRODUCTO')
      .map((m) => m.entidadId);

    const productMap = new Map<string, string>();
    if (productIds.length > 0) {
      const products = await this.productoRepository.find({
        where: { id: In(productIds) },
        select: ['id', 'nombre'],
      });
      products.forEach((p) => productMap.set(p.id, p.nombre));
    }

    const movimientosConNombres = movimientosRecientes.map((m) => {
      const plain = { ...m };
      if (m.entidad === 'PRODUCTO' && productMap.has(m.entidadId)) {
        (plain as any).productoNombre = productMap.get(m.entidadId);
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
        itemsBajoStock,
      },
      pedidos: {
        pendientes: pedidosPendientes,
        completadosHoy,
        costeTotalPendiente,
        incidencias: incidenciasCount,
      },
      alertas: {
        porCaducar,
        caducados,
      },
      movimientosRecientes: movimientosConNombres,
    };
  }
}
