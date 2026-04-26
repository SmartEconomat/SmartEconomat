/**
 * Documentación en español.
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
 * Documentación en español.
 */
@Injectable()
export class IncidenciaService {
        /**
     * Documentación en español.
     */
  private static readonly CANTIDAD_EPSILON = 0.0005;

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
     */
  private attachEstadoComputado(incidencia: Incidencia): Incidencia {
    incidencia.resuelta = incidencia.estaResuelta();
    incidencia.estado = this.resolveEstadoIncidencia(incidencia);
    return incidencia;
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
     */
  private isLineaBalanceada(linea: IncidenciaLinea): boolean {
    return (
      Math.abs(
        Number(linea.cantidadRecibida) - Number(linea.cantidadEsperada)
      ) < IncidenciaService.CANTIDAD_EPSILON
    );
  }

        /**
     * Documentación en español.
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
     * Documentación en español.
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
     * Documentación en español.
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
