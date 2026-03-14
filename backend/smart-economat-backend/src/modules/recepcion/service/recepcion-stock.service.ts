import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import {
  CreateRecepcionDto,
  RecepcionLineDto,
} from '../dto/create-recepcion.dto';
import { RecepcionResultadoDto } from '../dto/recepcion-resultado.dto';
import { AlbaranPedidoRecepcion } from '../../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity';
import { Pedido } from '../../pedido/pedido.entity/pedido.entity';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums';
import { EstadoPedido } from '../../pedido/enums/estado-pedido.enum';
import { PedidoProducto } from '../../pedido/pedido-producto.entity/pedido-producto.entity';
import { Recepcion } from '../recepcion.entity/recepcion.entity';
import { RecepcionPedido } from '../recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../recepcion-productos.entity/recepcion-producto.entity';
import { Incidencia } from '../../incidencia/incidencia.entity/incidencia.entity';
import { Albaran } from '../../albaran/albaran.entity/albaran.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';
import { EstadoRecepcion } from '../enums/estado-recepcion.enum';
import { EstadoVisualProducto } from '../enums/estado-visual.enum';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';
import {
  RecepcionMasivaLoteDto,
  RecepcionMasivaProductoDto,
} from '../dto/recepcion-masiva.dto';

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

interface PedidoActualizado {
  id: string;
  estadoAnterior: string;
  estadoNuevo: string;
}

@Injectable()
export class RecepcionStockService {
  constructor(private dataSource: DataSource) {}

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

