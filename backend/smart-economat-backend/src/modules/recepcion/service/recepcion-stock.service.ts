import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { Albaran } from '../../albaran/albaran.entity/albaran.entity';
import { AlbaranPedidoRecepcion } from '../../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import {
  CreateRecepcionDto,
  RecepcionLineDto,
} from '../dto/create-recepcion.dto';
import { RecepcionResultadoDto } from '../dto/recepcion-resultado.dto';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import {
  TipoMovimiento,
  AccionMovimiento,
} from '../../movimiento/enums/movimiento.enums';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';
import { EstadoPedido } from '../../pedido/enums/estado-pedido.enum';
import { PedidoStatusTrigger } from '../../pedido/enums/pedido-status-trigger.enum';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { IncidenciaLinea } from '../../incidencia/incidencia-linea.entity/incidencia-linea.entity';
import {
  EstadoIncidencia,
  EstadoLineaIncidencia,
  TipoDiferencia,
} from '../../incidencia/enums/incidencia.enums';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { ensureDefaultAlmacenPrincipalUbicacion } from '../../ubicacion/utils/ensure-default-almacen-ubicacion.util';
import { EstadoRecepcion } from '../enums/estado-recepcion.enum';
import { EstadoProductoRecepcion } from '../enums/estado-producto.enum';
import { EstadoVisualProducto } from '../enums/estado-visual.enum';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import { PedidoService } from '../../pedido/service/pedido.service';
import {
  RecepcionMasivaLoteDto,
  RecepcionMasivaProductoDto,
} from '../dto/recepcion-masiva.dto';
import {
  permiteComputarComoRecibido,
  permiteIncrementarInventario,
  resolveEstadoProducto,
} from '../utils/recepcion-producto-state.util';

import { EventEmitter2 } from '@nestjs/event-emitter';
import { RecepcionCompletadaEvent } from '../events/recepcion-completada.event';
import { HistorialPrecio } from '../../producto/historial-precio-proveedor.entity/historial.entity';
import { ProductoService } from '../../producto/service/producto.service';

interface LineaIncidencia {
  idPedidoProducto: string;
  nombreProducto: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  diferencia: number;
  tipo: TipoDiferencia;
  observaciones?: string;
}

interface IncidenciaGenerada {
  id: string;
  estado: string;
  datosOriginales: { productos: LineaIncidencia[] };
}

interface LineaRecepcionConCantidad {
  cantidadRecibida: number;
}

const PEDIDO_RECEPCION_ESTADOS_PERMITIDOS: readonly EstadoPedido[] = [
  EstadoPedido.POR_RECEPCIONAR,
];

interface PedidoActualizado {
  id: string;
  estadoAnterior: string;
  estadoNuevo: string;
}

type RecepcionLineaProcesada = RecepcionLineDto & {
  estadoVisual: EstadoVisualProducto;
  estadoProducto: EstadoProductoRecepcion;
};

/**
 * Servicio de dominio para recepcion stock.
 */
@Injectable()
export class RecepcionStockService {
  private readonly logger = new Logger(RecepcionStockService.name);

