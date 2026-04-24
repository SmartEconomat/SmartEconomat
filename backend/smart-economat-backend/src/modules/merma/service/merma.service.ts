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
 * Internal command object used by registerMerma to encapsulate all data
 * required to record a waste (merma) event.
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
 * Response shape returned by the getKpis method, containing waste KPI aggregates.
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
 * Service responsible for managing waste (merma) events including recording,
 * inventory deduction, KPI aggregation, and idempotent creation.
 *
 * @class MermaService
 */
@Injectable()
export class MermaService {
  private readonly logger = new Logger(MermaService.name);

  /**
   * Crea una instancia de MermaService.
   *
   * @param {Repository<Merma>} mermaRepository - TypeORM repository for Merma entities.
   * @param {Repository<Producto>} productoRepository - TypeORM repository for Producto entities.
   * @param {Repository<ProduccionLote>} produccionLoteRepository - TypeORM repository for ProduccionLote entities.
   * @param {Repository<RecetaIngrediente>} recetaIngredienteRepository - TypeORM repository for RecetaIngrediente entities.
   * @param {DataSource} dataSource - TypeORM DataSource used for transactional operations and raw queries.
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
   * Records a generic waste event, deducts the specified quantity from inventory using FEFO,
   * and emits a high-value warning log if the quantity exceeds the configured threshold.
   *
   * @param {CreateMermaDto} dto - DTO containing product ID, quantity, reason, and optional metadata.
   * @param {string} userId - ID of the authenticated user registering the waste.
   * @returns {Promise<Merma>} The created merma record with product and user relations loaded.
   * @throws {NotFoundException} When the referenced product does not exist.
   * @throws {BadRequestException} When there is insufficient stock to cover the merma quantity.
   * @example
   * const merma = await mermaService.create(createMermaDto, userId);
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
   * Records a waste event linked to a specific production batch (ProduccionLote).
   * Valida that the product belongs to the recipe's ingredient list before registering.
   *
   * @param {CreateMermaProduccionDto} dto - DTO containing produccionLoteId, productoId, quantity, and optional metadata.
   * @param {string} userId - ID of the authenticated user registering the waste.
   * @returns {Promise<Merma>} The created merma record with product and user relations loaded.
   * @throws {NotFoundException} When the production batch does not exist.
   * @throws {BadRequestException} When the product is not an ingredient of the batch's recipe,
   *   or when there is insufficient stock.
   * @example
   * const merma = await mermaService.createFromProduccion(dto, userId);
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
   * Devuelve una lista paginada de all waste records with product and user relations.
   *
   * @param {PaginationQueryDto} query - Pagination and sorting parameters (max limit 50).
   * @returns {Promise<PaginatedResponseDto<Merma>>} Paginated collection of merma records.
   * @example
   * const result = await mermaService.findAll({ page: 1, limit: 20, sortBy: 'createdAt', order: 'DESC' });
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
   * Retrieves a single waste record by its UUID.
   *
   * @param {string} id - UUID v7 of the merma to retrieve.
   * @returns {Promise<Merma>} The found merma with product and user relations loaded.
   * @throws {NotFoundException} When no merma exists with the given ID.
   * @example
   * const merma = await mermaService.findOne('019c9b4f-74f8-7a6e-8b5b-96191c30c1e5');
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
   * Calcula aggregated KPI metrics for waste events within an optional date range and product filter.
   * Devuelve el total de events, quantity lost, reference quantity (from incoming movements), percentage waste,
   * breakdown by waste type, and breakdown by context (origin entity).
   *
   * @param {MermaKpiQueryDto} query - Optional filters: startDate, endDate, productoId.
   * @returns {Promise<MermaKpiResponse>} Aggregated waste KPI data.
   * @throws {BadRequestException} When startDate or endDate are invalid ISO dates, or start > end.
   * @example
   * const kpis = await mermaService.getKpis({ startDate: '2026-01-01', endDate: '2026-03-31' });
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
   * Devuelve estadísticas resumidas for waste records grouped by reason (motivo) and by product.
   *
   * @returns {Promise<{ porMotivo: unknown[]; porProducto: unknown[] }>} Aggregated waste stats.
   * @example
   * const stats = await mermaService.getStats();
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
   * Core private method that handles idempotent merma registration within a transaction.
   * Comprueba for existing records by idempotency key before proceeding, consumes inventory
   * using FEFO ordering, creates the merma entity, and saves the corresponding movement records.
   *
   * @param {MermaCommand} command - Command object containing all data needed to register the merma.
   * @param {string} userId - ID of the user performing the action.
   * @returns {Promise<Merma>} The created or existing merma record.
   * @throws {NotFoundException} When the referenced product does not exist.
   * @throws {BadRequestException} When there is insufficient stock.
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
   * Consumes inventory lots for a given product in FEFO order (earliest expiry, then earliest entry)
   * using a pessimistic write lock. Reduces the cantidadActual of each lot as needed.
   *
   * @param {EntityManager} manager - El estado activo transaction EntityManager.
   * @param {string} productoId - ID of the product whose inventory must be consumed.
   * @param {number} cantidad - Total quantity to deduct from inventory.
   * @param {string} productoNombre - Human-readable product name used in error messages.
   * @returns {Promise<Array<{ inventario: Inventario; descontar: number }>>} Lista de lotes consumidos con la cantidad deducida de cada uno.
   * @throws {BadRequestException} When the total available stock is less than the requested quantity.
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
   * Crea registros de movimiento de tipo MERMA movement records for each inventory lot consumed during the waste event.
   *
   * @param {EntityManager} manager - El estado activo transaction EntityManager.
   * @param {Array<{ inventario: Inventario; descontar: number }>} consumos - Lista de lotes consumidos con las cantidades deducidas.
   * @param {Merma} merma - La entidad padre merma entity that caused these movements.
   * @param {string} productoNombre - Human-readable product name used in movement descriptions.
   * @param {string} userId - ID of the user performing the action.
   * @returns {Promise<void>}
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
   * Infers the TipoMerma value from a given MotivoMerma when no explicit type is provided.
   *
   * @param {MotivoMerma} motivo - La razón for the waste event.
   * @returns {TipoMerma} The inferred waste type.
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
   * Looks up an existing merma record by its idempotency key.
   *
   * @param {string} key - La clave de idempotencia key to search for.
   * @returns {Promise<Merma | null>} The existing merma if found, or null.
   */
  private async findByIdempotencyKey(key: string): Promise<Merma | null> {
    return this.mermaRepository.findOne({
      where: { idempotencyKey: key },
      relations: ['producto', 'usuario'],
    });
  }

