/**
 * @module IncidenciaService
 * Capa de servicio para gestionar las incidencias de recepción de suministros. Gestiona la creación,
 * recuperación, actualización, resolución y sincronización de estado con los pedidos padre.
 */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Incidencia } from '../incidencia.entity/incidencia.entity';
import { IncidenciaRepository } from '../repository/incidencia.repository';
import { CreateIncidenciaDto } from '../dto/create-incidencia.dto';
import { UpdateIncidenciaDto } from '../dto/update-incidencia.dto';
import {
  EstadoFinalIncidenciaDto,
  ResolverIncidenciaDto,
  ResolverIncidenciaLineaDto,
} from '../dto/resolver-incidencia.dto';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { ReportIncidenciaDto } from '../dto/report-incidencia.dto';
import { ResolveIncidenciaDto } from '../dto/resolve-incidencia.dto';
import { IncidenciaQueryDto } from '../dto/incidencia-query.dto';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { IncidenciaResuelta } from '../incidencia-resuelta.entity/incidencia-resuelta.entity';
import { EstadoIncidencia, TipoResolucion } from '../enums/incidencia.enums';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import {
  EstadoReclamacion,
  IncidenciaLinea,
  TipoDiferencia,
} from '../incidencia-linea.entity/incidencia-linea.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { PedidoStatusTrigger } from '../../pedido/enums/pedido-status-trigger.enum';
import { PedidoService } from '../../pedido/service/pedido.service';
import { EstadoProductoRecepcion } from '../../recepcion/enums/estado-producto.enum';
import { permiteComputarComoRecibido } from '../../recepcion/utils/recepcion-producto-state.util';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';

/**
 * Servicio que gestiona el ciclo de vida completo de las incidencias (discrepancias de suministro).
 * Proporciona CRUD, flujos de resolución, derivación automática del estado de líneas y
 * sincronización del estado del pedido tras la resolución.
 * @class IncidenciaService
 */
@Injectable()
export class IncidenciaService {
  /** Tolerancia utilizada al comparar cantidades en coma flotante. */
  private static readonly CANTIDAD_EPSILON = 0.0005;

  /**
   * Construye el IncidenciaService con sus dependencias requeridas.
   * @param {IncidenciaRepository} incidenciaRepository - Repositorio personalizado para Incidencia con soporte de paginación.
   * @param {Repository<Recepcion>} recepcionRepository - Repositorio TypeORM para la entidad Recepcion.
   * @param {DataSource} dataSource - DataSource de TypeORM utilizado para ejecutar transacciones.
   * @param {MovimientoHelper} movimientoHelper - Helper que crea registros de auditoría de movimientos de stock.
   * @param {PedidoService} pedidoService - Servicio utilizado para disparar transiciones de estado del pedido.
   */
  constructor(
    private readonly incidenciaRepository: IncidenciaRepository,
    @InjectRepository(Recepcion)
    private readonly recepcionRepository: Repository<Recepcion>,
    private readonly dataSource: DataSource,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly pedidoService: PedidoService
  ) {}

