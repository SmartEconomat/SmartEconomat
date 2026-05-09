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
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { InventarioListQueryDto } from '../dto/inventario-list-query.dto';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { InventarioTransferenciaStockService } from './inventario-transferencia-stock.service';
import { UbicacionAccesoPoliticaService } from '../../ubicacion/service/ubicacion-acceso-politica.service';
import { CrearTransferenciaInventarioDto } from '../dto/crear-transferencia-inventario.dto';
import { Transferencia } from '../transferencia.entity/transferencia.entity';

/**
 * Servicio encargado de la lógica de negocio para la gestión de inventario físico.
 * Gestiona el stock por ubicaciones, el registro de movimientos y el cálculo de alertas de stock bajo y caducidad.
 */
@Injectable()
export class InventarioService {
  /**
   * Crea una instancia de InventarioService.
   * @param inventarioRepository Repositorio personalizado para inventario.
   * @param productoProveedorRepository Repositorio para la relación producto-proveedor.
   * @param movimientoHelper Ayudante para el registro de auditoría de movimientos.
   * @param dataSource Fuente de datos para gestión de transacciones manuales.
   */
  constructor(
    private readonly inventarioRepository: InventarioRepository,
    @InjectRepository(ProductoProveedor)
    private readonly productoProveedorRepository: Repository<ProductoProveedor>,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly dataSource: DataSource,
    private readonly transferenciaStock: InventarioTransferenciaStockService,
    private readonly accesoUbicacion: UbicacionAccesoPoliticaService
  ) {}

  /**
   * Registra una nueva entrada de stock en una ubicación específica.
   * @param dto Datos de la nueva entrada de inventario.
   * @param userId ID del usuario que realiza el registro.
   * @returns El registro de inventario persistido.
   * @throws NotFoundException Si la relación producto-proveedor no existe.
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

    const cantidadMinima = Number(dto.cantidadMinima);
    const cantidadActual = Number(dto.cantidadActual);
    /** NULL si no viene o si viola chk cantidad_maxima >= cantidad_minima (ej. legacy 0). */
    let cantidadMaxima: number | null = null;
    if (dto.cantidadMaxima !== undefined && dto.cantidadMaxima !== null) {
      const parsedMax = Number(dto.cantidadMaxima);
      if (Number.isFinite(parsedMax) && parsedMax >= cantidadMinima) {
        cantidadMaxima = parsedMax;
      }
    }

    const inventario = this.inventarioRepository.create({
      productoProveedor,
      cantidadActual,
      cantidadMinima,
      cantidadMaxima,
      ubicacion: { id: dto.ubicacionId } as Inventario['ubicacion'],
      fechaCaducidad: dto.fechaCaducidad ? new Date(dto.fechaCaducidad) : null,
    });

    if (inventario.cantidadMinima < 0) inventario.cantidadMinima = 0;
    if (inventario.cantidadActual < 0) inventario.cantidadActual = 0;

