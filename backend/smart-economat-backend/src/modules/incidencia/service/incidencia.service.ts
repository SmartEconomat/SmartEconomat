/**
 * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
import {
  EstadoIncidencia,
  TipoResolucion,
  EstadoLineaIncidencia,
  EstadoReclamacion,
  TipoDiferencia,
} from '../enums/incidencia.enums';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { PaginatedResponseDto } from '../../../common/dto/paginated-response.dto';
import { IncidenciaLinea } from '../incidencia-linea.entity/incidencia-linea.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { PedidoStatusTrigger } from '../../pedido/enums/pedido-status-trigger.enum';
import { PedidoService } from '../../pedido/service/pedido.service';
import { EstadoProductoRecepcion } from '../../recepcion/enums/estado-producto.enum';
import { permiteComputarComoRecibido } from '../../recepcion/utils/recepcion-producto-state.util';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import { AccionMovimiento } from '../../movimiento/enums/movimiento.enums';

/**
 * Servicio de dominio para incidencia.
 */
@Injectable()
export class IncidenciaService {
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private static readonly CANTIDAD_EPSILON = 0.0005;

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Crea create.
   *
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async create(dto: CreateIncidenciaDto): Promise<Incidencia> {
    return this.dataSource.transaction(async (manager) => {
      const incidencia = manager.create(Incidencia, {
        recepcion: { id: dto.recepcionId } as Recepcion,
        pedido: { id: dto.pedidoId } as Pedido,
        proveedor: { id: dto.proveedorId } as any,
        observacionesRecepcion: dto.observacionesRecepcion,
        estado: EstadoIncidencia.ABIERTA,
      });

      const savedIncidencia = await manager.save(Incidencia, incidencia);

      const lineas = dto.lineas.map((lineaDto) => {
        const cantidadPedida = Number(lineaDto.cantidadPedida);
        const cantidadRecibida = Number(lineaDto.cantidadRecibida);
        const diferencia = cantidadRecibida - cantidadPedida;

        return manager.create(IncidenciaLinea, {
          incidencia: savedIncidencia,
          pedidoProducto: { id: lineaDto.pedidoProductoId } as PedidoProducto,
          cantidadPedida,
          cantidadRecibida,
          cantidadAjustada: 0,
          diferencia,
          tipoDiferencia: lineaDto.tipoDiferencia,
          estado: EstadoLineaIncidencia.PENDIENTE_AJUSTE,
          necesitaAjuste:
            Math.abs(diferencia) > IncidenciaService.CANTIDAD_EPSILON,
          observaciones: lineaDto.observaciones,
        });
      });

      const lineasPersistidas = await manager.save(IncidenciaLinea, lineas);
      savedIncidencia.lineas = lineasPersistidas;

      const created = await this.recalcularEstadoIncidencia(
        savedIncidencia,
        manager
      );

      await this.movimientoHelper.log({
        entidad: 'Incidencia',
        entidadId: created.id,
        accion: AccionMovimiento.CREATE,
        descripcion: `Creación de incidencia ${created.id}`,
        after: created,
        manager,
      });

      return created;
    });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "findAll" en smart-economat-backend (Nest).
   * @undefined {IncidenciaQueryDto} query - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userRole - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<PaginatedResponseDto<Incidencia>>} Datos efectivos después de ejecutar la operación.
   */
  async findAll(
    query: IncidenciaQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Incidencia>> {
    const result = await this.incidenciaRepository.findAllPaginated(
      query,
      userRole
    );

    return result;

    return result;
  }

  /**
   * Busca one.
   *
   * @param id Parámetro de entrada para la operación.
   * @param userRole Parámetro de entrada para la operación. Opcional.
   * @returns Valor resultante de la operación.
   */
  async findOne(id: string, userRole?: string): Promise<Incidencia> {
    const incidencia = await this.incidenciaRepository.findOneWithRelations(
      id,
      userRole
    );

    if (!incidencia) {
      throw new NotFoundException(I18nHelper.getError('INCIDENCIA_NOT_FOUND'));
    }

    return incidencia;
  }

  /**
   * Actualiza update.
   *
   * @param id Parámetro de entrada para la operación.
   * @param dto Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async update(id: string, dto: UpdateIncidenciaDto): Promise<Incidencia> {
    const incidencia = await this.findOne(id);
    const before = JSON.parse(JSON.stringify(incidencia)) as Incidencia;

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

    await this.movimientoHelper.log({
      entidad: 'Incidencia',
      entidadId: id,
      accion: AccionMovimiento.UPDATE,
      descripcion: `Actualización de incidencia ${id}`,
      before,
      after: saved,
    });

    return saved;
  }

  /**
   * Elimina remove.
   *
   * @param id Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  async remove(id: string): Promise<void> {
    const incidencia = await this.findOne(id);
    const before = JSON.parse(JSON.stringify(incidencia)) as Incidencia;

    if (incidencia.estaResuelta()) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    await this.incidenciaRepository.remove(incidencia);

    await this.movimientoHelper.log({
      entidad: 'Incidencia',
      entidadId: id,
      accion: AccionMovimiento.DELETE,
      descripcion: `Eliminación de incidencia ${id}`,
      before,
    });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "resolverIncidencia" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {ResolverIncidenciaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} usuarioAutenticadoId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia>} Datos efectivos después de ejecutar la operación.
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

      const before = JSON.parse(JSON.stringify(incidencia)) as Incidencia;

      const ajustesLinea = dto.lineas ?? [];
      const lineasIncidencia = incidencia.lineas ?? [];
      for (const ajuste of ajustesLinea) {
        const linea =
          (ajuste.id
            ? lineasIncidencia.find((l) => l.id === ajuste.id)
            : undefined) ??
          (ajuste.pedidoProductoId
            ? lineasIncidencia.find(
                (l) => l.pedidoProductoId === ajuste.pedidoProductoId
              )
            : undefined);
        if (!linea) continue;

        if (ajuste.cantidadRecibida !== undefined) {
          linea.cantidadRecibida = Number(ajuste.cantidadRecibida);
        }
        if (ajuste.cantidadAjustada !== undefined) {
          linea.cantidadAjustada = Number(ajuste.cantidadAjustada);
        }

        linea.diferencia = linea.cantidadRecibida - linea.cantidadPedida;

        const total = linea.cantidadRecibida + linea.cantidadAjustada;
        if (
          Math.abs(total - linea.cantidadPedida) <
          IncidenciaService.CANTIDAD_EPSILON
        ) {
          linea.estado = EstadoLineaIncidencia.AJUSTADO;
          linea.necesitaAjuste = false;
        } else {
          linea.estado = EstadoLineaIncidencia.PENDIENTE_AJUSTE;
          linea.necesitaAjuste = true;
        }

        if (ajuste.observaciones !== undefined) {
          linea.observaciones = ajuste.observaciones;
        }

        await manager.save(IncidenciaLinea, linea);
      }

      let obs = dto.observacionesResolucion;
      if (dto.estadoFinal === EstadoFinalIncidenciaDto.CANCELADA) {
        obs = `[cancelada] ${obs || ''}`.trim();
        incidencia.resolver(usuarioResolutorId || 'sistema', obs || '');
      } else if (dto.estadoFinal === EstadoFinalIncidenciaDto.INVALIDA) {
        obs = `[invalida] ${obs || ''}`.trim();
        incidencia.resolver(usuarioResolutorId || 'sistema', obs || '');
      } else if (
        dto.estadoFinal === EstadoFinalIncidenciaDto.RESUELTA ||
        dto.marcarComoResuelta === true
      ) {
        incidencia.resolver(usuarioResolutorId || 'sistema', obs || '');
      } else if (obs) {
        incidencia.observacionesResolucion = obs;
      }

      const saved = await manager.save(Incidencia, incidencia);
      const resolved = await this.recalcularEstadoIncidencia(saved, manager);

      await this.movimientoHelper.log({
        userId: usuarioResolutorId,
        entidad: 'Incidencia',
        entidadId: id,
        accion: AccionMovimiento.RESOLVEINCIDENCIA,
        descripcion: `Resolución de incidencia ${id}`,
        before,
        after: resolved,
        manager,
      });

      return resolved;
    });
  }

  /**
   * Genera incidencias automáticas basadas en las discrepancias detectadas en una recepción.
   * Agrupa las discrepancias por pedido y proveedor.
   */
  /**
   * Expone "reportarIncidencia" en smart-economat-backend (Nest).
   * @undefined {ReportIncidenciaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia[]>} Datos efectivos después de ejecutar la operación.
   */
  async reportarIncidencia(dto: ReportIncidenciaDto): Promise<Incidencia[]> {
    const recepcion = await this.recepcionRepository.findOne({
      where: { id: dto.recepcionId },
    });

    if (!recepcion) {
      throw new NotFoundException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
    }

    return this.dataSource.transaction(async (manager) => {
      const recepcionProductos = await manager.find(RecepcionProducto, {
        where: { recepcionId: recepcion.id },
        relations: {
          pedidoProducto: {
            pedido: true,
          },
        },
      });

      const grupos = new Map<
        string,
        {
          pedidoId: string;
          proveedorId?: string;
          lineas: Map<string, any>;
        }
      >();

      for (const item of recepcionProductos) {
        const ppId = item.pedidoProductoId;
        const pedido = item.pedidoProducto?.pedido;
        if (!ppId || !pedido) continue;

        const key = `${pedido.id}_${pedido.proveedorId}`;
        if (!grupos.has(key)) {
          grupos.set(key, {
            pedidoId: pedido.id,
            proveedorId: pedido.proveedorId,
            lineas: new Map(),
          });
        }

        const grupo = grupos.get(key)!;

        if (!grupo.lineas.has(ppId)) {
          grupo.lineas.set(ppId, {
            pedidoProductoId: ppId,
            cantidadPedida: Number(item.pedidoProducto?.cantidad ?? 0),
            cantidadRecibida: 0,
            tipoDiferencia: TipoDiferencia.FALTANTE,
            observaciones: undefined,
          });
        }

        const linea = grupo.lineas.get(ppId);
        linea.cantidadRecibida += Number(item.cantidadRecibida ?? 0);

        if (item.estadoProducto === EstadoProductoRecepcion.ROTO) {
          linea.tipoDiferencia = TipoDiferencia.DEFECTUOSO;
        }

        if (item.observaciones?.trim()) {
          linea.observaciones = linea.observaciones
            ? `${linea.observaciones}; ${item.observaciones.trim()}`
            : item.observaciones.trim();
        }
      }

      const incidenciasCreadas: Incidencia[] = [];

      for (const [, grupo] of grupos.entries()) {
        const lineasConDiscrepancia = Array.from(grupo.lineas.values()).filter(
          (l) => {
            const dif = l.cantidadRecibida - l.cantidadPedida;
            const tieneRoto = l.tipoDiferencia === TipoDiferencia.DEFECTUOSO;

            if (!tieneRoto) {
              if (dif > IncidenciaService.CANTIDAD_EPSILON) {
                l.tipoDiferencia = TipoDiferencia.EXCESO;
              } else {
                l.tipoDiferencia = TipoDiferencia.FALTANTE;
              }
            }

            return (
              tieneRoto || Math.abs(dif) >= IncidenciaService.CANTIDAD_EPSILON
            );
          }
        );

        if (lineasConDiscrepancia.length === 0) continue;

        const incidencia = manager.create(Incidencia, {
          recepcionId: recepcion.id,
          pedidoId: grupo.pedidoId,
          proveedorId: grupo.proveedorId,
          estado: EstadoIncidencia.ABIERTA,
          observacionesRecepcion: `Incidencia automática desde recepción. Tipo: ${dto.tipo}`,
        });

        const savedIncidencia = await manager.save(Incidencia, incidencia);

        const entityLineas = lineasConDiscrepancia.map((l) =>
          manager.create(IncidenciaLinea, {
            incidencia: savedIncidencia,
            pedidoProductoId: l.pedidoProductoId,
            cantidadPedida: l.cantidadPedida,
            cantidadRecibida: l.cantidadRecibida,
            cantidadAjustada: 0,
            diferencia: l.cantidadRecibida - l.cantidadPedida,
            tipoDiferencia: l.tipoDiferencia,
            necesitaAjuste: true,
            estado: EstadoLineaIncidencia.PENDIENTE_AJUSTE,
            estadoReclamacion: EstadoReclamacion.PENDIENTE,
            observaciones: l.observaciones,
          })
        );

        savedIncidencia.lineas = await manager.save(
          IncidenciaLinea,
          entityLineas
        );

        const finalInc = await this.recalcularEstadoIncidencia(
          savedIncidencia,
          manager
        );
        await this.movimientoHelper.log({
          entidad: 'Incidencia',
          entidadId: finalInc.id,
          accion: AccionMovimiento.CREATE,
          descripcion: `Creación automática de incidencia ${finalInc.id}`,
          after: finalInc,
          manager,
        });
        incidenciasCreadas.push(finalInc);
      }

      if (incidenciasCreadas.length > 0) {
        recepcion.incidencia = true;
        await manager.save(Recepcion, recepcion);
      } else {
        throw new BadRequestException(
          'No se detectaron discrepancias que justifiquen la creación de una incidencia.'
        );
      }

      return incidenciasCreadas;
    });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  /**
   * Expone "resolverIncidenciaTransaccional" en smart-economat-backend (Nest).
   * @undefined {string} id - Entrada efectiva esperada por el contrato.
   * @undefined {ResolveIncidenciaDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} usuarioId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Incidencia>} Datos efectivos después de ejecutar la operación.
   */
  async resolverIncidenciaTransaccional(
    id: string,
    dto: ResolveIncidenciaDto,
    usuarioId: string
  ): Promise<Incidencia> {
    const incidencia = await this.findOne(id);
    const before = JSON.parse(JSON.stringify(incidencia)) as Incidencia;

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

      incidencia.resolver(usuarioId, dto.observaciones);
      await manager.save(incidencia);

      if (incidencia.pedidoId) {
        await this.syncPedidoStatusAfterIncidenciaResolution(
          incidencia.pedidoId,
          manager
        );
      }

      const resolved = await this.recalcularEstadoIncidencia(
        incidencia,
        manager
      );

      await this.movimientoHelper.log({
        userId: usuarioId,
        tipo:
          dto.accion === TipoResolucion.DEVOLUCION
            ? TipoMovimiento.SALIDA_AJUSTE
            : TipoMovimiento.AUDITORIA,
        entidad: 'Incidencia',
        entidadId: incidencia.id,
        accion: AccionMovimiento.RESOLVEINCIDENCIA,
        descripcion: `Resolución transaccional de incidencia (${dto.accion}): ${dto.observaciones || ''}`,
        before,
        after: resolved,
        manager,
      });

      return resolved;
    });
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private async recalcularEstadoIncidencia(
    incidencia: Incidencia,
    manager: EntityManager
  ): Promise<Incidencia> {
    const lineas = incidencia.lineas ?? [];
    if (lineas.length === 0) {
      throw new BadRequestException(
        'No se puede persistir una incidencia sin líneas de producto.'
      );
    }

    if (incidencia.estaResuelta()) {
      return manager.save(Incidencia, incidencia);
    }

    const todasAjustadas = lineas.every(
      (l) =>
        l.estado === EstadoLineaIncidencia.AJUSTADO ||
        l.estado === EstadoLineaIncidencia.SIN_PROBLEMA
    );
    const algunaAjustada = lineas.some(
      (l) => l.estado === EstadoLineaIncidencia.AJUSTADO
    );

    if (todasAjustadas) {
      incidencia.estado = EstadoIncidencia.EN_PROCESO;
      incidencia.fechaResolucion = null;
      incidencia.usuarioResolutorId = undefined;
    } else if (algunaAjustada) {
      incidencia.estado = EstadoIncidencia.EN_PROCESO;
    } else {
      incidencia.estado = EstadoIncidencia.ABIERTA;
    }

    const saved = await manager.save(Incidencia, incidencia);

    return saved;
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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
   * Ejecuta la lógica de append state tag dentro del flujo de la aplicación.
   *
   * @param base Parámetro de entrada para la operación.
   * @param tag Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
   * Determina si linea balanceada.
   *
   * @param linea Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
   */
  private isLineaBalanceada(linea: IncidenciaLinea): boolean {
    return (
      Math.abs(Number(linea.cantidadRecibida) - Number(linea.cantidadPedida)) <
      IncidenciaService.CANTIDAD_EPSILON
    );
  }

  /**
   * Resuelve estado reclamacion a partir del contexto disponible.
   *
   * @param linea Parámetro de entrada para la operación.
   * @returns Valor resultante de la operación.
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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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

      const ajusteCantidadDefinido = ajuste.cantidadAjustada !== undefined;
      const cantidadRecibidaDefinida = ajuste.cantidadRecibida !== undefined;

      if (ajusteCantidadDefinido && cantidadRecibidaDefinida) {
        throw new BadRequestException(
          'No se puede enviar cantidadRecibida y cantidadAjustada al mismo tiempo en la misma línea.'
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
          cantidadBase + Number(ajuste.cantidadAjustada)
        );
        linea.diferencia =
          Number(linea.cantidadRecibida) - Number(linea.cantidadPedida);

        if (linea.diferencia > 0) {
          linea.tipoDiferencia = TipoDiferencia.EXCESO;
        } else if (linea.diferencia < 0) {
          linea.tipoDiferencia = TipoDiferencia.FALTANTE;
        }
      }

      if (cantidadRecibidaDefinida) {
        linea.cantidadRecibida = Number(ajuste.cantidadRecibida);
        linea.diferencia =
          Number(linea.cantidadRecibida) - Number(linea.cantidadPedida);

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
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
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

      if (!recepcionProducto.pedidoProducto) {
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
      const cantidadPedida = Number(lineaPedido.cantidad);
      const cantidadRecibida = cantidadesRecibidas.get(lineaPedido.id) ?? 0;
      return (
        Math.abs(cantidadPedida - cantidadRecibida) <
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
