import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryFailedError, Repository } from 'typeorm';
import { Inventario } from '../inventario.entity/inventario.entity';
import { InventarioRepository } from '../repository/inventario.repository';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { CreateInventarioItemDto } from '../dto/create-InventarioItem.dto';
import { CreateMovimientoManualDto } from '../dto/create-movimiento-manual.dto';
import { UpdateInventarioDto } from '../dto/update-inventario.dto';
import { AlertaStockDTO } from '../dto/alertaStock.dto';
import { AlertaCaducidadDTO } from '../dto/alertaCaducidad.dto';
import { InventoryQueryDto } from '../dto/inventory-query.dto';
import {
  StockConsolidadoDto,
  StockPorUbicacionDto,
} from '../dto/stock-result.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import {
  TipoMovimiento,
  TipoMovimientoManual,
} from '../../movimiento/enums/movimiento.enums';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';

/**
 * Service responsible for inventory management operations including creating,
 * updating, querying, and soft-deleting inventory items, as well as performing
 * manual stock adjustments with full audit trail via movements.
 *
 * @class InventarioService
 */
@Injectable()
export class InventarioService {
  constructor(
    private readonly inventarioRepository: InventarioRepository,
    @InjectRepository(ProductoProveedor)
    private readonly productoProveedorRepository: Repository<ProductoProveedor>,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Crea un nuevo inventory item for a given product-provider relation and location.
   * Automatically registers an ENTRADA movement for audit purposes.
   *
   * @param {CreateInventarioItemDto} dto - DTO containing inventory creation details.
   * @param {string} userId - El ID del usuario performing the creation.
   * @returns {Promise<Inventario>} The newly created inventory entity.
   * @throws {NotFoundException} When the product-provider relation is not found.
   * @throws {BadRequestException} When a database constraint violation occurs.
   */
  async create(
    dto: CreateInventarioItemDto,
    userId: string
  ): Promise<Inventario> {
    const productoProveedor = await this.productoProveedorRepository.findOne({
      where: { id: dto.productoProveedorId },
      relations: ['producto'],
    });
    if (!productoProveedor) {
      throw new NotFoundException(
        I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
      );
    }

    let cantidadMaxima = dto.cantidadMaxima as any;
    if (
      cantidadMaxima !== undefined &&
      cantidadMaxima !== null &&
      cantidadMaxima < dto.cantidadMinima
    ) {
      cantidadMaxima = null;
    }

    const inventario = this.inventarioRepository.create({
      productoProveedor,
      cantidadActual: dto.cantidadActual,
      cantidadMinima: dto.cantidadMinima,
      cantidadMaxima: cantidadMaxima ?? null,
      ubicacion: { id: dto.ubicacionId } as any,
      fechaCaducidad: dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null,
    });

    if (inventario.cantidadMinima < 0) inventario.cantidadMinima = 0;
    if (inventario.cantidadActual < 0) inventario.cantidadActual = 0;
    if (
      inventario.cantidadMaxima !== null &&
      inventario.cantidadMaxima !== undefined &&
      Number(inventario.cantidadMaxima) < Number(inventario.cantidadMinima)
    ) {
      (inventario as any).cantidadMaxima = null;
    }

    try {
      const savedInventario = await this.inventarioRepository.save(inventario);

      await this.movimientoHelper.trackInventarioMovimiento(
        userId,
        savedInventario.id,
        TipoMovimiento.ENTRADA,
        dto.cantidadActual,
        dto.productoProveedorId,
        'Inventario',
        savedInventario.id,
        `Creación de inventario: ${productoProveedor.producto.nombre}`
      );

      return savedInventario;
    } catch (err) {
      console.error('[InventarioService] Error en creación:', err);
      if (err instanceof QueryFailedError) {
        throw new BadRequestException(
          `${I18nHelper.getError('INVENTARIO_CONSTRAINT_VIOLATION')} (Detail: ${err.message})`
        );
      }
      throw err;
    }
  }

  /**
   * Retrieves a paginated list of inventory items.
   * Admin and Super Admin users can also see soft-deleted records.
   *
   * @param {PaginationQueryDto} query - Pagination and sorting parameters.
   * @param {string} [userRole] - El rol del usuario solicitante; los administradores ven registros eliminados.
   * @returns {Promise<PaginatedResponseDto<Inventario>>} Paginated inventory data.
   */
  async findAll(
    query: PaginationQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Inventario>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const sortBy = query.sortBy ?? 'createdAt';
    const order = query.order ?? 'ASC';

    const [data, total] = await this.inventarioRepository.findAndCount({
      relations: [
        'productoProveedor',
        'productoProveedor.producto',
        'productoProveedor.proveedor',
        'ubicacion',
      ],
      order: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
      withDeleted: isAdmin,
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
   * Retrieves a single inventory item by its ID, including related product, provider, and location.
   * Admin and Super Admin users can also retrieve soft-deleted records.
   *
   * @param {string} id - El UUID de the inventory item.
   * @param {string} [userRole] - El rol del usuario solicitante; los administradores pueden ver registros eliminados.
   * @returns {Promise<Inventario>} The found inventory entity.
   * @throws {NotFoundException} When no inventory item is found for the given ID.
   */
  async findOne(id: string, userRole?: string): Promise<Inventario> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';

    const inventario = await this.inventarioRepository.findOne({
      where: { id },
      relations: [
        'productoProveedor',
        'productoProveedor.producto',
        'productoProveedor.proveedor',
        'ubicacion',
      ],
      withDeleted: isAdmin,
    });
    if (!inventario) {
      throw new NotFoundException(I18nHelper.getError('INVENTARIO_NOT_FOUND'));
    }
    return inventario;
  }

  /**
   * Actualiza an existing inventory item. If the quantity changes, registers a corresponding
   * ENTRADA or SALIDA movement for audit purposes.
   *
   * @param {string} id - El UUID de the inventory item to update.
   * @param {UpdateInventarioDto} dto - DTO with the fields to update.
   * @param {string} userId - El ID del usuario performing the update.
   * @returns {Promise<Inventario>} The updated inventory entity.
   * @throws {NotFoundException} When the inventory item or product-provider is not found.
   * @throws {BadRequestException} When a database constraint violation occurs.
   */
  async update(
    id: string,
    dto: UpdateInventarioDto,
    userId: string
  ): Promise<Inventario> {
    const inventario = await this.findOne(id);
    const oldCantidad = inventario.cantidadActual;

    if (dto.productoProveedorId !== undefined) {
      const productoProveedor = await this.productoProveedorRepository.findOne({
        where: { id: dto.productoProveedorId },
        relations: ['producto'],
      });
      if (!productoProveedor) {
        throw new NotFoundException(
          I18nHelper.getError('PRODUCT_PROVIDER_NOT_FOUND')
        );
      }
      inventario.productoProveedor = productoProveedor;
    }

    if (dto.cantidadActual !== undefined)
      inventario.cantidadActual = dto.cantidadActual;
    if (dto.cantidadMinima !== undefined)
      inventario.cantidadMinima = dto.cantidadMinima;

    if (dto.cantidadMaxima !== undefined) {
      let candidateMax = dto.cantidadMaxima as any;
      if (candidateMax !== null && candidateMax < inventario.cantidadMinima) {
        candidateMax = null;
      }
      inventario.cantidadMaxima = candidateMax;
    }

    if (dto.ubicacionId !== undefined)
      inventario.ubicacion = { id: dto.ubicacionId } as any;
    if (dto.fechaCaducidad !== undefined)
      inventario.fechaCaducidad = (
        dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null
      ) as any;

    if (inventario.cantidadMinima < 0) inventario.cantidadMinima = 0;
    if (inventario.cantidadActual < 0) inventario.cantidadActual = 0;
    if (
      inventario.cantidadMaxima !== null &&
      inventario.cantidadMaxima !== undefined &&
      Number(inventario.cantidadMaxima) < Number(inventario.cantidadMinima)
    ) {
      (inventario as any).cantidadMaxima = null;
    }

    try {
      await this.inventarioRepository.update(id, {
        cantidadActual: inventario.cantidadActual,
        cantidadMinima: inventario.cantidadMinima,
        cantidadMaxima: (inventario as any).cantidadMaxima,
        ubicacionId: inventario.ubicacionId,
        fechaCaducidad: inventario.fechaCaducidad,
      });

      if (
        dto.cantidadActual !== undefined &&
        dto.cantidadActual !== oldCantidad
      ) {
        const cantidad = Math.abs(dto.cantidadActual - oldCantidad);
        const tipo =
          dto.cantidadActual > oldCantidad
            ? TipoMovimiento.ENTRADA
            : TipoMovimiento.SALIDA;

        const productoNombre =
          inventario.productoProveedor?.producto?.nombre ||
          `productoProveedor:${inventario.productoProveedor?.id ?? 'desconocido'}`;

        await this.movimientoHelper.trackInventarioMovimiento(
          userId,
          id,
          tipo,
          cantidad,
          inventario.productoProveedor.id,
          'Inventario',
          id,
          `Ajuste de inventario: ${productoNombre} (${oldCantidad} -> ${dto.cantidadActual})`
        );
      }
    } catch (err) {
      console.error('[InventarioService] Error en actualización:', err);
      if (err instanceof QueryFailedError) {
        throw new BadRequestException(
          `${I18nHelper.getError('INVENTARIO_CONSTRAINT_VIOLATION')} (Detail: ${err.message})`
        );
      }
      throw err;
    }

    return this.findOne(id);
  }

  /**
   * Soft-deletes an inventory item and registers a SALIDA movement for the remaining stock.
   *
   * @param {string} id - El UUID de the inventory item to remove.
   * @param {string} userId - El ID del usuario performing the deletion.
   * @returns {Promise<void>}
   * @throws {NotFoundException} When the inventory item is not found.
   */
  async remove(id: string, userId: string): Promise<void> {
    const inventario = await this.findOne(id);
    const result = await this.inventarioRepository.softDelete(id);
    if (result.affected === 0) {
      throw new NotFoundException(I18nHelper.getError('INVENTARIO_NOT_FOUND'));
    }

    const productoProveedorId =
      inventario.productoProveedor?.id ?? inventario.productoProveedorId;
    const productoNombre =
      inventario.productoProveedor?.producto?.nombre ||
      `productoProveedor:${productoProveedorId ?? 'desconocido'}`;

    await this.movimientoHelper.trackInventarioMovimiento(
      userId,
      id,
      TipoMovimiento.SALIDA,
      inventario.cantidadActual,
      productoProveedorId,
      'Inventario',
      id,
      `Eliminación de inventario: ${productoNombre}`
    );
  }

  /**
   * Retrieves inventory items with expiry dates that are approaching.
   *
   * @returns {Promise<AlertaCaducidadDTO[]>} Lista de DTOs de alertas de caducidad con ID del elemento y fecha de caducidad.
   */
  async obtenerAlertasCaducidad(): Promise<AlertaCaducidadDTO[]> {
    const productos = await this.inventarioRepository.findCaducidadProxima();
    return productos
      .filter((p) => p.fechaCaducidad !== null)
      .map((p) => ({
        id: p.id,
        fechaCaducidad: p.fechaCaducidad!.toISOString(),
      }));
  }

  /**
   * Retrieves inventory items whose current stock is at or below the minimum threshold.
   *
   * @returns {Promise<AlertaStockDTO[]>} Lista de DTOs de alertas de stock bajo con información de producto y ubicación.
   */
  async obtenerAlertasStock(): Promise<AlertaStockDTO[]> {
    const items = await this.inventarioRepository.findStockBajo();
    return items.map((item) => ({
      id: item.id,
      cantidadActual: item.cantidadActual,
      cantidadMinima: item.cantidadMinima,
      nombreProducto: item.productoProveedor?.producto?.nombre ?? 'Sin nombre',
      unidad: item.productoProveedor?.producto?.unidad,
      proveedorNombre: item.productoProveedor?.proveedor?.nombre,
      ubicacionNombre: item.ubicacion?.nombre,
    }));
  }

  /**
   * Queries stock levels either consolidated across locations or broken down by location,
   * depending on the provided query parameters.
   *
   * @param {InventoryQueryDto} dto - Query parameters specifying filters and grouping mode.
   * @returns {Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]>} Stock data grouped by location or consolidated.
   */
  async queryStock(
    dto: InventoryQueryDto
  ): Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]> {
    return this.inventarioRepository.queryStock(dto);
  }

  /**
   * Realiza a manual stock adjustment on an inventory item within a pessimistic-write
   * transaction to prevent race conditions. Records the adjustment as an audited movement.
   *
   * @param {CreateMovimientoManualDto} dto - DTO specifying the adjustment amount, type, reason, and optional observations.
   * @param {string} userId - El ID del usuario performing the adjustment.
   * @returns {Promise<Inventario>} The updated inventory entity after the adjustment.
   * @throws {NotFoundException} When the inventory item is not found.
   * @throws {ConflictException} When the inventory item has been soft-deleted or the adjustment would result in negative stock.
   * @throws {BadRequestException} When the adjustment is zero, or the sign does not match the movement type.
   * @throws {BadRequestException} When a database constraint violation occurs.
   */
  async ajustarManual(
    dto: CreateMovimientoManualDto,
    userId: string
  ): Promise<Inventario> {
    this.validarConsistenciaAjusteManual(dto);

    try {
      return await this.dataSource.transaction(async (manager) => {
        const inventario = await manager
          .createQueryBuilder(Inventario, 'inv')
          .withDeleted()
          .innerJoinAndSelect('inv.productoProveedor', 'pp')
          .innerJoinAndSelect('pp.producto', 'producto')
          .innerJoinAndSelect('pp.proveedor', 'proveedor')
          .innerJoinAndSelect('inv.ubicacion', 'ubicacion')
          .where('inv.id = :inventarioId', { inventarioId: dto.inventarioId })
          .setLock('pessimistic_write')
          .getOne();

        if (!inventario) {
          throw new NotFoundException(
            I18nHelper.getError('INVENTARIO_NOT_FOUND')
          );
        }

        if (inventario.deletedAt) {
          throw new ConflictException(
            I18nHelper.getError('INVENTARIO_DELETED_CANNOT_ADJUST')
          );
        }

        const cantidadAnterior = Number(inventario.cantidadActual);

        try {
          inventario.ajustarCantidad(dto.ajuste);
        } catch {
          throw new ConflictException(
            I18nHelper.getError('INVENTARIO_ADJUSTMENT_WOULD_BE_NEGATIVE')
          );
        }

        if (
          inventario.cantidadMaxima !== null &&
          inventario.cantidadMaxima !== undefined &&
          Number(inventario.cantidadMaxima) < Number(inventario.cantidadMinima)
        ) {
          (inventario as any).cantidadMaxima = null;
        }

        await manager.update(Inventario, inventario.id, {
          cantidadActual: inventario.cantidadActual,
        });

        const inventarioActualizado = inventario;

        const tipoMovimiento = this.mapManualTipoToMovimiento(dto.tipo);

        const movimiento = manager.create(Movimiento, {
          tipo: tipoMovimiento,
          cantidad: Math.abs(dto.ajuste),
          inventario: { id: inventario.id } as any,
          productoProveedor: { id: inventario.productoProveedor.id } as any,
          entidad: 'AjusteManualInventario',
          entidadId: inventario.id,
          descripcion: this.buildManualAdjustmentDescription(
            inventario.productoProveedor.producto.nombre,
            cantidadAnterior,
            Number(inventarioActualizado.cantidadActual),
            dto
          ),
          usuario: { id: userId } as any,
        });

        await manager.save(Movimiento, movimiento);

        return inventarioActualizado;
      });
    } catch (err) {
      console.error('[InventarioService] Error en ajuste manual:', err);
      if (err instanceof QueryFailedError) {
        throw new BadRequestException(
          `${I18nHelper.getError('INVENTARIO_CONSTRAINT_VIOLATION')} (Detail: ${err.message})`
        );
      }

      throw err;
    }
  }

  /**
   * Valida the consistency of a manual adjustment DTO, ensuring the adjustment
   * value and movement type are coherent (p. ej. ENTRADA must be positive, SALIDA_AJUSTE negative).
   *
   * @param {CreateMovimientoManualDto} dto - El DTO de ajuste manual adjustment DTO to validate.
   * @returns {void}
   * @throws {BadRequestException} When the adjustment is zero.
   * @throws {BadRequestException} When an ENTRADA movement has a negative adjustment.
   * @throws {BadRequestException} When a SALIDA_AJUSTE movement has a positive adjustment.
   */
  private validarConsistenciaAjusteManual(
    dto: CreateMovimientoManualDto
  ): void {
    if (dto.ajuste === 0) {
      throw new BadRequestException(
        I18nHelper.getError('MANUAL_ADJUSTMENT_CANNOT_BE_ZERO')
      );
    }

    if (dto.tipo === TipoMovimientoManual.ENTRADA && dto.ajuste < 0) {
      throw new BadRequestException(
        I18nHelper.getError(
          'MANUAL_MOVEMENT_ENTRY_REQUIRES_POSITIVE_ADJUSTMENT'
        )
      );
    }

    if (dto.tipo === TipoMovimientoManual.SALIDA_AJUSTE && dto.ajuste > 0) {
      throw new BadRequestException(
        I18nHelper.getError('MANUAL_MOVEMENT_EXIT_REQUIRES_NEGATIVE_ADJUSTMENT')
      );
    }
  }

  /**
   * Mapea a TipoMovimientoManual enum value to the corresponding TipoMovimiento value
   * used in the movement audit trail.
   *
   * @param {TipoMovimientoManual} tipo - El DTO de ajuste manual movement type.
   * @returns {TipoMovimiento} The corresponding audit movement type.
   * @throws {BadRequestException} When the provided type is not a recognized manual movement type.
   */
  private mapManualTipoToMovimiento(
    tipo: TipoMovimientoManual
  ): TipoMovimiento {
    switch (tipo) {
      case TipoMovimientoManual.ENTRADA:
        return TipoMovimiento.ENTRADA;
      case TipoMovimientoManual.AJUSTE:
        return TipoMovimiento.AJUSTE;
      case TipoMovimientoManual.SALIDA_AJUSTE:
        return TipoMovimiento.SALIDA_AJUSTE;
      default:
        throw new BadRequestException(
          I18nHelper.getError('INVALID_MANUAL_MOVEMENT_TYPE')
        );
    }
  }

  /**
   * Construye a human-readable description string for a manual inventory adjustment movement.
   *
   * @param {string} productoNombre - El nombre de the product being adjusted.
   * @param {number} cantidadAnterior - La cantidad de stock antes del ajuste.
   * @param {number} cantidadActual - La cantidad de stock tras el ajuste.
   * @param {CreateMovimientoManualDto} dto - El DTO del ajuste DTO providing the reason and optional observations.
   * @returns {string} A formatted description string for the movement record.
   */
  private buildManualAdjustmentDescription(
    productoNombre: string,
    cantidadAnterior: number,
    cantidadActual: number,
    dto: CreateMovimientoManualDto
  ): string {
    const detalleObservaciones = dto.observaciones
      ? ` | ${I18nHelper.getError('OBSERVATIONS')}: ${dto.observaciones}`
      : '';

    return I18nHelper.getError('MANUAL_INVENTORY_ADJUSTMENT_DESCRIPTION', {
      productoNombre,
      cantidadAnterior,
      cantidadActual,
      motivo: dto.motivo,
      detalleObservaciones,
    });
  }
}