  /**
   * Crea una nueva incidencia con sus líneas asociadas dentro de una única transacción.
   * Cada línea captura la cantidad esperada frente a la recibida y el tipo de discrepancia.
   * @param {CreateIncidenciaDto} dto - Carga útil que describe la incidencia y sus líneas.
   * @returns {Promise<Incidencia>} La entidad Incidencia creada con las líneas y el estado calculado adjuntos.
   */
  async create(dto: CreateIncidenciaDto): Promise<Incidencia> {
    return this.dataSource.transaction(async (manager) => {
      const incidencia = manager.create(Incidencia, {
        recepcion: { id: dto.recepcionId } as Recepcion,
        ...(dto.pedidoId ? { pedido: { id: dto.pedidoId } as Pedido } : {}),
        observacionesRecepcion: dto.observacionesRecepcion,
      });

      const savedIncidencia = await manager.save(Incidencia, incidencia);

      const lineas = dto.lineas.map((lineaDto) => {
        const cantidadEsperada = Number(lineaDto.cantidadEsperada);
        const cantidadRecibida = Number(lineaDto.cantidadRecibida);

        return manager.create(IncidenciaLinea, {
          incidencia: savedIncidencia,
          pedidoProducto: { id: lineaDto.pedidoProductoId } as PedidoProducto,
          cantidadEsperada,
          cantidadRecibida,
          diferencia: cantidadRecibida - cantidadEsperada,
          tipoDiferencia: lineaDto.tipoDiferencia,
          observaciones: lineaDto.observaciones,
        });
      });

      const lineasPersistidas = await manager.save(IncidenciaLinea, lineas);
      savedIncidencia.lineas = lineasPersistidas;

      return this.attachEstadoComputado(savedIncidencia);
    });
  }

