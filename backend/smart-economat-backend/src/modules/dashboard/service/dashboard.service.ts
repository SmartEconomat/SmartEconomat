/**
 * @module DashboardService
 * Service layer for computing dashboard KPI statistics.
 * Aggregates data from inventory, orders, movements, products, suppliers and
 * incidencias into a single response DTO.
 */
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, Between, In, IsNull } from 'typeorm';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Pedido, EstadoPedido } from '../../pedido/pedido.entity/pedido.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { Proveedor } from '../../proveedor/proveedor.entity/proveedor.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { DashboardStatsDto } from '../dto/dashboard-stats.dto';

/** Pedido states that count as "pending" on the dashboard. */
const DASHBOARD_PENDING_ORDER_STATES = [
  EstadoPedido.PENDIENTE_DE_APROBACION,
  EstadoPedido.POR_RECEPCIONAR,
  EstadoPedido.PARCIAL,
  EstadoPedido.INCIDENCIA,
] as const;

/**
 * Service that computes all KPI metrics displayed on the main dashboard.
 * All queries are executed in parallel via Promise-based composition.
 * @class DashboardService
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  /** Maximum number of recent stock movements returned in the stats response. */
  private static readonly MOVIMIENTOS_RECIENTES_LIMITE = 7;

  /**
   * Constructs the DashboardService with its required repository dependencies.
   * @param {Repository<Inventario>} inventarioRepository - Repository for inventory stock records.
   * @param {Repository<Pedido>} pedidoRepository - Repository for purchase orders.
   * @param {Repository<Movimiento>} movimientoRepository - Repository for stock movement audit records.
   * @param {Repository<Producto>} productoRepository - Repository for product catalogue entries.
   * @param {Repository<Proveedor>} proveedorRepository - Repository for supplier records.
   * @param {Repository<Incidencia>} incidenciaRepository - Repository for supply-reception incidencias.
   */
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
    private readonly proveedorRepository: Repository<Proveedor>,
    @InjectRepository(Incidencia)
    private readonly incidenciaRepository: Repository<Incidencia>
  ) {}

  /**
   * Computes and returns all dashboard KPI statistics in a single call.
   * Metrics include:
   * - Total inventory value and items below minimum stock.
   * - Products expiring within 7 days and already expired.
   * - Pending and today-completed orders with their total pending cost.
   * - Open incidencias count.
   * - Total products (all-time and added this month) and total suppliers.
   * - The 7 most recent stock movements, enriched with product names.
   * @returns {Promise<DashboardStatsDto>} Aggregated dashboard statistics.
   */
  async getStats(): Promise<DashboardStatsDto> {
    this.logger.log(I18nHelper.translate('logs.FETCHING_DASHBOARD_STATISTICS'));

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
        estado: In([...DASHBOARD_PENDING_ORDER_STATES]),
      },
    });

    const incidenciasCount = await this.incidenciaRepository.count({
      where: {
        fechaResolucion: IsNull(),
      },
    });

    const completadosHoy = await this.pedidoRepository.count({
      where: {
        estado: EstadoPedido.RECEPCIONADO,
        fechaEntrega: Between(startOfDay, endOfDay),
      },
    });

    const costePendienteRaw = await this.pedidoRepository
      .createQueryBuilder('pedido')
      .select('SUM(pedido.coste_total)', 'costeTotal')
      .where('pedido.estado IN (:...estados)', {
        estados: DASHBOARD_PENDING_ORDER_STATES,
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
      take: DashboardService.MOVIMIENTOS_RECIENTES_LIMITE,
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
