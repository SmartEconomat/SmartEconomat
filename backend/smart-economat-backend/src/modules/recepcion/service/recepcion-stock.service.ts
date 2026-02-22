import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto';
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
import { Albaran } from '../../albaran/albaran.entity/albaran.entity';
import { localInventario } from '../../inventario/enums/inventario.enums';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class RecepcionStockService {
  constructor(private dataSource: DataSource) {}

  async procesarRecepcion(dto: CreateRecepcionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const recepcion = queryRunner.manager.create(Recepcion, {
        usuario: { id: dto.usuarioId },
      });
      const savedRecepcion = await queryRunner.manager.save(recepcion);

      const recepcionPedido = queryRunner.manager.create(RecepcionPedido, {
        recepcion: savedRecepcion,
        pedido: { id: dto.pedidoId },
      });
      const savedRecepcionPedido =
        await queryRunner.manager.save(recepcionPedido);

      let savedAlbaran: Albaran | null = null;

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
        savedAlbaran = albaran;

        const apr = queryRunner.manager.create(AlbaranPedidoRecepcion, {
          albaran: savedAlbaran,
          recepcionPedido: savedRecepcionPedido,
        });
        await queryRunner.manager.save(apr);
        await queryRunner.manager.save(recepcionPedido);
      }

      for (const linea of dto.lineas) {
        const pedidoProducto = await queryRunner.manager.findOne(
          PedidoProducto,
          {
            where: { id: linea.pedidoProductoId },
            relations: ['productoProveedor'],
          }
        );

        if (!pedidoProducto) {
          throw new Error(`PedidoProducto ${linea.pedidoProductoId} not found`);
        }

        const recepcionProducto = queryRunner.manager.create(
          RecepcionProducto,
          {
            recepcion: savedRecepcion,
            pedidoProducto: { id: linea.pedidoProductoId },
            cantidadRecibida: linea.cantidadRecibida,
            observaciones: linea.observaciones,
          }
        );
        await queryRunner.manager.save(recepcionProducto);

        let stock = await queryRunner.manager.findOne(Inventario, {
          where: {
            productoProveedor: {
              id: (pedidoProducto.productoProveedor as any).id,
            },
          },
        });

        if (stock) {
          stock.cantidadActual += linea.cantidadRecibida;
        } else {
          stock = queryRunner.manager.create(Inventario, {
            productoProveedor: pedidoProducto.productoProveedor,
            cantidadActual: linea.cantidadRecibida,
            cantidadMinima: 10,
            ubicacionAlmacen: localInventario.ALMACEN_A,
            fechaCaducidad: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          });
        }
        stock = await queryRunner.manager.save(stock);

        await queryRunner.manager.save(Movimiento, {
          tipo: TipoMovimiento.ENTRADA_COMPRA,
          cantidad: linea.cantidadRecibida,
          inventario: { id: stock.id } as any,
          descripcion: `Recepción Pedido ${dto.pedidoId} - Albarán ${dto.nAlbaran || 'N/A'}`,
          usuario: { id: dto.usuarioId },
        });
      }

      await this.actualizarEstadoPedido(
        dto.pedidoId.toString(),
        queryRunner.manager
      );

      await queryRunner.commitTransaction();

      return savedRecepcion;
    } catch (error) {
      await queryRunner.rollbackTransaction();
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
  ) {
    const pedido = await manager.findOne(Pedido, {
      where: { id: pedidoId },
      relations: ['pedidoProductos'],
    });

    if (!pedido) return;

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
    for (const repPedido of recepcionPedidos) {
      if (!repPedido.recepcion || !repPedido.recepcion.recepcionProductos)
        continue;

      for (const repProd of repPedido.recepcion.recepcionProductos) {
        if (
          repProd.pedidoProducto &&
          orderProductIds.has(repProd.pedidoProducto.id)
        ) {
          totalRecibido += repProd.cantidadRecibida;
        }
      }
    }

    let totalSolicitado = 0;
    for (const pp of pedidoProductosList) {
      totalSolicitado += Number(pp.cantidad);
    }

    if (totalRecibido >= totalSolicitado) {
      (pedido as any).estado = EstadoPedido.RECIBIDO;
    } else if (totalRecibido > 0) {
      (pedido as any).estado = EstadoPedido.PARCIAL;
    }

    await manager.save(Pedido, pedido);
  }
}