    if (
      pedido.estado !== EstadoPedido.PENDIENTE &&
      pedido.estado !== EstadoPedido.EN_PROCESO &&
      pedido.estado !== EstadoPedido.PARCIAL
    ) {
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
      });
      const savedRecepcion = await queryRunner.manager.save(recepcion);

      let rp = queryRunner.manager.create(RecepcionPedido, {
        recepcion: savedRecepcion,
        pedido: { id: pedido.id },
      });
      rp = await queryRunner.manager.save(rp);

      if (dto.nAlbaran) {
        let albaran = await queryRunner.manager.findOne(Albaran, {
          where: { nAlbaran: dto.nAlbaran },
        });

        if (!albaran) {
          albaran = queryRunner.manager.create(Albaran, {
            nAlbaran: dto.nAlbaran,
            fecha: new Date(),
          });
          albaran = await queryRunner.manager.save(albaran);
        }

        const apr = queryRunner.manager.create(AlbaranPedidoRecepcion, {
          albaran: albaran,
          recepcionPedido: rp,
        });
        await queryRunner.manager.save(apr);
      }

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
        const ppRef = mapPedidoProductos.get(linea.pedidoProductoId);
        if (!ppRef) {
          throw new BadRequestException(
            `PedidoProducto ${linea.pedidoProductoId} no pertenece al pedido seleccionado.`
          );
        }

        const valActual = sumadoRecibidoPorPP.get(ppRef.id) || 0;
        sumadoRecibidoPorPP.set(
          ppRef.id,
          valActual + Number(linea.cantidadRecibida)
        );

        const detallesLinea = detallesRecibidos.get(ppRef.id) || [];
        detallesLinea.push(linea);
        detallesRecibidos.set(ppRef.id, detallesLinea);

        batchRecepcionProductos.push(
          queryRunner.manager.create(RecepcionProducto, {
            recepcion: savedRecepcion,
            cantidadAlbaran: linea.cantidadAlbaran || null,
            cantidadRecibida: linea.cantidadRecibida,
            observaciones: linea.observaciones,
            pedidoProducto: { id: ppRef.id },
            isWeighedWithScale: (linea as any).isWeighedWithScale || false,
          })
        );

        if (linea.cantidadRecibida > 0) {
          const defaultExpiration = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          );
          const stockNuevo = queryRunner.manager.create(Inventario, {
            productoProveedor: ppRef.productoProveedor,
            cantidadActual: linea.cantidadRecibida,
            cantidadMinima: 10,
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
      }

      const lineasIncidencia: LineaIncidencia[] = [];

      for (const pp of ppArr) {
        const cantPedida = Number(pp.cantidad);
        const lineasRecibidas = detallesRecibidos.get(pp.id) || [];

        let subCantOptima = 0;
        let subCantRotaDefectuosa = 0;

        for (const lr of lineasRecibidas) {
          if (lr.estadoVisual === EstadoVisualProducto.OPTIMO) {
            subCantOptima += Number(lr.cantidadRecibida);
          } else {
            subCantRotaDefectuosa += Number(lr.cantidadRecibida);
          }
        }

        const cantRecibidaTotal = subCantOptima + subCantRotaDefectuosa;
        const difNumerica = cantRecibidaTotal - cantPedida;

        if (difNumerica !== 0) {
          lineasIncidencia.push({
            idPedidoProducto: pp.id,
            nombreProducto:
              pp.productoProveedor?.producto?.nombre || 'Producto',
            cantidadPedida: cantPedida,
            cantidadRecibida: cantRecibidaTotal,
            diferencia: difNumerica,
            tipo:
              cantRecibidaTotal === 0
                ? 'NO_ENTREGADO'
                : difNumerica < 0
                  ? 'FALTA'
                  : 'EXCESO',
          });
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
            cantidadPedida: cantPedida,
            cantidadRecibida: subCantRotaDefectuosa,
            diferencia: -subCantRotaDefectuosa,
            tipo: 'DEFECTUOSO',
            observaciones: observacionesMermas,
          });
        }
      }

      if (lineasIncidencia.length > 0) {
        recepcionEstadoEnum = EstadoRecepcion.CON_INCIDENCIAS;
        const incidenciaRec = queryRunner.manager.create(Incidencia, {
          recepcion: savedRecepcion,
          pedido: { id: pedido.id } as Pedido,
          observacionesRecepcion:
            dto.observaciones ||
            'Generado vía Recepción Masiva con discrepancias.',
          datosOriginales: { productos: lineasIncidencia },
        });
        const savedInci = await queryRunner.manager.save(incidenciaRec);

        incidenciasGeneradas.push({
          id: savedInci.id,
          estado: 'PENDIENTE DE RESOLUCIÓN',
          datosOriginales: { productos: lineasIncidencia },
        });
      }

      savedRecepcion.estado = recepcionEstadoEnum;
      await queryRunner.manager.save(savedRecepcion);

      const estadoPasado = pedido.estado;
      const finalState = await this.actualizarEstadoPedido(
        pedido.id,
        queryRunner.manager
      );

      await queryRunner.commitTransaction();

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
      throw new BadRequestException(
        I18nHelper.getError('NO_SE_HAN_ESPECIFICADO_PEDIDOS')
      );
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
      (p) =>
        p.estado !== EstadoPedido.PENDIENTE &&
        p.estado !== EstadoPedido.EN_PROCESO &&
        p.estado !== EstadoPedido.PARCIAL
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
          const prod = queryRunner.manager.create(Producto, {
            nombre: pNew.nombre,
            marca: pNew.marca,
            unidad: pNew.unidad as any,
            tipo: pNew.tipo as any,
            codigoBarras: pNew.codigoBarras,
            contenido: pNew.contenido,
            categoria: pNew.tipo as any,
          });
          const savedProd = await queryRunner.manager.save(prod);

          const pp = queryRunner.manager.create(ProductoProveedor, {
            producto: savedProd,
            proveedor: defaultProvider as any,
            marca: pNew.marca,
            codigoBarras: pNew.codigoBarras,
          });
          const savedPP = await queryRunner.manager.save(pp);

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

      const savedRecepcionPedidos: RecepcionPedido[] = [];
      for (const pRef of listaPedidos) {
        let rp = queryRunner.manager.create(RecepcionPedido, {
          recepcion: savedRecepcion,
          pedido: { id: pRef.pedidoId },
        });
        rp = await queryRunner.manager.save(rp);
        savedRecepcionPedidos.push(rp);

        if (pRef.nAlbaran) {
          let albaran = await queryRunner.manager.findOne(Albaran, {
            where: { nAlbaran: pRef.nAlbaran },
          });

          if (!albaran) {
            albaran = queryRunner.manager.create(Albaran, {
              nAlbaran: pRef.nAlbaran,
              fecha: new Date(),
            });
            albaran = await queryRunner.manager.save(albaran);
          }

          const apr = queryRunner.manager.create(AlbaranPedidoRecepcion, {
            albaran: albaran,
            recepcionPedido: rp,
          });
          await queryRunner.manager.save(apr);
        }
      }

      const mapPedidoProductos = new Map<string, PedidoProducto>();
      for (const p of pedidosArr) {
        const ppArr = p.pedidoProductos as unknown as PedidoProducto[];
        for (const pp of ppArr) {
          mapPedidoProductos.set(pp.id, pp);
        }
      }

      const sumadoRecibidoPorPP = new Map<string, number>();
      const detallesRecibidos = new Map<string, RecepcionLineDto[]>();

      for (const linea of dto.productos) {
        const estadoVirtualDefault =
          linea.estadoVisual || EstadoVisualProducto.OPTIMO;

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
        detallesLinea.push({ ...linea, estadoVisual: estadoVirtualDefault });
        detallesRecibidos.set(ppRef.id, detallesLinea);

        const recepcionProducto = queryRunner.manager.create(
          RecepcionProducto,
          {
            recepcion: savedRecepcion,
            cantidadAlbaran: linea.cantidadAlbaran || null,
            cantidadRecibida: linea.cantidadRecibida,
            observaciones: linea.observaciones,
            pedidoProducto: { id: ppRef.id },
            isWeighedWithScale: linea.isWeighedWithScale || false,
          }
        );

        await queryRunner.manager.save(recepcionProducto);

        if (linea.cantidadRecibida > 0) {
          const defaultExpiration = new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          );
          const stockNuevo = queryRunner.manager.create(Inventario, {
            productoProveedor: ppRef.productoProveedor as any,
            cantidadActual: linea.cantidadRecibida,
            cantidadMinima: 10,
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
        }
      }

      for (const p of pedidosArr) {
        const ppArr = p.pedidoProductos as unknown as PedidoProducto[];
        const lineasIncidencia: LineaIncidencia[] = [];

        for (const pp of ppArr) {
          const lineasRecibidas = detallesRecibidos.get(pp.id) || [];
          const cantPedida = Number(pp.cantidad);

          let subCantOptima = 0;
          let subCantRotaDefectuosa = 0;

          for (const lr of lineasRecibidas) {
            if (lr.estadoVisual === EstadoVisualProducto.OPTIMO) {
              subCantOptima += Number(lr.cantidadRecibida);
            } else {
              subCantRotaDefectuosa += Number(lr.cantidadRecibida);
            }
          }

          const cantRecibidaTotal = subCantOptima + subCantRotaDefectuosa;
          const difNumerica = cantRecibidaTotal - cantPedida;

          if (difNumerica !== 0) {
            lineasIncidencia.push({
              idPedidoProducto: pp.id,
              nombreProducto:
                pp.productoProveedor?.producto?.nombre || 'Producto',
              cantidadPedida: cantPedida,
              cantidadRecibida: cantRecibidaTotal,
              diferencia: difNumerica,
              tipo:
                cantRecibidaTotal === 0
                  ? 'NO_ENTREGADO'
                  : difNumerica < 0
                    ? 'FALTA'
                    : 'EXCESO',
            });
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
              cantidadPedida: cantPedida,
              cantidadRecibida: subCantRotaDefectuosa,
              diferencia: -subCantRotaDefectuosa,
              tipo: 'DEFECTUOSO',
              observaciones: observacionesMermas,
            });
          }
        }

        if (lineasIncidencia.length > 0) {
          recepcionEstadoEnum = EstadoRecepcion.CON_INCIDENCIAS;
          const refPedido = listaPedidos.find((lp) => lp.pedidoId === p.id);
          const incidenciaRec = queryRunner.manager.create(Incidencia, {
            recepcion: savedRecepcion,
            pedido: { id: p.id } as any,
            observacionesRecepcion:
              refPedido?.observaciones || observacionesGlobales,
            datosOriginales: { productos: lineasIncidencia },
          });
          const savedInci = await queryRunner.manager.save(incidenciaRec);
          incidenciasGeneradas.push({
            id: savedInci.id,
            estado: 'PENDIENTE DE RESOLUCIÓN',
            datosOriginales: { productos: lineasIncidencia },
          });
        }
      }

      savedRecepcion.estado = recepcionEstadoEnum;
      await queryRunner.manager.save(savedRecepcion);

      const pedidosActualizadosFinal: PedidoActualizado[] = [];
      for (const p of pedidosArr) {
        const estadoPasado = p.estado;
        const finalState = await this.actualizarEstadoPedido(
          p.id,
          queryRunner.manager
        );
        pedidosActualizadosFinal.push({
          id: p.id,
          estadoAnterior: estadoPasado,
          estadoNuevo: finalState,
        });
      }

      await queryRunner.commitTransaction();

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

  private async actualizarEstadoPedido(
    pedidoId: string,
    manager: EntityManager
  ): Promise<string> {
    const pedido = await manager.findOne(Pedido, {
      where: { id: pedidoId },
      relations: ['pedidoProductos'],
    });

    if (!pedido) return EstadoPedido.EN_PROCESO;

    const recepcionPedidos = await manager.find(RecepcionPedido, {
      where: { pedido: { id: pedido.id } },
      relations: [
        'recepcion',
        'recepcion.recepcionProductos',
        'recepcion.recepcionProductos.pedidoProducto',
      ],
    });

    const pedidoProductosList =
      pedido.pedidoProductos as unknown as PedidoProducto[];
    const orderProductIds = new Set(pedidoProductosList.map((pp) => pp.id));

    let totalRecibido = 0;
    const mapRecvd = new Map<string, number>();

    for (const repPedido of recepcionPedidos) {
      if (!repPedido.recepcion || !repPedido.recepcion.recepcionProductos)
        continue;

      for (const repProd of repPedido.recepcion.recepcionProductos) {
        if (
          repProd.pedidoProducto &&
          orderProductIds.has(repProd.pedidoProducto.id)
        ) {
          totalRecibido += Number(repProd.cantidadRecibida);
          const curr = mapRecvd.get(repProd.pedidoProducto.id) || 0;
          mapRecvd.set(
            repProd.pedidoProducto.id,
            curr + Number(repProd.cantidadRecibida)
          );
        }
      }
    }

    let isFull = true;
    let isIncidencia = false;

    for (const pp of pedidoProductosList) {
      const cantReq = Number(pp.cantidad);
      const cantRecv = mapRecvd.get(pp.id) || 0;

      if (cantRecv !== cantReq) {
        isFull = false;
        if (cantRecv === 0 || cantRecv > cantReq) {
          isIncidencia = true;
        }
      }
    }

    if (isFull) {
      (pedido as any).estado = EstadoPedido.RECIBIDO;
    } else {
      if (isIncidencia) {
        (pedido as any).estado = EstadoPedido.INCIDENCIA;
      } else if (totalRecibido > 0) {
        (pedido as any).estado = EstadoPedido.PARCIAL;
      } else {
        (pedido as any).estado = EstadoPedido.EN_PROCESO;
      }
    }

    await manager.save(Pedido, pedido);
    return pedido.estado;
  }
}
