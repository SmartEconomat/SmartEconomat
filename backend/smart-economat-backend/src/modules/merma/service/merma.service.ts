import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  EntityManager,
  QueryFailedError,
  Repository,
} from 'typeorm';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { CreateMermaDto } from '../dto/create-merma.dto';
import { CreateMermaProduccionDto } from '../dto/create-merma-produccion.dto';
import { MermaKpiQueryDto } from '../dto/merma-kpi-query.dto';
import { MotivoMerma, TipoMerma } from '../enums/merma.enums';
import { Merma } from '../merma.entity/merma.entity';
import { ProduccionLote } from '../../receta/produccion-lote.entity/produccion-lote.entity';
import { RecetaIngrediente } from '../../receta/receta-ingrediente.entity/receta-ingrediente.entity';

const MERMA_UMBRAL_ALTO = 50;
const MOVIMIENTOS_REFERENCIA_MERMA: TipoMovimiento[] = [
  TipoMovimiento.ENTRADA,
  TipoMovimiento.ENTRADA_COMPRA,
  TipoMovimiento.PRODUCCION_RESULTADO,
];

/**
 * Documentación en español.
 */
interface MermaCommand {
  productoId: string;
  cantidad: number;
  motivo: MotivoMerma;
  notas?: string;
  tipo?: TipoMerma;
  origenEntidad?: string;
  origenId?: string;
  referenciaId?: string;
  idempotencyKey?: string;
}

/**
 * Documentación en español.
 */
export interface MermaKpiResponse {
  ventana: {
    startDate?: string;
    endDate?: string;
  };
  resumen: {
    totalEventos: number;
    cantidadPerdida: number;
    cantidadReferencia: number;
    porcentajeMerma: number;
  };
  porTipo: Array<{
    tipo: TipoMerma;
    totalRegistros: number;
    totalCantidad: number;
  }>;
  porContexto: Array<{
    origenEntidad: string;
    totalRegistros: number;
    totalCantidad: number;
  }>;
}

/**
 * Documentación en español.
 */
@Injectable()
export class MermaService {
  private readonly logger = new Logger(MermaService.name);