    await this.assertInventarioGrainLibreParaCrear(dto);

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
   * Recupera una lista paginada de todos los registros de inventario.
   * @param query Parámetros de filtrado, paginación y ordenación.
   * @param userRole Rol del usuario solicitante.
   * @returns Respuesta paginada.
   */
  async findAll(
    query: InventarioListQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Inventario>> {
    const isAdmin =
      userRole?.toUpperCase() === 'ADMIN' ||
      userRole?.toUpperCase() === 'SUPER_ADMIN';
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 20, 50);
    const rawOrder =
      (query.order ?? query.sortOrder ?? 'ASC').toString().toUpperCase() ===
      'DESC'
        ? 'DESC'
        : 'ASC';
    const sortBy = query.sortBy ?? 'createdAt';

    const allowedSort = new Set([
      'nombre',
      'cantidadActual',
      'cantidadMinima',
      'cantidadMaxima',
      'fechaEntrada',
      'fechaCaducidad',
      'createdAt',
      'updatedAt',
    ]);
    const safeSort = allowedSort.has(sortBy) ? sortBy : 'createdAt';

    const qb = this.inventarioRepository
      .createQueryBuilder('inv')
      .innerJoinAndSelect('inv.productoProveedor', 'pp')
      .innerJoinAndSelect('pp.producto', 'producto')
      .innerJoinAndSelect('pp.proveedor', 'proveedor')
      .leftJoinAndSelect('inv.ubicacion', 'ubicacion');

    if (isAdmin) {
      qb.withDeleted();
    }

    qb.andWhere('inv.cantidadActual > 0');

    if (query.onlyLowStock === true) {
      qb.andWhere('inv.cantidadActual < inv.cantidadMinima');
    }

    if (query.ubicacionIds && query.ubicacionIds.length > 0) {
      qb.andWhere('ubicacion.id IN (:...ubicacionIds)', {
        ubicacionIds: query.ubicacionIds,
      });
    }

    const rawSearch = query.search ?? query.searchTerm;
    const term = typeof rawSearch === 'string' ? rawSearch.trim() : '';
    if (term.length > 0) {
      qb.andWhere(
        '(producto.nombre ILIKE :st OR producto.codigoBarras ILIKE :st OR ubicacion.nombre ILIKE :st OR proveedor.nombre ILIKE :st)',
        { st: `%${term}%` }
      );
    }

    if (safeSort === 'nombre') {
      qb.orderBy('producto.nombre', rawOrder).addOrderBy('inv.id', 'ASC');
    } else {
      qb.orderBy(`inv.${safeSort}`, rawOrder).addOrderBy('inv.id', 'ASC');
    }

    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Busca un registro de inventario por su UUID.
   * @param id UUID del registro.
   * @param userRole Rol del usuario.
   * @returns El registro encontrado con sus relaciones de producto y ubicación.
   * @throws NotFoundException Si el registro no existe.
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
   * Actualiza los datos de un registro de inventario y registra el movimiento de ajuste si la cantidad cambia.
   * @param id UUID del registro a actualizar.
   * @param dto Nuevos datos (cantidad, ubicación, fechas).
   * @param userId ID del usuario que realiza la acción.
   * @returns El registro de inventario actualizado.
   */
  async update(
    id: string,
    dto: UpdateInventarioDto,
    userId: string,
    usuarioRol?: string
  ): Promise<Inventario> {
    const inventario = await this.findOne(id);
    const oldCantidad = inventario.cantidadActual;
    const oldUbicacionId = inventario.ubicacionId ?? null;

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

    if (dto.ubicacionId !== undefined) {
      await this.validarCambioUbicacionAcl(
        dto.ubicacionId,
        oldUbicacionId,
        userId,
        usuarioRol
      );
      inventario.ubicacion = { id: dto.ubicacionId } as Inventario['ubicacion'];
    }
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
   * Ejecuta transferencias formales entre ubicaciones (cantidades parciales).
   */
  async ejecutarTransferenciaUbicaciones(
    dto: CrearTransferenciaInventarioDto,
    usuarioId: string | undefined,
    usuarioRol: string | undefined
  ): Promise<Transferencia> {
    return this.transferenciaStock.ejecutarTransferenciaInmediata(
      dto,
      usuarioId,
      usuarioRol
    );
  }

  private async assertInventarioGrainLibreParaCrear(
    dto: CreateInventarioItemDto
  ): Promise<void> {
    const qb = this.inventarioRepository
      .createQueryBuilder('inv')
      .where('inv.producto_proveedor_id = :pp', {
        pp: dto.productoProveedorId,
      });

    if (dto.ubicacionId) {
      qb.andWhere('inv.ubicacion_id = :u', { u: dto.ubicacionId });
    } else {
      qb.andWhere('inv.ubicacion_id IS NULL');
    }

    if (dto.fechaCaducidad) {
      qb.andWhere('inv.fecha_caducidad = :fcd', {
        fcd: new Date(dto.fechaCaducidad),
      });
    } else {
      qb.andWhere('inv.fecha_caducidad IS NULL');
    }

    const dup = await qb.getOne();
    if (dup) {
      throw new ConflictException(
        I18nHelper.getError('INVENTARIO_DUPLICATE_GRAIN')
      );
    }
  }

  private async validarCambioUbicacionAcl(
    nuevaUbicacionId: string | undefined | null,
    ubicacionActualId: string | null | undefined,
    usuarioId: string,
    usuarioRol?: string
  ): Promise<void> {
    if (
      nuevaUbicacionId === ubicacionActualId ||
      (!nuevaUbicacionId && !ubicacionActualId)
    ) {
      return;
    }
    const conjunto = [nuevaUbicacionId, ubicacionActualId].filter(
      (v): v is string =>
        typeof v === 'string' && v.trim().length > 0 && v !== 'null'
    );
    await this.accesoUbicacion.assertPuedeTransferirEnUbicaciones(
      usuarioId,
      usuarioRol,
      conjunto
    );
  }

  /**
   * Elimina lógicamente un registro de inventario y registra la salida total del stock.
   * @param id UUID del registro a eliminar.
   * @param userId ID del usuario que realiza la acción.
   */
  /**
   * Expone "remove" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
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
   * Identifica los registros de inventario cuya fecha de caducidad está próxima o vencida.
   * @returns Lista de alertas de caducidad.
   */
  /**
   * Expone "obtenerAlertasCaducidad" en smart-economat-backend (Nest).
   * @undefined {Promise<AlertaCaducidadDTO[]>} Datos efectivos después de ejecutar la operación.
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
   * Identifica los registros de inventario cuyo stock actual es inferior al mínimo definido.
   * @returns Lista de alertas de stock bajo.
   */
  /**
   * Expone "obtenerAlertasStock" en smart-economat-backend (Nest).
   * @undefined {Promise<AlertaStockDTO[]>} Datos efectivos después de ejecutar la operación.
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
   * Ejecuta una consulta avanzada de stock consolidado o detallado por ubicación.
   * @param dto Parámetros de la consulta (producto, categoría, ubicación).
   * @returns Resultados de stock.
   */
  async queryStock(
    dto: InventoryQueryDto
  ): Promise<StockPorUbicacionDto[] | StockConsolidadoDto[]> {
    return this.inventarioRepository.queryStock(dto);
  }

  /**
   * Realiza un ajuste manual de stock dentro de una transacción con bloqueo pesimista.
   * Garantiza la integridad del stock y genera un registro de auditoría detallado.
   * @param dto Datos del ajuste (UUID inventario, cantidad a ajustar, motivo).
   * @param userId ID del usuario responsable.
   * @returns El registro de inventario tras el ajuste.
   * @throws ConflictException Si el ajuste deja el stock en negativo o el registro está eliminado.
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
   * Valida que los parámetros del ajuste manual sean consistentes (ej: entrada no puede ser negativa).
   * @param dto Datos del ajuste.
   * @throws BadRequestException Si hay inconsistencias.
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
   * Mapea el tipo de ajuste manual al enumerado general de movimientos del sistema.
   * @param tipo Tipo de movimiento manual.
   * @returns Tipo de movimiento general.
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
   * Construye una descripción detallada para el registro de auditoría del ajuste manual.
   * @param productoNombre Nombre del producto afectado.
   * @param cantidadAnterior Stock antes del ajuste.
   * @param cantidadActual Stock después del ajuste.
   * @param dto Datos del ajuste (motivo, observaciones).
   * @returns Cadena de texto descriptiva.
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