  /**
   * Construye la instancia configurada.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   * @undefined {PedidoService} pedidoService - Entrada efectiva esperada por el contrato.
   * @undefined {EventEmitter2} eventEmitter - Entrada efectiva esperada por el contrato.
   * @undefined {ProductoService} productoService - Entrada efectiva esperada por el contrato.
   * @undefined {MovimientoHelper} movimientoHelper - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private dataSource: DataSource,
    private readonly pedidoService: PedidoService,
    private readonly eventEmitter: EventEmitter2,
    private readonly productoService: ProductoService,
    private readonly movimientoHelper: MovimientoHelper
  ) {}

  /**
   * Expone "procesarRecepcionMasiva" en smart-economat-backend (Nest).
   * @undefined {RecepcionMasivaLoteDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {string} userId - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecepcionResultadoDto>} Datos efectivos después de ejecutar la operación.
   */
  async procesarRecepcionMasiva(
    dto: RecepcionMasivaLoteDto,
    userId: string
  ): Promise<RecepcionResultadoDto> {
    const usuario = await this.dataSource.manager.findOne(Usuario, {
      where: { id: userId },
    });
    if (!usuario) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));
    }

    const pedido = await this.dataSource.manager.findOne(Pedido, {
      where: { id: dto.pedidoId },
      relations: [
        'pedidoProductos',
        'pedidoProductos.productoProveedor',
        'pedidoProductos.productoProveedor.producto',
        'proveedor',
      ],
    });

    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }

    if (!PEDIDO_RECEPCION_ESTADOS_PERMITIDOS.includes(pedido.estado)) {
      throw new BadRequestException(
        I18nHelper.getError('ORDER_NOT_RECEPTABLE')
      );
    }

    const defaultUbicacionCommitted =
      await ensureDefaultAlmacenPrincipalUbicacion(this.dataSource.manager);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let movimientosGenerados = 0;
      let inventariosCreados = 0;
      const incidenciasGeneradas: IncidenciaGenerada[] = [];
      let recepcionEstadoEnum = EstadoRecepcion.COMPLETADA;

      const defaultUbicacion = await queryRunner.manager.findOneByOrFail(
        Ubicacion,
        { id: defaultUbicacionCommitted.id }
      );

      const recepcion = queryRunner.manager.create(Recepcion, {
        usuario: { id: userId },
        fechaRecepcion: new Date(),
        observaciones: dto.observaciones,
        estado: EstadoRecepcion.COMPLETADA,
        modifiedBy: userId,
      });
      const savedRecepcion = await queryRunner.manager.save(recepcion);

      await this.movimientoHelper.trackAction({
        userId,
        entidad: 'Recepcion',
        entidadId: savedRecepcion.id,
        accion: AccionMovimiento.CREATE,
        descripcion: `Recepción Masiva creada: ${savedRecepcion.observaciones || 'Sin observaciones'}`,
        after: savedRecepcion,
        manager: queryRunner.manager,
      });

      const nAlbaranFinal = await this.getOrGenerateAlbaranNumber(
        dto.nAlbaran,
        queryRunner.manager
      );

      let albaran = await queryRunner.manager.findOne(Albaran, {
        where: { nAlbaran: nAlbaranFinal },
      });

      if (!albaran) {
        albaran = queryRunner.manager.create(Albaran, {
          nAlbaran: nAlbaranFinal,
          fecha: savedRecepcion.fechaRecepcion,
          esAutomatico: !dto.nAlbaran,
        });
        albaran = await queryRunner.manager.save(albaran);
      }

      const rp = await queryRunner.manager.save(
        queryRunner.manager.create(RecepcionPedido, {
          recepcion: savedRecepcion,
          pedido: { id: pedido.id },
        })
      );

      await queryRunner.manager.save(
        queryRunner.manager.create(AlbaranPedidoRecepcion, {
          albaran,
          recepcionPedido: rp,
        })
      );

      const mapPedidoProductos = new Map<string, PedidoProducto>();
      const ppArr = pedido.pedidoProductos as unknown as PedidoProducto[];
      for (const pp of ppArr) {
        mapPedidoProductos.set(pp.id, pp);
      }

      const sumadoRecibidoPorPP = new Map<string, number>();
      const detallesRecibidos = new Map<string, RecepcionMasivaProductoDto[]>();

      const batchRecepcionProductos: RecepcionProducto[] = [];
      const batchInventarios: Inventario[] = [];
      const lineasConInventario: {
        linea: RecepcionMasivaProductoDto;
        ppRef: PedidoProducto;
        stockNuevo: Inventario;
      }[] = [];

      for (const linea of dto.productosRecibidos) {
        const estadoProducto = resolveEstadoProducto({
          estadoVisual: linea.estadoVisual,
        });
        const ppRef = mapPedidoProductos.get(linea.pedidoProductoId);
        if (!ppRef) {
          throw new BadRequestException(
            `PedidoProducto ${linea.pedidoProductoId} no pertenece al pedido seleccionado.`
          );
        }

        const cantidad = Number(linea.cantidadRecibida);
        if (isNaN(cantidad) || cantidad < 0) {
          throw new BadRequestException(
            `La cantidad recibida debe ser un número positivo.`
          );
        }

        if (cantidad > 100000) {
          throw new BadRequestException(
            `La cantidad recibida es irrealmente alta.`
          );
        }

        const valActual = sumadoRecibidoPorPP.get(ppRef.id) || 0;
        sumadoRecibidoPorPP.set(ppRef.id, valActual + cantidad);

        const detallesLinea = detallesRecibidos.get(ppRef.id) || [];
        detallesLinea.push(linea);
        detallesRecibidos.set(ppRef.id, detallesLinea);

        const weighed =
          typeof linea.isWeighedWithScale === 'boolean'
            ? linea.isWeighedWithScale
            : false;

        batchRecepcionProductos.push(
          queryRunner.manager.create(RecepcionProducto, {
            recepcion: savedRecepcion,
            cantidadAlbaran:
              linea.cantidadAlbaran !== undefined &&
              linea.cantidadAlbaran !== null
                ? linea.cantidadAlbaran
                : Number(ppRef.cantidad),
            cantidadRecibida: cantidad,
            estadoProducto,
            observaciones: linea.observaciones,
            pedidoProducto: { id: ppRef.id },
            isWeighedWithScale: weighed,
          })
        );

        if (cantidad > 0 && permiteIncrementarInventario(estadoProducto)) {
          const defaultExpiration = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          );
          const stockNuevo = queryRunner.manager.create(Inventario, {
            productoProveedor: ppRef.productoProveedor,
            cantidadActual: cantidad,
            cantidadMinima: 10,
            cantidadMaxima: Math.max(10, Number(cantidad) * 2),
            fechaEntrada: new Date(),
            ubicacion: defaultUbicacion,
            fechaCaducidad: linea.fechaCaducidad
              ? new Date(linea.fechaCaducidad)
              : defaultExpiration,
          });
          batchInventarios.push(stockNuevo);
          lineasConInventario.push({ linea, ppRef, stockNuevo });
        }
      }

      if (batchRecepcionProductos.length > 0) {
        await queryRunner.manager.save(batchRecepcionProductos);
      }

      if (batchInventarios.length > 0) {
        await queryRunner.manager.save(batchInventarios);
        inventariosCreados = batchInventarios.length;

        for (const item of lineasConInventario) {
          await this.movimientoHelper.trackInventarioMovimiento(
            userId,
            item.stockNuevo.id,
            TipoMovimiento.ENTRADA_COMPRA,
            item.linea.cantidadRecibida,
            item.ppRef.productoProveedorId,
            'Recepcion',
            savedRecepcion.id,
            `Recepción Masiva Pedido ${item.ppRef.id} - Lote ${item.linea.estadoVisual || 'ÓPTIMO'} - Albarán ${dto.nAlbaran || 'N/A'}`,
            AccionMovimiento.CREATE,
            undefined,
            item.stockNuevo,
            queryRunner.manager
          );
        }
        movimientosGenerados = lineasConInventario.length;

        const pmpUpdatesPending = new Map<
          string,
          { totalQty: number; weightedSum: number }
        >();
        for (const item of lineasConInventario) {
          const precioUnitario = Number(item.ppRef.precioUnitario);
          if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
            throw new BadRequestException(
              I18nHelper.getError('PRICE_MUST_BE_GREATER_THAN_ZERO')
            );
          }

          const cantidadRecibida = Number(item.linea.cantidadRecibida);

          const historial = queryRunner.manager.create(HistorialPrecio, {
            productoProveedorId: item.ppRef.productoProveedorId,
            precio: precioUnitario,
            cantidad: cantidadRecibida,
            documentoOrigen: dto.nAlbaran || 'N/A',
            recepcionId: savedRecepcion.id,
            fecha: new Date(),
          });
          await queryRunner.manager.save(historial);

          const pmpData = pmpUpdatesPending.get(
            item.ppRef.productoProveedorId
          ) || { totalQty: 0, weightedSum: 0 };
          pmpUpdatesPending.set(item.ppRef.productoProveedorId, {
            totalQty: pmpData.totalQty + cantidadRecibida,
            weightedSum:
              pmpData.weightedSum + cantidadRecibida * precioUnitario,
          });
        }

        for (const [ppId, data] of pmpUpdatesPending.entries()) {
          if (this.productoService?.actualizarPMP) {
            const avgPrice = data.weightedSum / data.totalQty;
            await this.productoService.actualizarPMP(
              ppId,
              data.totalQty,
              avgPrice,
              queryRunner.manager
            );
          }
        }
      }

      const lineasIncidencia = this.buildLineasIncidenciaCantidad(
        ppArr,
        detallesRecibidos
      );

      for (const pp of ppArr) {
        const lineasRecibidas = detallesRecibidos.get(pp.id) || [];

        let subCantRotaDefectuosa = 0;

        for (const lr of lineasRecibidas) {
          if (lr.estadoVisual !== EstadoVisualProducto.OPTIMO) {
            subCantRotaDefectuosa += Number(lr.cantidadRecibida);
          }
        }

        if (subCantRotaDefectuosa > 0) {
          const observacionesMermas = lineasRecibidas
            .filter((lr) => lr.estadoVisual !== EstadoVisualProducto.OPTIMO)
            .map((lr) => lr.observaciones)
            .filter(Boolean)
            .join('; ');

          lineasIncidencia.push({
            idPedidoProducto: pp.id,
            nombreProducto:
              pp.productoProveedor?.producto?.nombre || 'Producto',
            cantidadPedida: Number(pp.cantidad),
            cantidadRecibida: subCantRotaDefectuosa,
            diferencia: -subCantRotaDefectuosa,
            tipo: TipoDiferencia.DEFECTUOSO,
            observaciones: observacionesMermas,
          });
        }
      }

      if (lineasIncidencia.length > 0) {
        recepcionEstadoEnum = EstadoRecepcion.CON_INCIDENCIAS;
        const savedInci = await this.crearIncidenciaConLineas(
          queryRunner.manager,
          savedRecepcion,
          pedido,
          dto.observaciones ||
            'Generado vía Recepción Masiva con discrepancias.',
          lineasIncidencia
        );

        incidenciasGeneradas.push({
          id: savedInci.id,
          estado: EstadoIncidencia.ABIERTA,
          datosOriginales: { productos: lineasIncidencia },
        });
      }

      savedRecepcion.incidencia = incidenciasGeneradas.length > 0;
      savedRecepcion.estado = recepcionEstadoEnum;
      await queryRunner.manager.save(savedRecepcion);

      const estadoPasado = pedido.estado;
      const finalState = await this.actualizarEstadoPedido(
        pedido.id,
        queryRunner.manager,
        userId
      );

      await queryRunner.commitTransaction();

      this.eventEmitter.emit(
        'recepcion.completada',
        new RecepcionCompletadaEvent(
          savedRecepcion.id,
          nAlbaranFinal,
          [pedido.id],
          savedRecepcion.fechaRecepcion,
          userId
        )
      );

      return {
        id: savedRecepcion.id,
        fechaRecepcion: savedRecepcion.fechaRecepcion,
        incidencias: incidenciasGeneradas,
        pedidosActualizados: [
          {
            id: pedido.id,
            estadoAnterior: estadoPasado,
            estadoNuevo: finalState,
          },
        ],
        movimientosGenerados,
        inventariosCreados,
        productosCreados: [],
      };
    } catch (error: unknown) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      const err = error as Error;
      throw new BadRequestException(
        I18nHelper.getError('RECEPTION_FAILED', { message: err.message })
      );
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Expone "procesarRecepcion" en smart-economat-backend (Nest).
   * @undefined {CreateRecepcionDto} dto - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<RecepcionResultadoDto>} Datos efectivos después de ejecutar la operación.
   */
  async procesarRecepcion(
    dto: CreateRecepcionDto
  ): Promise<RecepcionResultadoDto> {
    const usuario = await this.dataSource.manager.findOne(Usuario, {
      where: { id: dto.usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException(I18nHelper.getError('USER_NOT_FOUND'));
    }

    const listaPedidos =
      dto.pedidos ||
      (dto.pedidoIds || []).map((id) => ({
        pedidoId: id,
        nAlbaran: dto.nAlbaran,
        observaciones: dto.observaciones,
      }));
    const pedidoIdsList = listaPedidos.map((p) => p.pedidoId);

    if (pedidoIdsList.length === 0) {
      throw new BadRequestException(I18nHelper.getError('NO_ORDERS_SPECIFIED'));
    }

    const uniquePedidoIds = [...new Set(pedidoIdsList)];

    const pedidosArr = await this.dataSource.manager.find(Pedido, {
      where: { id: In(uniquePedidoIds) },
      relations: [
        'pedidoProductos',
        'pedidoProductos.productoProveedor',
        'pedidoProductos.productoProveedor.producto',
        'proveedor',
      ],
    });

    if (pedidosArr.length !== uniquePedidoIds.length) {
      const foundIds = pedidosArr.map((p) => p.id);
      const missingIds = uniquePedidoIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(
        `${I18nHelper.getError('ORDER_NOT_FOUND')}: ${missingIds.join(', ')}`
      );
    }

    const pedidosInvalidos = pedidosArr.filter(
      (p) => !PEDIDO_RECEPCION_ESTADOS_PERMITIDOS.includes(p.estado)
    );
    if (pedidosInvalidos.length > 0) {
      const invalidIds = pedidosInvalidos.map((p) => p.id);
      throw new BadRequestException(
        `${I18nHelper.getError('ORDER_NOT_RECEPTABLE')}: ${invalidIds.join(', ')}`
      );
    }

    const allowedPedidoProductoIds = new Set<string>();
    for (const p of pedidosArr) {
      for (const pp of p.pedidoProductos ?? []) {
        allowedPedidoProductoIds.add(pp.id);
      }
    }
    for (const linea of dto.productos) {
      if (!allowedPedidoProductoIds.has(linea.pedidoProductoId)) {
        throw new BadRequestException(
          `PedidoProducto ${linea.pedidoProductoId} no pertenece al pedido seleccionado.`
        );
      }
    }

    const defaultUbicacionCommitted =
      await ensureDefaultAlmacenPrincipalUbicacion(this.dataSource.manager);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let movimientosGenerados = 0;
      let inventariosCreados = 0;
      const incidenciasGeneradas: IncidenciaGenerada[] = [];
      const productosCreados: {
        id: string;
        nombre: string;
        codigoBarras: string;
      }[] = [];
      const batchRecepcionProductos: RecepcionProducto[] = [];
      let recepcionEstadoEnum = EstadoRecepcion.COMPLETADA;

      const defaultProvider = pedidosArr[0].proveedor;

      const observacionesGlobales =
        dto.observaciones ||
        listaPedidos
          .map((p) => p.observaciones)
          .filter(Boolean)
          .join(' | ');

      const recepcion = queryRunner.manager.create(Recepcion, {
        usuario: { id: dto.usuarioId },
        fechaRecepcion: dto.fechaRecepcion || new Date(),
        observaciones: observacionesGlobales,
        estado: EstadoRecepcion.COMPLETADA,
        modifiedBy: dto.usuarioId,
      });
      const savedRecepcion = await queryRunner.manager.save(recepcion);

      await this.movimientoHelper.trackAction({
        userId: dto.usuarioId,
        entidad: 'Recepcion',
        entidadId: savedRecepcion.id,
        accion: AccionMovimiento.CREATE,
        descripcion: `Recepción creada: ${savedRecepcion.observaciones || 'Sin observaciones'}`,
        after: savedRecepcion,
        manager: queryRunner.manager,
      });

      const defaultUbicacion = await queryRunner.manager.findOneByOrFail(
        Ubicacion,
        { id: defaultUbicacionCommitted.id }
      );

      if (dto.productosNuevos && dto.productosNuevos.length > 0) {
        for (const pNew of dto.productosNuevos) {
          let savedProd: Producto | null = null;
          if (pNew.codigoBarras) {
            savedProd = await queryRunner.manager.findOne(Producto, {
              where: { codigoBarras: pNew.codigoBarras },
            });
          }

          if (!savedProd) {
            const prod = queryRunner.manager.create(Producto, {
              nombre: pNew.nombre,
              marca: pNew.marca,
              unidad: pNew.unidad as any,
              tipo: pNew.tipo as any,
              codigoBarras: pNew.codigoBarras,
              contenido: pNew.contenido,
              pmp: 0,
            });
            savedProd = await queryRunner.manager.save(prod);
          }

          let savedPP = await queryRunner.manager.findOne(ProductoProveedor, {
            where: {
              productoId: savedProd.id,
              proveedorId: defaultProvider?.id,
            },
          });

          if (!savedPP) {
            const pp = queryRunner.manager.create(ProductoProveedor, {
              producto: savedProd,
              proveedor: defaultProvider as any,
              marca: pNew.marca,
              codigoBarras: pNew.codigoBarras,

              precioUnitario: 0.01,
              pmp: 0,
            });
            savedPP = await queryRunner.manager.save(pp);
          }

          productosCreados.push({
            id: savedProd.id,
            nombre: savedProd.nombre,
            codigoBarras: savedProd.codigoBarras || '',
          });

          const weighedNew = !!pNew.isWeighedWithScale;

          batchRecepcionProductos.push(
            queryRunner.manager.create(RecepcionProducto, {
              recepcion: savedRecepcion,
              cantidadAlbaran: pNew.cantidadAlbaran ?? 0,
              cantidadRecibida: pNew.cantidadRecibida,
              estadoProducto: EstadoProductoRecepcion.PERFECTO,
              observaciones: pNew.observaciones,
              pedidoProducto: null as any,
              isWeighedWithScale: weighedNew,
            })
          );

          if (pNew.cantidadRecibida > 0) {
            const inv = queryRunner.manager.create(Inventario, {
              productoProveedor: savedPP,
              cantidadActual: pNew.cantidadRecibida,
              cantidadMinima: 10,
              cantidadMaxima: Math.max(10, Number(pNew.cantidadRecibida) * 2),
              fechaEntrada: new Date(),
              ubicacion: defaultUbicacion,
              fechaCaducidad: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            });
            const savedInv = await queryRunner.manager.save(inv);
            inventariosCreados++;

            await this.movimientoHelper.trackInventarioMovimiento(
              dto.usuarioId,
              savedInv.id,
              TipoMovimiento.ENTRADA_COMPRA,
              pNew.cantidadRecibida,
              savedPP.id,
              'Recepcion',
              savedRecepcion.id,
              `Producto Nuevo ${savedProd.nombre} - Albarán ${dto.nAlbaran || 'N/A'}`,
              AccionMovimiento.CREATE,
              undefined,
              savedInv,
              queryRunner.manager
            );
            movimientosGenerados++;
          }
        }
      }

      const albaranesCache = new Map<string, Albaran>();

      for (const pRef of listaPedidos) {
        const rp = await queryRunner.manager.save(
          queryRunner.manager.create(RecepcionPedido, {
            recepcion: savedRecepcion,
            pedido: { id: pRef.pedidoId },
          })
        );

        const nAlbaranFinal = await this.getOrGenerateAlbaranNumber(
          pRef.nAlbaran || dto.nAlbaran,
          queryRunner.manager
        );

        let albaran: Albaran | null | undefined =
          albaranesCache.get(nAlbaranFinal);
        if (!albaran) {
          albaran = await queryRunner.manager.findOne(Albaran, {
            where: { nAlbaran: nAlbaranFinal },
          });

          if (!albaran) {
            albaran = queryRunner.manager.create(Albaran, {
              nAlbaran: nAlbaranFinal,
              fecha: savedRecepcion.fechaRecepcion,
              esAutomatico: !(pRef.nAlbaran || dto.nAlbaran),
            });
            albaran = await queryRunner.manager.save(albaran);
          }
          albaranesCache.set(nAlbaranFinal, albaran);
        }

        await queryRunner.manager.save(
          queryRunner.manager.create(AlbaranPedidoRecepcion, {
            albaran,
            recepcionPedido: rp,
          })
        );
      }

      const mapPedidoProductos = new Map<string, PedidoProducto>();
      for (const p of pedidosArr) {
        const ppArr = p.pedidoProductos as unknown as PedidoProducto[];
        for (const pp of ppArr) {
          mapPedidoProductos.set(pp.id, pp);
        }
      }

      const pmpUpdatesPending = new Map<
        string,
        { totalQty: number; weightedSum: number }
      >();
      const detallesRecibidos = new Map<string, RecepcionLineaProcesada[]>();
      const pedidoPorPedidoProducto = new Map<string, Pedido>();

      for (const pedido of pedidosArr) {
        const ppArr = pedido.pedidoProductos as unknown as PedidoProducto[];
        for (const pp of ppArr) {
          pedidoPorPedidoProducto.set(pp.id, pedido);
        }
      }

      for (const linea of dto.productos) {
        const ppRef = mapPedidoProductos.get(linea.pedidoProductoId);
        if (!ppRef) {
          throw new BadRequestException(
            `PedidoProducto ${linea.pedidoProductoId} no pertenece al pedido seleccionado.`
          );
        }
        if (!pedidoPorPedidoProducto.get(ppRef.id)) {
          throw new BadRequestException(
            `PedidoProducto ${linea.pedidoProductoId} no pertenece al pedido seleccionado.`
          );
        }

        const estadoVirtualDefault =
          linea.estadoVisual || EstadoVisualProducto.OPTIMO;
        const estadoProducto = resolveEstadoProducto({
          estadoProducto: linea.estadoProducto,
          estadoVisual: estadoVirtualDefault,
        });

        const entry: RecepcionLineaProcesada = {
          ...linea,
          estadoVisual: estadoVirtualDefault,
          estadoProducto,
        };
        const detallesLinea = detallesRecibidos.get(ppRef.id) || [];
        detallesLinea.push(entry);
        detallesRecibidos.set(ppRef.id, detallesLinea);
      }

      const incidenciasPorPedido = new Map<string, LineaIncidencia[]>();

      for (const pedido of pedidosArr) {
        const ppArr = pedido.pedidoProductos as unknown as PedidoProducto[];
        const lineasIncidencia = this.buildLineasIncidenciaCantidad(
          ppArr,
          detallesRecibidos
        );

        for (const pp of ppArr) {
          const lineasRecibidas = detallesRecibidos.get(pp.id) || [];

          let subCantRotaDefectuosa = 0;

          for (const lr of lineasRecibidas) {
            if (lr.estadoVisual !== EstadoVisualProducto.OPTIMO) {
              subCantRotaDefectuosa += Number(lr.cantidadRecibida);
            }
          }

          if (subCantRotaDefectuosa > 0) {
            const observacionesMermas = lineasRecibidas
              .filter((lr) => lr.estadoVisual !== EstadoVisualProducto.OPTIMO)
              .map((lr) => lr.observaciones)
              .filter(Boolean)
              .join('; ');

            lineasIncidencia.push({
              idPedidoProducto: pp.id,
              nombreProducto:
                pp.productoProveedor?.producto?.nombre || 'Producto',
              cantidadPedida: Number(pp.cantidad),
              cantidadRecibida: subCantRotaDefectuosa,
              diferencia: -subCantRotaDefectuosa,
              tipo: TipoDiferencia.DEFECTUOSO,
              observaciones: observacionesMermas,
            });
          }
        }

        if (lineasIncidencia.length > 0) {
          incidenciasPorPedido.set(pedido.id, lineasIncidencia);
        }
      }

      for (const [pedidoId, lineas] of incidenciasPorPedido.entries()) {
        const pedidoObj = pedidosArr.find((p) => p.id === pedidoId);
        if (!pedidoObj) continue;

        recepcionEstadoEnum = EstadoRecepcion.CON_INCIDENCIAS;
        const incidencia = await this.crearIncidenciaConLineas(
          queryRunner.manager,
          savedRecepcion,
          pedidoObj,
          observacionesGlobales || 'Incidencia detectada en recepción.',
          lineas
        );

        incidenciasGeneradas.push(
          this.toIncidenciaGenerada(incidencia.id, lineas)
        );

        for (const lineaInci of lineas) {
          await queryRunner.manager.update(
            RecepcionProducto,
            {
              recepcion: { id: savedRecepcion.id },
              pedidoProducto: { id: lineaInci.idPedidoProducto },
            },
            { incidencia: { id: incidencia.id } }
          );
        }
      }

      for (const linea of dto.productos) {
        const ppRef = mapPedidoProductos.get(linea.pedidoProductoId);
        if (!ppRef) {
          throw new BadRequestException(
            `PedidoProducto ${linea.pedidoProductoId} no pertenece al pedido seleccionado.`
          );
        }

        const estadoVirtualDefault =
          linea.estadoVisual || EstadoVisualProducto.OPTIMO;
        const estadoProducto = resolveEstadoProducto({
          estadoProducto: linea.estadoProducto,
          estadoVisual: estadoVirtualDefault,
        });

        const weighed = !!linea.isWeighedWithScale;

        batchRecepcionProductos.push(
          queryRunner.manager.create(RecepcionProducto, {
            recepcion: savedRecepcion,
            cantidadAlbaran:
              linea.cantidadAlbaran !== undefined &&
              linea.cantidadAlbaran !== null
                ? linea.cantidadAlbaran
                : Number(ppRef.cantidad),
            cantidadRecibida: linea.cantidadRecibida,
            estadoProducto,
            observaciones: linea.observaciones,
            pedidoProducto: { id: ppRef.id },
            isWeighedWithScale: weighed,
          })
        );

        if (
          linea.cantidadRecibida > 0 &&
          permiteIncrementarInventario(estadoProducto)
        ) {
          const defaultExpiration = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          );
          const stockNuevo = queryRunner.manager.create(Inventario, {
            productoProveedor: ppRef.productoProveedor as any,
            cantidadActual: linea.cantidadRecibida,
            cantidadMinima: 10,
            cantidadMaxima: Math.max(10, Number(linea.cantidadRecibida) * 2),
            fechaEntrada: new Date(),
            ubicacion: defaultUbicacion,
            fechaCaducidad: linea.fechaCaducidad
              ? new Date(linea.fechaCaducidad)
              : defaultExpiration,
          });

          const savedStock = await queryRunner.manager.save(stockNuevo);
          inventariosCreados++;

          await this.movimientoHelper.trackInventarioMovimiento(
            dto.usuarioId,
            savedStock.id,
            TipoMovimiento.ENTRADA_COMPRA,
            linea.cantidadRecibida,
            ppRef.productoProveedorId,
            'Recepcion',
            savedRecepcion.id,
            `Recepción Pedido ${ppRef.id} - Lote ${estadoVirtualDefault} - Albarán ${dto.nAlbaran || 'N/A'}`,
            AccionMovimiento.CREATE,
            undefined,
            savedStock,
            queryRunner.manager
          );
          movimientosGenerados++;

          const precioUnitario = Number(ppRef.precioUnitario);
          if (!Number.isFinite(precioUnitario) || precioUnitario <= 0) {
            throw new BadRequestException(
              I18nHelper.getError('PRICE_MUST_BE_GREATER_THAN_ZERO')
            );
          }

          const cantidadRecibida = Number(linea.cantidadRecibida);

          const historial = queryRunner.manager.create(HistorialPrecio, {
            productoProveedorId: ppRef.productoProveedorId,
            precio: precioUnitario,
            cantidad: cantidadRecibida,
            documentoOrigen: dto.nAlbaran || 'N/A',
            recepcionId: savedRecepcion.id,
            fecha: new Date(),
          });
          await queryRunner.manager.save(historial);

          const pmpData = pmpUpdatesPending.get(ppRef.productoProveedorId) || {
            totalQty: 0,
            weightedSum: 0,
          };
          pmpUpdatesPending.set(ppRef.productoProveedorId, {
            totalQty: pmpData.totalQty + cantidadRecibida,
            weightedSum:
              pmpData.weightedSum + cantidadRecibida * precioUnitario,
          });
        }
      }

      if (batchRecepcionProductos.length > 0) {
        await queryRunner.manager.save(batchRecepcionProductos);
      }

      for (const [ppId, data] of pmpUpdatesPending.entries()) {
        if (this.productoService?.actualizarPMP) {
          const avgPrice = data.weightedSum / data.totalQty;
          await this.productoService.actualizarPMP(
            ppId,
            data.totalQty,
            avgPrice,
            queryRunner.manager
          );
        }
      }

      savedRecepcion.incidencia = incidenciasGeneradas.length > 0;
      savedRecepcion.estado = recepcionEstadoEnum;
      await queryRunner.manager.save(savedRecepcion);

      const pedidosActualizadosFinal: PedidoActualizado[] = [];
      for (const p of pedidosArr) {
        const estadoPasado = p.estado;
        const finalState = await this.actualizarEstadoPedido(
          p.id,
          queryRunner.manager,
          dto.usuarioId
        );
        pedidosActualizadosFinal.push({
          id: p.id,
          estadoAnterior: estadoPasado,
          estadoNuevo: finalState,
        });
      }

      await queryRunner.commitTransaction();

      const nAlbaranReferencia =
        dto.nAlbaran || listaPedidos[0]?.nAlbaran || 'N/A';

      if (this.eventEmitter?.emit) {
        this.eventEmitter.emit(
          'recepcion.completada',
          new RecepcionCompletadaEvent(
            savedRecepcion.id,
            nAlbaranReferencia,
            uniquePedidoIds,
            savedRecepcion.fechaRecepcion,
            dto.usuarioId
          )
        );
      }

      return {
        id: savedRecepcion.id,
        fechaRecepcion: savedRecepcion.fechaRecepcion,
        incidencias: incidenciasGeneradas,
        pedidosActualizados: pedidosActualizadosFinal,
        movimientosGenerados: movimientosGenerados,
        inventariosCreados: inventariosCreados,
        productosCreados: productosCreados,
      };
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      throw new BadRequestException(
        I18nHelper.getError('RECEPTION_FAILED', { message: error.message })
      );
    } finally {
      await queryRunner.release();
    }
  }

  private async crearIncidenciaConLineas(
    manager: EntityManager,
    recepcion: Recepcion,
    pedido: Pedido,
    observacionesRecepcion: string | undefined,
    lineas: LineaIncidencia[]
  ): Promise<Incidencia> {
    if (lineas.length === 0) {
      throw new BadRequestException(
        'No se puede crear una incidencia sin líneas de producto.'
      );
    }

    const incidencia = manager.create(Incidencia, {
      recepcion,
      pedido: { id: pedido.id } as Pedido,
      proveedor: { id: pedido.proveedorId } as any,
      observacionesRecepcion,
      estado: EstadoIncidencia.ABIERTA,
    });

    const savedIncidencia = await manager.save(incidencia);

    const lineasPersistidas = lineas.map((linea) =>
      manager.create(IncidenciaLinea, {
        incidencia: savedIncidencia,
        pedidoProducto: { id: linea.idPedidoProducto } as PedidoProducto,
        cantidadPedida: linea.cantidadPedida,
        cantidadRecibida: linea.cantidadRecibida,
        cantidadAjustada: 0,
        diferencia: linea.diferencia,
        tipoDiferencia: linea.tipo,
        estado: EstadoLineaIncidencia.PENDIENTE_AJUSTE,
        necesitaAjuste: true,
        observaciones: linea.observaciones,
      })
    );

    await manager.save(lineasPersistidas);

    return savedIncidencia;
  }

  private buildLineasIncidenciaCantidad<
    TLinea extends LineaRecepcionConCantidad,
  >(
    pedidoProductos: PedidoProducto[],
    detallesRecibidos: Map<string, TLinea[]>
  ): LineaIncidencia[] {
    const lineasIncidencia: LineaIncidencia[] = [];

    for (const pedidoProducto of pedidoProductos) {
      const lineasRecibidas = detallesRecibidos.get(pedidoProducto.id) || [];
      const cantidadPedida = Number(pedidoProducto.cantidad);
      const cantidadRecibidaTotal = lineasRecibidas.reduce(
        (total, linea) => total + Number(linea.cantidadRecibida),
        0
      );
      const diferencia = cantidadRecibidaTotal - cantidadPedida;

      if (diferencia === 0) {
        continue;
      }

      lineasIncidencia.push({
        idPedidoProducto: pedidoProducto.id,
        nombreProducto:
          pedidoProducto.productoProveedor?.producto?.nombre || 'Producto',
        cantidadPedida,
        cantidadRecibida: cantidadRecibidaTotal,
        diferencia,
        tipo:
          cantidadRecibidaTotal === 0
            ? TipoDiferencia.FALTANTE
            : diferencia < 0
              ? TipoDiferencia.FALTANTE
              : TipoDiferencia.EXCESO,
      });
    }

    return lineasIncidencia;
  }

  private toIncidenciaGenerada(
    id: string,
    productos: LineaIncidencia[]
  ): IncidenciaGenerada {
    return {
      id,
      estado: 'PENDIENTE DE RESOLUCIÓN',
      datosOriginales: { productos },
    };
  }

  private buildIncidenciaLogMessage(params: {
    incidenciaId: string;
    recepcionId: string;
    pedidoId: string;
    proveedorNombre?: string;
    productoNombre?: string;
    nAlbaran?: string;
    descripcion?: string;
  }): string {
    return [
      `Incidencia ${params.incidenciaId} vinculada a recepción ${params.recepcionId}`,
      `pedido ${params.pedidoId}`,
      params.proveedorNombre ? `proveedor ${params.proveedorNombre}` : null,
      params.productoNombre ? `producto ${params.productoNombre}` : null,
      `albarán ${params.nAlbaran || 'N/A'}`,
      params.descripcion ? `detalle: ${params.descripcion}` : null,
    ]
      .filter(Boolean)
      .join(' | ');
  }

  private async actualizarEstadoPedido(
    pedidoId: string,
    manager: EntityManager,
    actorId?: string
  ): Promise<EstadoPedido> {
    const pedido = await manager.findOne(Pedido, {
      where: { id: pedidoId },
      relations: ['pedidoProductos'],
    });

    if (!pedido) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }

    const recepcionPedidos = await manager.find(RecepcionPedido, {
      where: { pedido: { id: pedido.id } },
      relations: [
        'recepcion',
        'recepcion.recepcionProductos',
        'recepcion.recepcionProductos.pedidoProducto',
        'recepcion.recepcionProductos.incidencia',
      ],
    });

    const pedidoProductosList =
      pedido.pedidoProductos as unknown as PedidoProducto[];
    const orderProductIds = new Set(pedidoProductosList.map((pp) => pp.id));

    let isIncidencia = false;
    const mapRecvd = new Map<string, number>();

    for (const repPedido of recepcionPedidos) {
      if (!repPedido.recepcion || !repPedido.recepcion.recepcionProductos)
        continue;
      for (const repProd of repPedido.recepcion.recepcionProductos) {
        if (
          repProd.pedidoProducto &&
          orderProductIds.has(repProd.pedidoProducto.id)
        ) {
          const estadoProducto: EstadoProductoRecepcion = Object.values(
            EstadoProductoRecepcion
          ).includes(repProd.estadoProducto)
            ? repProd.estadoProducto
            : EstadoProductoRecepcion.PERFECTO;
          const cantidadComputable = permiteComputarComoRecibido(estadoProducto)
            ? Number(repProd.cantidadRecibida)
            : 0;
          const curr = mapRecvd.get(repProd.pedidoProducto.id) || 0;
          mapRecvd.set(repProd.pedidoProducto.id, curr + cantidadComputable);
          if (
            estadoProducto &&
            estadoProducto !== EstadoProductoRecepcion.PERFECTO
          ) {
            isIncidencia = true;
          }
        }
      }
    }

    let isFull = true;
    for (const pp of pedidoProductosList) {
      const cantReq = Number(pp.cantidad);
      const cantRecv = mapRecvd.get(pp.id) || 0;
      if (cantRecv !== cantReq) {
        isFull = false;
      }
    }

    let trigger: PedidoStatusTrigger;
    if (isIncidencia) {
      trigger = PedidoStatusTrigger.INCIDENCIA;
    } else if (isFull) {
      trigger = PedidoStatusTrigger.RECEPCION_TOTAL;
    } else {
      trigger = PedidoStatusTrigger.RECEPCION_PARCIAL;
    }
    const updatedPedido = await this.pedidoService.handleStatusTransition(
      pedidoId,
      trigger,
      manager,
      actorId
    );
    return updatedPedido.estado;
  }

  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  private async getOrGenerateAlbaranNumber(
    nAlbaran?: string,
    manager?: EntityManager
  ): Promise<string> {
    if (nAlbaran) {
      return nAlbaran;
    }

    const queryManager = manager || this.dataSource.manager;
    const year = new Date().getFullYear();
    const prefix = `AUTO-${year}-`;

    const lastAlbaran = await queryManager
      .getRepository(Albaran)
      .createQueryBuilder('albaran')
      .where('albaran.n_albaran LIKE :prefix', { prefix: `${prefix}%` })
      .orderBy('albaran.createdAt', 'DESC')
      .getOne();

    let sequence = 1;
    if (lastAlbaran) {
      const parts = lastAlbaran.nAlbaran.split('-');
      const lastSeq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(lastSeq)) {
        sequence = lastSeq + 1;
      } else {
        sequence = Math.floor(Math.random() * 100000);
      }
    }

    const paddedSeq = sequence.toString().padStart(5, '0');

    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 7)
      .toUpperCase();
    return `${prefix}${paddedSeq}-${randomSuffix}`;
  }
}