  /**
   * Documentación en español.
   */
  constructor(
    @InjectRepository(Merma)
    private readonly mermaRepository: Repository<Merma>,
    @InjectRepository(Producto)
    private readonly productoRepository: Repository<Producto>,
    @InjectRepository(ProduccionLote)
    private readonly produccionLoteRepository: Repository<ProduccionLote>,
    @InjectRepository(RecetaIngrediente)
    private readonly recetaIngredienteRepository: Repository<RecetaIngrediente>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Documentación en español.
   */
  async create(dto: CreateMermaDto, userId: string): Promise<Merma> {
    const merma = await this.registerMerma(
      {
        productoId: dto.productoId,
        cantidad: dto.cantidad,
        motivo: dto.motivo,
        notas: dto.notas,
        tipo: dto.tipo,
        origenEntidad: dto.origenEntidad,
        origenId: dto.origenId,
        referenciaId: dto.referenciaId,
        idempotencyKey: dto.idempotencyKey,
      },
      userId
    );

    this.logHighValueMerma(merma, userId);

    return merma;
  }

  /**
   * Documentación en español.
   */
  async createFromProduccion(
    dto: CreateMermaProduccionDto,
    userId: string
  ): Promise<Merma> {
    const lote = await this.produccionLoteRepository.findOne({
      where: { id: dto.produccionLoteId },
    });

    if (!lote) {
      throw new NotFoundException(I18nHelper.getError('MERMA_LOTE_NOT_FOUND'));
    }

    const ingrediente = await this.recetaIngredienteRepository.findOne({
      where: {
        recetaId: lote.recetaId,
        productoId: dto.productoId,
      },
      relations: ['producto'],
    });

    if (!ingrediente) {
      throw new BadRequestException(
        I18nHelper.getError('MERMA_INGREDIENTE_NOT_IN_RECIPE')
      );
    }

    const merma = await this.registerMerma(
      {
        productoId: dto.productoId,
        cantidad: dto.cantidad,
        motivo: dto.motivo ?? MotivoMerma.ERROR_PREPARACION,
        notas: dto.notas,
        tipo: TipoMerma.PRODUCCION,
        origenEntidad: 'ProduccionLote',
        origenId: dto.produccionLoteId,
        referenciaId: ingrediente.id,
        idempotencyKey: dto.idempotencyKey,
      },
      userId
    );

    this.logHighValueMerma(merma, userId);

    return merma;
  }

  /**
   * Documentación en español.
   */
  async findAll(
    query: PaginationQueryDto
  ): Promise<PaginatedResponseDto<Merma>> {
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'DESC';

    const [data, total] = await this.mermaRepository.findAndCount({
      relations: ['producto', 'usuario'],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Documentación en español.
   */
  async findOne(id: string): Promise<Merma> {
    const merma = await this.mermaRepository.findOne({
      where: { id },
      relations: ['producto', 'usuario'],
    });

    if (!merma) {
      throw new NotFoundException(I18nHelper.getError('MERMA_NOT_FOUND'));
    }

    return merma;
  }

  /**
   * Documentación en español.
   */
  async getKpis(query: MermaKpiQueryDto): Promise<MermaKpiResponse> {
    const { startDate, endDate, productoId } = query;
    const dateRange = this.resolveDateRange(startDate, endDate);

    const mermaBaseQb = this.mermaRepository
      .createQueryBuilder('m')
      .where('m.deleted_at IS NULL');

    if (productoId) {
      mermaBaseQb.andWhere('m.producto_id = :productoId', { productoId });
    }

    if (dateRange.start) {
      mermaBaseQb.andWhere('m.created_at >= :startDate', {
        startDate: dateRange.start,
      });
    }

    if (dateRange.end) {
      mermaBaseQb.andWhere('m.created_at <= :endDate', {
        endDate: dateRange.end,
      });
    }

    const resumenRaw = await mermaBaseQb
      .clone()
      .select('COUNT(*)', 'totalEventos')
      .addSelect('COALESCE(SUM(m.cantidad), 0)', 'cantidadPerdida')
      .getRawOne<{ totalEventos: string; cantidadPerdida: string }>();

    const porTipoRaw = await mermaBaseQb
      .clone()
      .select('m.tipo', 'tipo')
      .addSelect('COUNT(*)', 'totalRegistros')
      .addSelect('COALESCE(SUM(m.cantidad), 0)', 'totalCantidad')
      .groupBy('m.tipo')
      .orderBy('"totalCantidad"', 'DESC')
      .getRawMany<{
        tipo: TipoMerma;
        totalRegistros: string;
        totalCantidad: string;
      }>();

    const porContextoRaw = await mermaBaseQb
      .clone()
      .select("COALESCE(m.origen_entidad, 'SIN_CONTEXTO')", 'origenEntidad')
      .addSelect('COUNT(*)', 'totalRegistros')
      .addSelect('COALESCE(SUM(m.cantidad), 0)', 'totalCantidad')
      .groupBy("COALESCE(m.origen_entidad, 'SIN_CONTEXTO')")
      .orderBy('"totalCantidad"', 'DESC')
      .getRawMany<{
        origenEntidad: string;
        totalRegistros: string;
        totalCantidad: string;
      }>();

    const referenciaQb = this.dataSource
      .getRepository(Movimiento)
      .createQueryBuilder('mv')
      .where('mv.deleted_at IS NULL')
      .andWhere('mv.tipo IN (:...tipos)', {
        tipos: MOVIMIENTOS_REFERENCIA_MERMA,
      });

    if (productoId) {
      referenciaQb
        .innerJoin('mv.productoProveedor', 'pp')
        .andWhere('pp.producto_id = :productoId', { productoId });
    }

    if (dateRange.start) {
      referenciaQb.andWhere('mv.created_at >= :startDate', {
        startDate: dateRange.start,
      });
    }

    if (dateRange.end) {
      referenciaQb.andWhere('mv.created_at <= :endDate', {
        endDate: dateRange.end,
      });
    }

    const referenciaRaw = await referenciaQb
      .select('COALESCE(SUM(mv.cantidad), 0)', 'cantidadReferencia')
      .getRawOne<{ cantidadReferencia: string }>();

    const cantidadPerdida = Number(resumenRaw?.cantidadPerdida ?? 0);
    const cantidadReferencia = Number(referenciaRaw?.cantidadReferencia ?? 0);

    return {
      ventana: {
        ...(startDate ? { startDate } : {}),
        ...(endDate ? { endDate } : {}),
      },
      resumen: {
        totalEventos: Number(resumenRaw?.totalEventos ?? 0),
        cantidadPerdida,
        cantidadReferencia,
        porcentajeMerma:
          cantidadReferencia > 0
            ? Number(((cantidadPerdida / cantidadReferencia) * 100).toFixed(4))
            : 0,
      },
      porTipo: porTipoRaw.map((item) => ({
        tipo: item.tipo,
        totalRegistros: Number(item.totalRegistros),
        totalCantidad: Number(item.totalCantidad),
      })),
      porContexto: porContextoRaw.map((item) => ({
        origenEntidad: item.origenEntidad,
        totalRegistros: Number(item.totalRegistros),
        totalCantidad: Number(item.totalCantidad),
      })),
    };
  }

  /**
   * Documentación en español.
   */
  async getStats(): Promise<{ porMotivo: unknown[]; porProducto: unknown[] }> {
    const porMotivo = await this.mermaRepository
      .createQueryBuilder('m')
      .select('m.motivo', 'motivo')
      .addSelect('COUNT(*)', 'totalRegistros')
      .addSelect('SUM(m.cantidad)', 'totalCantidad')
      .where('m.deleted_at IS NULL')
      .groupBy('m.motivo')
      .orderBy('"totalCantidad"', 'DESC')
      .getRawMany();

    const porProducto = await this.mermaRepository
      .createQueryBuilder('m')
      .innerJoin('m.producto', 'p')
      .select('m.producto_id', 'productoId')
      .addSelect('p.nombre', 'productoNombre')
      .addSelect('COUNT(*)', 'totalRegistros')
      .addSelect('SUM(m.cantidad)', 'totalCantidad')
      .where('m.deleted_at IS NULL')
      .groupBy('m.producto_id')
      .addGroupBy('p.nombre')
      .orderBy('"totalCantidad"', 'DESC')
      .getRawMany();

    return { porMotivo, porProducto };
  }

  /**
   * Documentación en español.
   */
  private async registerMerma(
    command: MermaCommand,
    userId: string
  ): Promise<Merma> {
    if (command.idempotencyKey) {
      const existingMerma = await this.findByIdempotencyKey(
        command.idempotencyKey
      );
      if (existingMerma) {
        return existingMerma;
      }
    }

    const producto = await this.productoRepository.findOne({
      where: { id: command.productoId },
    });

    if (!producto) {
      throw new NotFoundException(I18nHelper.getError('PRODUCT_NOT_FOUND'));
    }

    try {
      return await this.dataSource.transaction(async (manager) => {
        if (command.idempotencyKey) {
          const existingInTransaction = await manager.findOne(Merma, {
            where: { idempotencyKey: command.idempotencyKey },
            relations: ['producto', 'usuario'],
          });

          if (existingInTransaction) {
            return existingInTransaction;
          }
        }

        const consumos = await this.consumeInventoryByProduct(
          manager,
          command.productoId,
          command.cantidad,
          producto.nombre
        );

        const nuevaMerma = manager.create(Merma, {
          productoId: command.productoId,
          usuarioId: userId,
          cantidad: command.cantidad,
          motivo: command.motivo,
          tipo: command.tipo ?? this.resolveTipoMerma(command.motivo),
          notas: command.notas,
          origenEntidad: command.origenEntidad,
          origenId: command.origenId,
          referenciaId: command.referenciaId,
          idempotencyKey: command.idempotencyKey,
        });

        await manager.save(Merma, nuevaMerma);
        await this.createMermaMovements(
          manager,
          consumos,
          nuevaMerma,
          producto.nombre,
          userId
        );

        const mermaGuardada = await manager.findOne(Merma, {
          where: { id: nuevaMerma.id },
          relations: ['producto', 'usuario'],
        });

        return mermaGuardada ?? nuevaMerma;
      });
    } catch (error: unknown) {
      if (command.idempotencyKey && this.isUniqueViolation(error)) {
        const mermaExistente = await this.findByIdempotencyKey(
          command.idempotencyKey
        );

        if (mermaExistente) {
          return mermaExistente;
        }
      }

      throw error;
    }
  }

  /**
   * Documentación en español.
   */
  private async consumeInventoryByProduct(
    manager: EntityManager,
    productoId: string,
    cantidad: number,
    productoNombre: string
  ): Promise<Array<{ inventario: Inventario; descontar: number }>> {
    const inventarios = await manager
      .createQueryBuilder(Inventario, 'inv')
      .innerJoinAndSelect('inv.productoProveedor', 'pp')
      .innerJoinAndSelect('pp.producto', 'prod')
      .where('pp.producto_id = :productoId', { productoId })
      .andWhere('inv.cantidad_actual > 0')
      .orderBy('inv.fecha_caducidad', 'ASC', 'NULLS LAST')
      .addOrderBy('inv.fecha_entrada', 'ASC')
      .setLock('pessimistic_write')
      .getMany();

    const stockTotal = inventarios.reduce(
      (sum, inv) => sum + Number(inv.cantidadActual),
      0
    );

    if (stockTotal < cantidad) {
      throw new BadRequestException(
        I18nHelper.getError('NOT_ENOUGH_STOCK_FOR_INGREDIENT', {
          ingredient: productoNombre,
        })
      );
    }

    const consumos: Array<{ inventario: Inventario; descontar: number }> = [];
    let cantidadPendiente = cantidad;

    for (const inventario of inventarios) {
      if (cantidadPendiente <= 0) {
        break;
      }

      const descontar = Math.min(
        Number(inventario.cantidadActual),
        cantidadPendiente
      );
      inventario.ajustarCantidad(-descontar);
      cantidadPendiente -= descontar;
      consumos.push({ inventario, descontar });
    }

    await manager.save(Inventario, inventarios);

    return consumos;
  }

  /**
   * Documentación en español.
   */
  private async createMermaMovements(
    manager: EntityManager,
    consumos: Array<{ inventario: Inventario; descontar: number }>,
    merma: Merma,
    productoNombre: string,
    userId: string
  ): Promise<void> {
    const movimientos = consumos.map(({ inventario, descontar }) =>
      manager.create(Movimiento, {
        tipo: TipoMovimiento.MERMA,
        cantidad: descontar,
        inventarioId: inventario.id,
        productoProveedorId: inventario.productoProveedorId,
        entidad: 'Merma',
        entidadId: merma.id,
        descripcion: `Merma de ${productoNombre} - motivo: ${merma.motivo}`,
        usuarioId: userId,
      })
    );

    await manager.save(Movimiento, movimientos);
  }

  /**
   * Documentación en español.
   */
  private resolveTipoMerma(motivo: MotivoMerma): TipoMerma {
    switch (motivo) {
      case MotivoMerma.ROTURA:
        return TipoMerma.ROTURA;
      case MotivoMerma.DETERIORO:
        return TipoMerma.CADUCIDAD;
      case MotivoMerma.ERROR_PREPARACION:
        return TipoMerma.PRODUCCION;
      default:
        return TipoMerma.INVENTARIO;
    }
  }

  /**
   * Documentación en español.
   */
  private async findByIdempotencyKey(key: string): Promise<Merma | null> {
    return this.mermaRepository.findOne({
      where: { idempotencyKey: key },
      relations: ['producto', 'usuario'],
    });
  }

  /**
   * Documentación en español.
   */
  private isUniqueViolation(error: unknown): boolean {
    if (!(error instanceof QueryFailedError)) {
      return false;
    }

    const withDriverError = error as QueryFailedError & {
      driverError?: { code?: string };
    };

    return withDriverError.driverError?.code === '23505';
  }

  /**
   * Documentación en español.
   */
  private resolveDateRange(
    startDate?: string,
    endDate?: string
  ): {
    start?: Date;
    end?: Date;
  } {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;

    if (start && Number.isNaN(start.getTime())) {
      throw new BadRequestException(I18nHelper.getError('INVALID_START_DATE'));
    }

    if (end && Number.isNaN(end.getTime())) {
      throw new BadRequestException(I18nHelper.getError('INVALID_END_DATE'));
    }

    if (start && end && start > end) {
      throw new BadRequestException(
        I18nHelper.getError('START_DATE_AFTER_END_DATE')
      );
    }

    if (end) {
      end.setHours(23, 59, 59, 999);
    }

    return { start, end };
  }

  /**
   * Documentación en español.
   */
  private logHighValueMerma(merma: Merma, userId: string): void {
    if (merma.cantidad >= MERMA_UMBRAL_ALTO) {
      this.logger.warn(
        `[SECURITY] Merma de alto valor registrada: productoId=${merma.productoId} cantidad=${merma.cantidad} motivo=${merma.motivo} tipo=${merma.tipo} usuarioId=${userId} mermaId=${merma.id}`
      );
    }
  }
}
