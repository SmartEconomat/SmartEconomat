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
import { TipoResolucion } from '../enums/incidencia.enums';
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

@Injectable()
export class IncidenciaService {
  private static readonly CANTIDAD_EPSILON = 0.0005;

  constructor(
    private readonly incidenciaRepository: IncidenciaRepository,
    @InjectRepository(Recepcion)
    private readonly recepcionRepository: Repository<Recepcion>,
    private readonly dataSource: DataSource,
    private readonly movimientoHelper: MovimientoHelper,
    private readonly pedidoService: PedidoService
  ) {}

  async create(dto: CreateIncidenciaDto): Promise<Incidencia> {
    const incidencia = this.incidenciaRepository.create({
      recepcion: { id: dto.recepcionId } as any,
      pedido: { id: dto.pedidoId } as any,
      observacionesRecepcion: dto.observacionesRecepcion,
    });

    return this.incidenciaRepository.save(incidencia);
  }

  async findAll(
    query: IncidenciaQueryDto,
    userRole?: string
  ): Promise<PaginatedResponseDto<Incidencia>> {
    return this.incidenciaRepository.findAllPaginated(query, userRole);
  }

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

    return this.incidenciaRepository.save(incidencia);
  }

  async remove(id: string): Promise<void> {
    const incidencia = await this.findOne(id);

    if (incidencia.estaResuelta()) {
      throw new BadRequestException(
        I18nHelper.getError('INCIDENCIA_YA_RESUELTA')
      );
    }

    await this.incidenciaRepository.remove(incidencia);
  }

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

      if (resolverExplicito || todasLasLineasBalanceadas) {
        if (!usuarioResolutorId) {
          throw new BadRequestException(
            'No se pudo determinar el usuario resolutor de la incidencia.'
          );
        }

        incidencia.resolver(usuarioResolutorId, dto.observacionesResolucion);
      }

      await manager.save(Incidencia, incidencia);

      if (incidencia.pedidoId) {
        await this.syncPedidoStatusAfterIncidenciaResolution(
          incidencia.pedidoId,
          manager
        );
      }

      return (
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
        })) ?? incidencia
      );
    });
  }

  async reportarIncidencia(dto: ReportIncidenciaDto): Promise<Incidencia> {
    const recepcion = await this.recepcionRepository.findOne({
      where: { id: dto.recepcionId },
    });

    if (!recepcion) {
      throw new NotFoundException(I18nHelper.getError('RECEPTION_NOT_FOUND'));
    }

    recepcion.incidencia = true;
    await this.recepcionRepository.save(recepcion);

    const incidencia = this.incidenciaRepository.create({
      recepcion: { id: dto.recepcionId } as any,
      observacionesRecepcion: `Incidencia reportada de tipo: ${dto.tipo}`,
    });

    return this.incidenciaRepository.save(incidencia);
  }

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

      return incidencia;
    });
  }

  private isLineaBalanceada(linea: IncidenciaLinea): boolean {
    return (
      Math.abs(
        Number(linea.cantidadRecibida) - Number(linea.cantidadEsperada)
      ) < IncidenciaService.CANTIDAD_EPSILON
    );
  }

  private resolveEstadoReclamacion(linea: IncidenciaLinea): EstadoReclamacion {
    if (this.isLineaBalanceada(linea)) {
      return EstadoReclamacion.ABONADO;
    }

    if (Number(linea.cantidadRecibida) > 0) {
      return EstadoReclamacion.RECLAMADO;
    }

    return EstadoReclamacion.PENDIENTE;
  }

  private applyLineaAjustes(
    lineas: IncidenciaLinea[],
    ajustes: ResolverIncidenciaLineaDto[]
  ): void {
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