  /**
   * Determines si a caught error is a PostgreSQL unique constraint violation (code 23505).
   * Used to handle idempotent creation race conditions gracefully.
   *
   * @param {unknown} error - El error thrown during the database operation.
   * @returns {boolean} True si el error es una violación de unicidad, false en caso contrario.
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
   * Procesa/Analiza and validates optional start/end date strings, returning Date objects.
   * Adjusts the end date to the last millisecond of the day (23:59:59.999).
   *
   * @param {string} [startDate] - Optional ISO date string for the start of the range.
   * @param {string} [endDate] - Optional ISO date string for the end of the range.
   * @returns {{ start?: Date; end?: Date }} Validated and adjusted date range.
   * @throws {BadRequestException} When startDate or endDate is not a valid ISO date,
   *   or when startDate is after endDate.
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
   * Emite a WARN-level security log when a merma's quantity meets or exceeds the high-value threshold.
   *
   * @param {Merma} merma - La entidad merma entity that was just created.
   * @param {string} userId - ID of the user who registered the waste.
   */
  private logHighValueMerma(merma: Merma, userId: string): void {
    if (merma.cantidad >= MERMA_UMBRAL_ALTO) {
      this.logger.warn(
        `[SECURITY] Merma de alto valor registrada: productoId=${merma.productoId} cantidad=${merma.cantidad} motivo=${merma.motivo} tipo=${merma.tipo} usuarioId=${userId} mermaId=${merma.id}`
      );
    }
  }
}
