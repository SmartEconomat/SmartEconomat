import { Injectable, BadRequestException } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CreateRecepcionDto } from '../dto/create-recepcion.dto.js';
import { AlbaranPedidoRecepcion } from '../../albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity.js';
import { Inventario } from '../../inventario/inventario.entity/inventario.entity.js';
import { Movimiento } from '../../movimiento/movimiento.entity/movimiento.entity.js';
import { Pedido } from '../../pedidos/pedido.entity/pedido.entity.js';
import { TipoMovimiento } from '../../movimiento/enums/movimiento.enums.js';
import { EstadoPedido } from '../../pedidos/enums/estado-pedido.enum.js';
import { PedidoProducto } from '../../pedidos/pedido-producto.entity/pedido-producto.entity.js';
import { Recepcion } from '../../recepcion/recepcion.entity/recepcion.entity.js';
import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity.js';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity.js';
import { Albaran } from '../../albaran/albaran.entity/albaran.entity.js';
import { localInventario } from '../../inventario/enums/inventario.enums.js';

@Injectable()
export class RecepcionStockService {
  constructor(private dataSource: DataSource) {}

  async procesarRecepcion(dto: CreateRecepcionDto) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const recepcion = queryRunner.manager.create(Recepcion, {
        usuario: { id: '550e8400-e29b-41d4-a716-446655440001' },
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
            productoProveedor: { id: pedidoProducto.productoProveedor.id },
          },
        });

        if (stock) {
          stock.cantidad_actual += linea.cantidadRecibida;
        } else {
          stock = queryRunner.manager.create(Inventario, {
            productoProveedor: { id: pedidoProducto.productoProveedor.id },
            cantidad_actual: linea.cantidadRecibida,
            cantidad_minima: 10,
            ubicacion_almacen: localInventario.ALMACEN_A,
            fecha_caducidad: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          });
        }
        stock = await queryRunner.manager.save(stock);

        await queryRunner.manager.save(Movimiento, {
          tipo: TipoMovimiento.ENTRADA_COMPRA,
          cantidad: linea.cantidadRecibida,
          inventario: stock.id,
          descripcion: `Recepción Pedido ${dto.pedidoId} - Albarán ${dto.nAlbaran || 'N/A'}`,
          usuario: { id: '550e8400-e29b-41d4-a716-446655440001' },
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
      throw new BadRequestException('Fallo en la recepción: ' + error.message);
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
        'recepcion.recepcionesProducto',
        'recepcion.recepcionesProducto.pedidoProducto',
      ],
    });

    const orderProductIds = new Set(pedido.pedidoProductos.map((pp) => pp.id));

    let totalRecibido = 0;
    for (const repPedido of recepcionPedidos) {
      if (!repPedido.recepcion || !repPedido.recepcion.recepcionesProducto)
        continue;

      for (const repProd of repPedido.recepcion.recepcionesProducto) {
        if (
          repProd.pedidoProducto &&
          orderProductIds.has(repProd.pedidoProducto.id)
        ) {
          totalRecibido += repProd.cantidadRecibida;
        }
      }
    }

    let totalSolicitado = 0;
    for (const pp of pedido.pedidoProductos) {
      totalSolicitado += Number(pp.cantidad);
    }

    if (totalRecibido >= totalSolicitado) {
      pedido.estado = EstadoPedido.RECIBIDO;
    } else if (totalRecibido > 0) {
      pedido.estado = EstadoPedido.PARCIAL;
    }

    await manager.save(Pedido, pedido);
  }
}