  /**
   * Devuelve una lista paginada de incidencias. Cada registro tiene su estado calculado adjunto.
   * @param {IncidenciaQueryDto} query - Parámetros de filtrado, paginación y ordenación.
   * @param {string} [userRole] - Rol del usuario solicitante; los admins pueden ver registros adicionales.
   * @returns {Promise<PaginatedResponseDto<Incidencia>>} Resultado paginado con los estados calculados.
   */
  async findAll(
    query: IncidenciaQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Incidencia>> {
    const result = await this.incidenciaRepository.findAllPaginated(
      query,
      userRole
    );

    result.data = result.data.map((incidencia) =>
      this.attachEstadoComputado(incidencia)
    );

    return result;
  }

  /**
   * Busca una única incidencia por su UUID y adjunta el estado calculado.
   * @param {string} id - UUID de la incidencia a recuperar.
   * @param {string} [userRole] - Rol del usuario solicitante.
   * @returns {Promise<Incidencia>} La Incidencia encontrada con todas las relaciones y el estado calculado.
   * @throws {NotFoundException} Si no existe ninguna incidencia con el ID dado.
   */
  async findOne(id: string, userRole?: string): Promise<Incidencia> {
    const incidencia = await this.incidenciaRepository.findOneWithRelations(
      id,
      userRole
    );

    if (!incidencia) {
      throw new NotFoundException(I18nHelper.getError('INCIDENCIA_NOT_FOUND'));
    }

    return this.attachEstadoComputado(incidencia);
  }

  /**
   * Actualiza los campos de cabecera de una incidencia abierta (aún no resuelta).
   * @param {string} id - UUID de la incidencia a actualizar.
   * @param {UpdateIncidenciaDto} dto - Carga útil parcial con los campos a actualizar.
   * @returns {Promise<Incidencia>} La Incidencia actualizada con el estado calculado.
   * @throws {NotFoundException} Si no existe ninguna incidencia con el ID dado.
   * @throws {BadRequestException} Si la incidencia ya está resuelta.
   */
  async update(id: string, dto: UpdateIncidenciaDto): Promise<Incidencia> {
    const incidencia = await this.findOne(id);

    if (incidencia.estaResuelta()) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    this.incidenciaRepository.merge(incidencia, {
      ...(dto.recepcionId ? { recepcion: { id: dto.recepcionId } as any } : {}),
      ...(dto.pedidoId ? { pedido: { id: dto.pedidoId } as any } : {}),
      observacionesRecepcion: dto.observacionesRecepcion,
    });

    const saved = await this.incidenciaRepository.save(incidencia);
    return this.attachEstadoComputado(saved);
  }

  /**
   * Elimina permanentemente una incidencia abierta de la base de datos.
   * Las incidencias resueltas no pueden eliminarse.
   * @param {string} id - UUID de la incidencia a eliminar.
   * @returns {Promise<void>}
   * @throws {NotFoundException} Si no existe ninguna incidencia con el ID dado.
   * @throws {BadRequestException} Si la incidencia ya está resuelta.
   */
  async remove(id: string): Promise<void> {
    const incidencia = await this.findOne(id);

    if (incidencia.estaResuelta()) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    await this.incidenciaRepository.remove(incidencia);
  }

  /**
   * Resuelve una incidencia, aplicando opcionalmente primero ajustes de cantidad a nivel de línea.
   * La incidencia se cierra cuando todas las líneas quedan equilibradas, cuando `marcarComoResuelta` se
   * establece en `true`, o cuando se solicita un `estadoFinal` terminal.
   * También dispara una reevaluación del estado del pedido tras la resolución.
   * @param {string} id - UUID de la incidencia a resolver.
   * @param {ResolverIncidenciaDto} dto - Carga útil de resolución con ajustes de línea opcionales y estado final.
   * @param {string} [usuarioAutenticadoId] - ID del usuario autenticado, usado como resolutor de reserva.
   * @returns {Promise<Incidencia>} La Incidencia hidratada con el estado calculado tras la resolución.
   * @throws {NotFoundException} Si no existe ninguna incidencia con el ID dado.
   * @throws {BadRequestException} Si la incidencia ya está resuelta, no tiene líneas,
   *   o no se puede determinar el ID del resolutor.
   */
  async resolverIncidencia(
    id: string,
    dto: ResolverIncidenciaDto,
    usuarioAutenticadoId?: string
  ): Promise<Incidencia> {
    const usuarioResolutorId = dto.usuarioId ?? usuarioAutenticadoId;

    return this.dataSource.transaction(async (manager) => {
      const incidencia = await manager.findOne(Incidencia, {
        where: { id },
        relations: [
          'recepcion',
          'pedido',
          'pedido.proveedor',
          'usuarioResolutor',
          'lineas',
          'lineas.pedidoProducto',
          'lineas.pedidoProducto.productoProveedor',
          'lineas.pedidoProducto.productoProveedor.producto',
          'lineas.pedidoProducto.productoProveedor.proveedor',
        ],
      });

      if (!incidencia) {
        throw new NotFoundException(
          I18nHelper.getError('INCIDENCIA_NOT_FOUND')
        );
      }

      if (incidencia.estaResuelta()) {
        throw new BadRequestException(
          I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
        );
      }

      if ((incidencia.lineas ?? []).length === 0) {
        throw new BadRequestException(
          'No se puede resolver una incidencia sin líneas de producto.'
        );
      }

      const ajustesLinea = dto.lineas ?? [];
      if (ajustesLinea.length > 0) {
        this.applyLineaAjustes(incidencia.lineas ?? [], ajustesLinea);
        await manager.save(IncidenciaLinea, incidencia.lineas);
      }

      const resolverExplicito =
        dto.marcarComoResuelta ?? ajustesLinea.length === 0;
      const todasLasLineasBalanceadas = (incidencia.lineas ?? []).every(
        (linea) => this.isLineaBalanceada(linea)
      );
      const estadoFinalManual = dto.estadoFinal;
      const solicitaCierreTerminal =
        estadoFinalManual === EstadoFinalIncidenciaDto.CANCELADA ||
        estadoFinalManual === EstadoFinalIncidenciaDto.INVALIDA ||
        estadoFinalManual === EstadoFinalIncidenciaDto.RESUELTA;

      if (
        resolverExplicito ||
        todasLasLineasBalanceadas ||
        solicitaCierreTerminal
      ) {
        if (!usuarioResolutorId) {
          throw new BadRequestException(
            'No se pudo determinar el usuario resolutor de la incidencia.'
          );
        }

        incidencia.resolver(
          usuarioResolutorId,
          this.composeObservacionesResolucion(
            dto.observacionesResolucion,
            estadoFinalManual
          )
        );
      }

      await manager.save(Incidencia, incidencia);

      if (incidencia.pedidoId) {
        await this.syncPedidoStatusAfterIncidenciaResolution(
          incidencia.pedidoId,
          manager
        );
      }

      const hydrated =
        (await manager.findOne(Incidencia, {
          where: { id: incidencia.id },
          relations: [
            'recepcion',
            'pedido',
            'pedido.proveedor',
            'usuarioResolutor',
            'lineas',
            'lineas.pedidoProducto',
            'lineas.pedidoProducto.productoProveedor',
            'lineas.pedidoProducto.productoProveedor.producto',
            'lineas.pedidoProducto.productoProveedor.proveedor',
          ],
        })) ?? incidencia;

      return this.attachEstadoComputado(hydrated);
    });
  }

  /**
   * Construye automáticamente una incidencia a partir de las discrepancias reales encontradas en
   * las líneas de producto de una recepción. Marca la recepción como que tiene una incidencia.
   * Solo se incluyen las líneas con una diferencia de cantidad significativa o estado DEFECTUOSO.
   * @param {ReportIncidenciaDto} dto - DTO que contiene el recepcionId y el tipo de incidencia reportado.
   * @returns {Promise<Incidencia>} La Incidencia recién creada con el estado calculado.
   * @throws {NotFoundException} Si la Recepcion referenciada no existe.
   * @throws {BadRequestException} Si ninguna línea de producto muestra una discrepancia.
   */
  async reportarIncidencia(dto: ReportIncidenciaDto): Promise<Incidencia> {
    const recepcion = await this.recepcionRepository.findOne({
      where: { id: dto.recepcionId },
    });

    if (!recepcion) {
      throw new NotFoundException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
    }

    return this.dataSource.transaction(async (manager) => {
      const recepcionProductos = await manager.find(RecepcionProducto, {
        where: { recepcionId: recepcion.id },
        relations: ['pedidoProducto'],
      });

      const lineasPorPedidoProducto = new Map<
        string,
        {
          pedidoProductoId: string;
          cantidadEsperada: number;
          cantidadRecibida: number;
          tipoDiferencia: TipoDiferencia;
          observaciones: string | undefined;
        }
      >();

      for (const item of recepcionProductos) {
        const expected = Number(item.pedidoProducto?.cantidad ?? 0);
        const current = lineasPorPedidoProducto.get(item.pedidoProductoId) ?? {
          pedidoProductoId: item.pedidoProductoId,
          cantidadEsperada: expected,
          cantidadRecibida: 0,
          tipoDiferencia: TipoDiferencia.FALTANTE,
          observaciones: undefined,
        };

        current.cantidadRecibida += Number(item.cantidadRecibida ?? 0);

        const diferencia = current.cantidadRecibida - current.cantidadEsperada;
        if (item.estadoProducto === EstadoProductoRecepcion.ROTO) {
          current.tipoDiferencia = TipoDiferencia.DEFECTUOSO;
        } else if (diferencia > IncidenciaService.CANTIDAD_EPSILON) {
          current.tipoDiferencia = TipoDiferencia.EXCESO;
        } else {
          current.tipoDiferencia = TipoDiferencia.FALTANTE;
        }

        if (item.observaciones?.trim()) {
          current.observaciones = current.observaciones
            ? `${current.observaciones}; ${item.observaciones.trim()}`
            : item.observaciones.trim();
        }

        lineasPorPedidoProducto.set(item.pedidoProductoId, current);
      }

      const lineasValidas = Array.from(lineasPorPedidoProducto.values()).filter(
        (linea) => {
          const diferencia = linea.cantidadRecibida - linea.cantidadEsperada;
          return (
            Math.abs(diferencia) >= IncidenciaService.CANTIDAD_EPSILON ||
            linea.tipoDiferencia === TipoDiferencia.DEFECTUOSO
          );
        }
      );

      if (lineasValidas.length === 0) {
        throw new BadRequestException(
          'No se puede reportar una incidencia sin productos con discrepancia.'
        );
      }

      recepcion.incidencia = true;
      await manager.save(Recepcion, recepcion);

      const incidencia = manager.create(Incidencia, {
        recepcion: { id: dto.recepcionId } as Recepcion,
        observacionesRecepcion: `Incidencia reportada de tipo: ${dto.tipo}`,
      });

      const savedIncidencia = await manager.save(Incidencia, incidencia);

      const lineas = lineasValidas.map((linea) =>
        manager.create(IncidenciaLinea, {
          incidencia: savedIncidencia,
          pedidoProducto: { id: linea.pedidoProductoId } as PedidoProducto,
          cantidadEsperada: linea.cantidadEsperada,
          cantidadRecibida: linea.cantidadRecibida,
          diferencia: linea.cantidadRecibida - linea.cantidadEsperada,
          tipoDiferencia: linea.tipoDiferencia,
          observaciones: linea.observaciones,
        })
      );

      const lineasPersistidas = await manager.save(IncidenciaLinea, lineas);
      savedIncidencia.lineas = lineasPersistidas;

      return this.attachEstadoComputado(savedIncidencia);
    });
  }

  /**
   * Resuelve una incidencia usando el flujo transaccional heredado. Crea un registro
   * IncidenciaResuelta, registra opcionalmente un movimiento de ajuste de stock
   * para resoluciones DEVOLUCION, cierra la incidencia y dispara la sincronización del pedido.
   * @param {string} id - UUID de la incidencia a resolver.
   * @param {ResolveIncidenciaDto} dto - Datos de resolución incluyendo el tipo de acción y observaciones opcionales.
   * @param {string} usuarioId - ID del usuario autenticado que realiza la resolución.
   * @returns {Promise<Incidencia>} La Incidencia resuelta con el estado calculado.
   * @throws {NotFoundException} Si no existe ninguna incidencia con el ID dado.
   * @throws {BadRequestException} Si la incidencia ya está resuelta o no tiene líneas.
   */
  async resolverIncidenciaTransaccional(
    id: string,
    dto: ResolveIncidenciaDto,
    usuarioId: string
  ): Promise<Incidencia> {
    const incidencia = await this.findOne(id);

    if (incidencia.estaResuelta()) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    if ((incidencia.lineas ?? []).length === 0) {
      throw new BadRequestException(
        'No se puede resolver una incidencia sin líneas de producto.'
      );
    }

    return await this.dataSource.transaction(async (manager) => {
      const resolucion = manager.create(IncidenciaResuelta, {
        incidenciaId: incidencia.id,
        usuarioResolutorId: usuarioId,
        tipoResolucion: dto.accion,
        fechaResolucion: new Date(),
        observaciones: dto.observaciones,
      });

      await manager.save(resolucion);

      if (dto.accion === TipoResolucion.DEVOLUCION) {
        await this.movimientoHelper.createMovimiento(
          usuarioId,
          TipoMovimiento.SALIDA_AJUSTE,
          'Incidencia',
          incidencia.id,
          0,
          undefined,
          undefined,
          `Ajuste por resolución de incidencia (${dto.accion}): ${dto.observaciones || ''}`
        );
      }

      incidencia.resolver(usuarioId, dto.observaciones);
      await manager.save(incidencia);

      if (incidencia.pedidoId) {
        await this.syncPedidoStatusAfterIncidenciaResolution(
          incidencia.pedidoId,
          manager
        );
      }

      return this.attachEstadoComputado(incidencia);
    });
  }

  /**
   * Attaches the computed `resuelta` flag and `estado` field to an Incidencia instance.
   * These are virtual fields derived from the entity's persisted data.
   * @param {Incidencia} incidencia - La entidad Incidencia entity to annotate.
   * @returns {Incidencia} The same entity with `resuelta` and `estado` fields set.
   */
  private attachEstadoComputado(incidencia: Incidencia): Incidencia {
    incidencia.resuelta = incidencia.estaResuelta();
    incidencia.estado = this.resolveEstadoIncidencia(incidencia);
    return incidencia;
  }

  /**
   * Derives the semantic estado of an incidencia based on its resolution text,
   * resolution date, line balance, and claim states.
   * Priority order: CANCELADA > INVALIDA > RESUELTA > PENDIENTE_VALIDACION > NUEVA > EN_AJUSTE.
   * @param {Incidencia} incidencia - La entidad Incidencia entity with lines loaded.
   * @returns {EstadoIncidencia} The derived estado value.
   */
  private resolveEstadoIncidencia(incidencia: Incidencia): EstadoIncidencia {
    const observacionesResolucion =
      incidencia.observacionesResolucion?.toLowerCase() ?? '';

    if (
      observacionesResolucion.includes('[cancelada]') ||
      observacionesResolucion.includes('#cancelada') ||
      observacionesResolucion.includes('cancelad')
    ) {
      return EstadoIncidencia.CANCELADA;
    }

    if (
      observacionesResolucion.includes('[invalida]') ||
      observacionesResolucion.includes('[inválida]') ||
      observacionesResolucion.includes('#invalida') ||
      observacionesResolucion.includes('#inválida') ||
      observacionesResolucion.includes('inválid') ||
      observacionesResolucion.includes('invalid')
    ) {
      return EstadoIncidencia.INVALIDA;
    }

    if (incidencia.estaResuelta()) {
      return EstadoIncidencia.RESUELTA;
    }

    const lineas = incidencia.lineas ?? [];
    if (lineas.length === 0) {
      return EstadoIncidencia.INVALIDA;
    }

    const todasBalanceadas = lineas.every((linea) =>
      this.isLineaBalanceada(linea)
    );

    if (todasBalanceadas) {
      return EstadoIncidencia.PENDIENTE_VALIDACION;
    }

    const tieneGestionManual = lineas.some(
      (linea) => linea.estadoReclamacion !== EstadoReclamacion.PENDIENTE
    );

    if (!tieneGestionManual) {
      return EstadoIncidencia.NUEVA;
    }

    return EstadoIncidencia.EN_AJUSTE;
  }

  /**
   * Construye the `observacionesResolucion` string by optionally appending a state tag
   * when a terminal `estadoFinal` is requested (CANCELADA or INVALIDA).
   * @param {string | undefined} observaciones - Raw observations from the resolution DTO.
   * @param {EstadoFinalIncidenciaDto} [estadoFinal] - Optional requested terminal state.
   * @returns {string | undefined} The composed observations string, or `undefined` if nothing was provided.
   */
  private composeObservacionesResolucion(
    observaciones: string | undefined,
    estadoFinal?: EstadoFinalIncidenciaDto
  ): string | undefined {
    const base = observaciones?.trim();

    if (estadoFinal === EstadoFinalIncidenciaDto.CANCELADA) {
      return this.appendStateTag(base, '[cancelada]');
    }

    if (estadoFinal === EstadoFinalIncidenciaDto.INVALIDA) {
      return this.appendStateTag(base, '[invalida]');
    }

    return base;
  }

  /**
   * Appends a state tag to the base observations string if the tag is not already present.
   * @param {string | undefined} base - Existing observations text. May be empty or undefined.
   * @param {string} tag - La etiqueta to append (p. ej. `[cancelada]`).
   * @returns {string} The base string with the tag appended, or just the tag if base is empty.
   */
  private appendStateTag(base: string | undefined, tag: string): string {
    if (!base) {
      return tag;
    }

    if (base.toLowerCase().includes(tag.toLowerCase())) {
      return base;
    }

    return `${base} ${tag}`;
  }

  /**
   * Returns `true` when the absolute difference between the received and expected
   * quantities for a line is within the configured epsilon tolerance.
   * @param {IncidenciaLinea} linea - La línea de incidencia line to check.
   * @returns {boolean} Indica si la línea se considera equilibrada (sin discrepancia significativa).
   */
  private isLineaBalanceada(linea: IncidenciaLinea): boolean {
    return (
      Math.abs(
        Number(linea.cantidadRecibida) - Number(linea.cantidadEsperada)
      ) < IncidenciaService.CANTIDAD_EPSILON
    );
  }

  /**
   * Derives the appropriate `EstadoReclamacion` for a line based on its current
   * quantity values:
   * - ABONADO if the line is balanced.
   * - RECLAMADO if some quantity has been received.
   * - PENDIENTE if nothing has been received yet.
   * @param {IncidenciaLinea} linea - La línea de incidencia line to evaluate.
   * @returns {EstadoReclamacion} The derived claim state.
   */
  private resolveEstadoReclamacion(linea: IncidenciaLinea): EstadoReclamacion {
    if (this.isLineaBalanceada(linea)) {
      return EstadoReclamacion.ABONADO;
    }

    if (Number(linea.cantidadRecibida) > 0) {
      return EstadoReclamacion.RECLAMADO;
    }

    return EstadoReclamacion.PENDIENTE;
  }

  /**
   * Aplica a batch of line-level quantity adjustments to the in-memory incidencia lines.
   * Valida that lines exist, that only one quantity field is set per adjustment,
   * and that balanced lines are not re-adjusted.
   * Mutates the provided `lineas` array in place; the caller is responsible for persisting.
   * @param {IncidenciaLinea[]} lineas - Existing incidencia lines (must be non-empty).
   * @param {ResolverIncidenciaLineaDto[]} ajustes - Array of adjustments to apply.
   * @returns {void}
   * @throws {BadRequestException} If the lines array is empty, an adjustment is missing identifiers,
   *   the referenced line is not found, both quantity fields are set, or a balanced line is re-adjusted.
   */
  private applyLineaAjustes(
    lineas: IncidenciaLinea[],
    ajustes: ResolverIncidenciaLineaDto[]
  ): void {
    if (lineas.length === 0) {
      throw new BadRequestException(
        'No se puede ajustar una incidencia sin líneas de producto.'
      );
    }

    for (const ajuste of ajustes) {
      if (!ajuste.id && !ajuste.pedidoProductoId) {
        throw new BadRequestException(
          'Cada ajuste de incidencia debe incluir id de línea o pedidoProductoId.'
        );
      }

      const linea = lineas.find((item) => {
        if (ajuste.id) {
          return item.id === ajuste.id;
        }

        return item.pedidoProductoId === ajuste.pedidoProductoId;
      });

      if (!linea) {
        throw new BadRequestException(
          `No se encontró la línea de incidencia para el ajuste (${ajuste.id ?? ajuste.pedidoProductoId}).`
        );
      }

      const ajusteCantidadDefinido = ajuste.ajusteCantidad !== undefined;
      const cantidadRecibidaDefinida = ajuste.cantidadRecibida !== undefined;

      if (ajusteCantidadDefinido && cantidadRecibidaDefinida) {
        throw new BadRequestException(
          'No se puede enviar cantidadRecibida y ajusteCantidad al mismo tiempo en la misma línea.'
        );
      }

      if (
        this.isLineaBalanceada(linea) &&
        (ajusteCantidadDefinido || cantidadRecibidaDefinida)
      ) {
        throw new BadRequestException(
          'No se puede ajustar una línea sin discrepancia (pendiente 0).'
        );
      }

      if (ajusteCantidadDefinido) {
        const cantidadBase = Number(linea.cantidadRecibida);
        linea.cantidadRecibida = Math.max(
          0,
          cantidadBase + Number(ajuste.ajusteCantidad)
        );
        linea.diferencia =
          Number(linea.cantidadRecibida) - Number(linea.cantidadEsperada);

        if (linea.diferencia > 0) {
          linea.tipoDiferencia = TipoDiferencia.EXCESO;
        } else if (linea.diferencia < 0) {
          linea.tipoDiferencia = TipoDiferencia.FALTANTE;
        }
      }

      if (cantidadRecibidaDefinida) {
        linea.cantidadRecibida = Number(ajuste.cantidadRecibida);
        linea.diferencia =
          Number(linea.cantidadRecibida) - Number(linea.cantidadEsperada);

        if (linea.diferencia > 0) {
          linea.tipoDiferencia = TipoDiferencia.EXCESO;
        } else if (linea.diferencia < 0) {
          linea.tipoDiferencia = TipoDiferencia.FALTANTE;
        }
      }

      if (ajuste.estadoReclamacion) {
        linea.estadoReclamacion = ajuste.estadoReclamacion;
      } else if (ajusteCantidadDefinido || cantidadRecibidaDefinida) {
        linea.estadoReclamacion = this.resolveEstadoReclamacion(linea);
      }

      if (ajuste.observaciones !== undefined) {
        linea.observaciones = ajuste.observaciones;
      }
    }
  }

  /**
   * Re-evaluates the status of a pedido after one of its incidencias has been resolved.
   * If open incidencias remain, keeps the pedido in INCIDENCIA state.
   * Otherwise determines si reception is complete or partial and triggers the
   * appropriate status transition.
   * @param {string} pedidoId - UUID of the pedido to synchronise.
   * @param {EntityManager} manager - Active EntityManager within the enclosing transaction.
   * @returns {Promise<void>}
   */
  private async syncPedidoStatusAfterIncidenciaResolution(
    pedidoId: string,
    manager: EntityManager
  ): Promise<void> {
    const pedido = await manager.findOne(Pedido, {
      where: { id: pedidoId },
      relations: ['pedidoProductos'],
    });

    if (
      !pedido ||
      !pedido.pedidoProductos ||
      pedido.pedidoProductos.length === 0
    ) {
      return;
    }

    const incidenciasAbiertas = await manager.count(Incidencia, {
      where: {
        pedidoId,
        fechaResolucion: IsNull(),
      },
    });

    if (incidenciasAbiertas > 0) {
      await this.pedidoService.handleStatusTransition(
        pedidoId,
        PedidoStatusTrigger.INCIDENCIA,
        manager
      );
      return;
    }

    const pedidoProductoIds = pedido.pedidoProductos.map((linea) => linea.id);
    const recepcionesProducto = await manager.find(RecepcionProducto, {
      where: { pedidoProducto: { id: In(pedidoProductoIds) } },
      relations: ['pedidoProducto'],
    });

    const cantidadesRecibidas = new Map<string, number>();
    for (const recepcionProducto of recepcionesProducto) {
      const estadoProducto =
        recepcionProducto.estadoProducto ?? EstadoProductoRecepcion.PERFECTO;

      if (!permiteComputarComoRecibido(estadoProducto)) {
        continue;
      }

      const pedidoProductoId = recepcionProducto.pedidoProducto.id;
      const acumulado = cantidadesRecibidas.get(pedidoProductoId) ?? 0;
      cantidadesRecibidas.set(
        pedidoProductoId,
        acumulado + Number(recepcionProducto.cantidadRecibida)
      );
    }

    const recepcionCompleta = pedido.pedidoProductos.every((lineaPedido) => {
      const cantidadEsperada = Number(lineaPedido.cantidad);
      const cantidadRecibida = cantidadesRecibidas.get(lineaPedido.id) ?? 0;
      return (
        Math.abs(cantidadEsperada - cantidadRecibida) <
        IncidenciaService.CANTIDAD_EPSILON
      );
    });

    await this.pedidoService.handleStatusTransition(
      pedidoId,
      recepcionCompleta
        ? PedidoStatusTrigger.RECEPCION_TOTAL
        : PedidoStatusTrigger.RECEPCION_PARCIAL,
      manager
    );
  }
}
