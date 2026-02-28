import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager, In } from 'typeorm';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
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
import { localInventario } from '../../inventario/enums/inventario.enums';
import { EstadoRecepcion } from '../enums/estado-recepcion.enum';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Producto } from '../../producto/producto.entity/producto.entity';
import { ProductoProveedor } from '../../producto/producto-proveedor.entity/producto-proveedor.entity';

@Injectable()
export class RecepcionStockService {
  constructor(private dataSource: DataSource) {}

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
      throw new BadRequestException('No se han especificado pedidos.');
    }

    const pedidosArr = await this.dataSource.manager.find(Pedido, {
      where: { id: In(pedidoIdsList) },
      relations: [
        'pedidoProductos',
        'pedidoProductos.productoProveedor',
        'pedidoProductos.productoProveedor.producto',
        'proveedor',
      ],
    });

    if (pedidosArr.length !== pedidoIdsList.length) {
      throw new NotFoundException(I18nHelper.getError('ORDER_NOT_FOUND'));
    }

    const pedidosInvalidos = pedidosArr.filter(
      (p) =>
        p.estado !== EstadoPedido.PENDIENTE &&
        p.estado !== EstadoPedido.EN_PROCESO &&
        p.estado !== EstadoPedido.PARCIAL
    );
    if (pedidosInvalidos.length > 0) {
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
      const incidenciasGeneradas: any[] = [];
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
              ubicacionAlmacen: localInventario.ALMACEN_A,
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

      for (const linea of dto.productos) {
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

        const recepcionProducto = queryRunner.manager.create(
          RecepcionProducto,
          {
            recepcion: savedRecepcion,
            cantidadRecibida: linea.cantidadRecibida,
            observaciones: linea.observaciones,
            pedidoProducto: { id: ppRef.id },
          }
        );

        await queryRunner.manager.save(recepcionProducto);

        if (linea.cantidadRecibida > 0) {
          const stockNuevo = queryRunner.manager.create(Inventario, {
            productoProveedor: ppRef.productoProveedor as any,
            cantidadActual: linea.cantidadRecibida,
            cantidadMinima: 10,
            fechaEntrada: new Date(),
            ubicacionAlmacen: localInventario.ALMACEN_A,
            fechaCaducidad: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          });

          const savedStock = await queryRunner.manager.save(stockNuevo);
          inventariosCreados++;

          await queryRunner.manager.save(Movimiento, {
            tipo: TipoMovimiento.ENTRADA_COMPRA,
            cantidad: linea.cantidadRecibida,
            entidadId: savedRecepcion.id,
            entidad: 'Recepcion',
            inventario: { id: savedStock.id } as any,
            descripcion: `Recepción Pedido ${ppRef.id} - Albarán ${dto.nAlbaran || 'N/A'}`,
            usuario: { id: dto.usuarioId },
          });
          movimientosGenerados++;
        }
      }

      for (const p of pedidosArr) {
        const ppArr = p.pedidoProductos as unknown as PedidoProducto[];
        const lineasIncidencia: any[] = [];

        for (const pp of ppArr) {
          const cantRecibida = sumadoRecibidoPorPP.get(pp.id) || 0;
          const cantPedida = Number(pp.cantidad);
          const dif = cantRecibida - cantPedida;

          if (dif !== 0) {
            lineasIncidencia.push({
              idPedidoProducto: pp.id,
              nombreProducto:
                pp.productoProveedor?.producto?.nombre || 'Producto',
              cantidadPedida: cantPedida,
              cantidadRecibida: cantRecibida,
              diferencia: dif,
              tipo:
                cantRecibida === 0
                  ? 'NO_ENTREGADO'
                  : dif < 0
                    ? 'FALTA'
                    : 'EXCESO',
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

      const pedidosActualizadosFinal: any[] = [];
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
