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
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { EstadoPedido } from '../../pedido/enums/estado-pedido.enum';
import { PedidoStatusTrigger } from '../../pedido/enums/pedido-status-trigger.enum';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import {
  IncidenciaLinea,
  TipoDiferencia,
} from '../../incidencia/incidencia-linea.entity/incidencia-linea.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
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
import { Inject, forwardRef } from '@nestjs/common';
import { ProductoService } from '../../producto/service/producto.service';

interface LineaIncidencia {
  idPedidoProducto: string;
  nombreProducto: string;
  cantidadPedida: number;
  cantidadRecibida: number;
  diferencia: number;
  tipo: string;
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
 * Documentación en español.
 */
@Injectable()
export class RecepcionStockService {
  private readonly logger = new Logger(RecepcionStockService.name);

  constructor(
    private dataSource: DataSource,
    private readonly pedidoService: PedidoService,
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => ProductoService))
    private readonly productoService: ProductoService
  ) {}

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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let movimientosGenerados = 0;
      let inventariosCreados = 0;
      const incidenciasGeneradas: IncidenciaGenerada[] = [];
      let recepcionEstadoEnum = EstadoRecepcion.COMPLETADA;

      let defaultUbicacion = await queryRunner.manager.findOne(Ubicacion, {
        where: { nombre: 'Almacén Principal' },
      });
      if (!defaultUbicacion) {
        defaultUbicacion = queryRunner.manager.create(Ubicacion, {
          nombre: 'Almacén Principal',
          descripcion: 'Ubicación por defecto del economato',
        });
        defaultUbicacion = await queryRunner.manager.save(defaultUbicacion);
      }

      const recepcion = queryRunner.manager.create(Recepcion, {
        usuario: { id: userId },
        fechaRecepcion: new Date(),
        observaciones: dto.observaciones,
        estado: EstadoRecepcion.COMPLETADA,
        modifiedBy: userId,
      });
      const savedRecepcion = await queryRunner.manager.save(recepcion);

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
            cantidadAlbaran: linea.cantidadAlbaran || null,
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

        const batchMovimientos: Movimiento[] = [];
        for (const item of lineasConInventario) {
          batchMovimientos.push(
            queryRunner.manager.create(Movimiento, {
              tipo: TipoMovimiento.ENTRADA_COMPRA,
              cantidad: item.linea.cantidadRecibida,
              entidadId: savedRecepcion.id,
              entidad: 'Recepcion',
              inventario: {
                id: item.stockNuevo.id,
              } as Movimiento['inventario'],
              productoProveedor: item.ppRef
                .productoProveedor as Movimiento['productoProveedor'],
              descripcion: `Recepción Masiva Pedido ${item.ppRef.id} - Lote ${item.linea.estadoVisual || 'ÓPTIMO'} - Albarán ${dto.nAlbaran || 'N/A'}`,
              usuario: { id: userId },
            })
          );
        }
        await queryRunner.manager.save(batchMovimientos);
        movimientosGenerados = batchMovimientos.length;

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
            tipo: 'DEFECTUOSO',
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
          estado: 'PENDIENTE DE RESOLUCIÓN',
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

      let defaultUbicacion = await queryRunner.manager.findOne(Ubicacion, {
        where: { nombre: 'Almacén Principal' },
      });
      if (!defaultUbicacion) {
        defaultUbicacion = queryRunner.manager.create(Ubicacion, {
          nombre: 'Almacén Principal',
          descripcion: 'Ubicación por defecto del economato',
        });
        defaultUbicacion = await queryRunner.manager.save(defaultUbicacion);
      }

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

            await queryRunner.manager.save(Movimiento, {
              tipo: TipoMovimiento.ENTRADA_COMPRA,
              cantidad: pNew.cantidadRecibida,
              entidadId: savedRecepcion.id,
              entidad: 'Recepcion',
              inventario: { id: savedInv.id } as any,
              descripcion: `Producto Nuevo ${savedProd.nombre} - Albarán ${dto.nAlbaran || 'N/A'}`,
              usuario: { id: dto.usuarioId },
            });
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

      const sumadoRecibidoPorPP = new Map<string, number>();
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
        const estadoVirtualDefault =
          linea.estadoVisual || EstadoVisualProducto.OPTIMO;
        const estadoProducto = resolveEstadoProducto({
          estadoProducto: linea.estadoProducto,
          estadoVisual: estadoVirtualDefault,
        });

        if (
          estadoProducto === EstadoProductoRecepcion.FALTA_TOTAL &&
          Number(linea.cantidadRecibida) > 0
        ) {
          throw new BadRequestException(
            'Una línea marcada como FALTA_TOTAL no puede incrementar cantidad recibida.'
          );
        }

        const ppRef = mapPedidoProductos.get(linea.pedidoProductoId);
        if (!ppRef) {
          throw new BadRequestException(
            `PedidoProducto ${linea.pedidoProductoId} no pertenece a los pedidos seleccionados.`
          );
        }

        const valActual = sumadoRecibidoPorPP.get(ppRef.id) || 0;
        sumadoRecibidoPorPP.set(
          ppRef.id,
          valActual + Number(linea.cantidadRecibida)
        );

        const detallesLinea = detallesRecibidos.get(ppRef.id) || [];
        detallesLinea.push({
          ...linea,
          estadoVisual: estadoVirtualDefault,
          estadoProducto,
        });
        detallesRecibidos.set(ppRef.id, detallesLinea);

        const recepcionProducto = queryRunner.manager.create(
          RecepcionProducto,
          {
            recepcion: savedRecepcion,
            cantidadAlbaran: linea.cantidadAlbaran || null,
            cantidadRecibida: linea.cantidadRecibida,
            estadoProducto,
            observaciones: linea.observaciones,
            pedidoProducto: { id: ppRef.id },
            isWeighedWithScale: linea.isWeighedWithScale || false,
          }
        );

        const savedRecepcionProducto =
          await queryRunner.manager.save(recepcionProducto);

        const pedidoRelacionado = pedidoPorPedidoProducto.get(ppRef.id);
        if (!pedidoRelacionado) {
          throw new BadRequestException(
            `Pedido asociado no encontrado para la línea ${ppRef.id}.`
          );
        }

        if (estadoProducto === EstadoProductoRecepcion.ROTO) {
          recepcionEstadoEnum = EstadoRecepcion.CON_INCIDENCIAS;

          const descripcionIncidencia =
            linea.incidenciaDescripcion ||
            linea.observaciones ||
            observacionesGlobales ||
            'Producto recibido roto durante la recepción.';

          const lineaIncidenciaRotura: LineaIncidencia = {
            idPedidoProducto: ppRef.id,
            nombreProducto:
              ppRef.productoProveedor?.producto?.nombre || 'Producto',
            cantidadPedida: Number(ppRef.cantidad),
            cantidadRecibida: Number(linea.cantidadRecibida),
            diferencia: -Number(linea.cantidadRecibida),
            tipo: 'DEFECTUOSO',
            observaciones: descripcionIncidencia,
          };

          const incidenciaRotura = await this.crearIncidenciaConLineas(
            queryRunner.manager,
            savedRecepcion,
            pedidoRelacionado,
            descripcionIncidencia,
            [lineaIncidenciaRotura]
          );

          savedRecepcionProducto.incidencia = incidenciaRotura;
          savedRecepcionProducto.incidenciaId = incidenciaRotura.id;
          await queryRunner.manager.save(savedRecepcionProducto);

          incidenciasGeneradas.push(
            this.toIncidenciaGenerada(incidenciaRotura.id, [
              lineaIncidenciaRotura,
            ])
          );

          this.logger.log(
            this.buildIncidenciaLogMessage({
              incidenciaId: incidenciaRotura.id,
              recepcionId: savedRecepcion.id,
              pedidoId: pedidoRelacionado.id,
              proveedorNombre: pedidoRelacionado.proveedor?.nombre,
              productoNombre: lineaIncidenciaRotura.nombreProducto,
              nAlbaran:
                listaPedidos.find(
                  (pedido) => pedido.pedidoId === pedidoRelacionado.id
                )?.nAlbaran || dto.nAlbaran,
              descripcion: descripcionIncidencia,
            })
          );
        }

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

          await queryRunner.manager.save(Movimiento, {
            tipo: TipoMovimiento.ENTRADA_COMPRA,
            cantidad: linea.cantidadRecibida,
            entidadId: savedRecepcion.id,
            entidad: 'Recepcion',
            inventario: { id: savedStock.id } as any,
            productoProveedor: ppRef.productoProveedor as any,
            descripcion: `Recepción Pedido ${ppRef.id} - Lote ${estadoVirtualDefault} - Albarán ${dto.nAlbaran || 'N/A'}`,
            usuario: { id: dto.usuarioId },
          });
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

      for (const p of pedidosArr) {
        const ppArr = p.pedidoProductos as unknown as PedidoProducto[];
        const lineasIncidencia = this.buildLineasIncidenciaCantidad(
          ppArr,
          detallesRecibidos
        );

        if (lineasIncidencia.length > 0) {
          recepcionEstadoEnum = EstadoRecepcion.CON_INCIDENCIAS;
          const refPedido = listaPedidos.find((lp) => lp.pedidoId === p.id);
          const savedInci = await this.crearIncidenciaConLineas(
            queryRunner.manager,
            savedRecepcion,
            p,
            refPedido?.observaciones || observacionesGlobales,
            lineasIncidencia
          );
          incidenciasGeneradas.push({
            id: savedInci.id,
            estado: 'PENDIENTE DE RESOLUCIÓN',
            datosOriginales: { productos: lineasIncidencia },
          });
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
      observacionesRecepcion,
    });

    const savedIncidencia = await manager.save(incidencia);

    if (lineas.length > 0) {
      const lineasPersistidas = lineas.map((linea) =>
        manager.create(IncidenciaLinea, {
          incidencia: savedIncidencia,
          pedidoProducto: { id: linea.idPedidoProducto } as PedidoProducto,
          cantidadEsperada: linea.cantidadPedida,
          cantidadRecibida: linea.cantidadRecibida,
          diferencia: linea.diferencia,
          tipoDiferencia: this.mapTipoDiferencia(linea.tipo),
          observaciones: linea.observaciones,
        })
      );

      await manager.save(lineasPersistidas);
    }

    return savedIncidencia;
  }

  private mapTipoDiferencia(tipo: string): TipoDiferencia {
    switch (tipo) {
      case 'EXCESO':
        return TipoDiferencia.EXCESO;
      case 'DEFECTUOSO':
        return TipoDiferencia.DEFECTUOSO;
      default:
        return TipoDiferencia.FALTANTE;
    }
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
            ? 'NO_ENTREGADO'
            : diferencia < 0
              ? 'FALTA'
              : 'EXCESO',
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
   * Documentación en español.
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
