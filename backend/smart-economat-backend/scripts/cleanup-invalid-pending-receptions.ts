import { In } from 'typeorm';
import AppDataSource from '../src/config/typeorm.config';
import { Pedido } from '../src/modules/pedido/pedido.entity/pedido.entity';
import { RecepcionPedido } from '../src/modules/recepcion/recepcion-pedido.entity/recepcion-pedido.entity';
import { RecepcionProducto } from '../src/modules/recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { AlbaranPedidoRecepcion } from '../src/modules/albaran/albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { Recepcion } from '../src/modules/recepcion/recepcion.entity/recepcion.entity';
import { Albaran } from '../src/modules/albaran/albaran.entity/albaran.entity';
import { PedidoProducto } from '../src/modules/pedido/pedido-producto.entity/pedido-producto.entity';
import {
  findInvalidReceptionLinks,
  INVALID_RECEPTION_ORDER_STATES,
} from '../src/seeders/utils/reception-consistency.util';

type CleanupSummary = {
  pedidosAfectados: number;
  recepcionesPedidoEliminadas: number;
  recepcionesProductoEliminadas: number;
  albaranLinksEliminados: number;
  recepcionesHuerfanasEliminadas: number;
  albaranesHuerfanosEliminados: number;
};

async function main() {
  const applyChanges = process.argv.includes('--apply');

  await AppDataSource.initialize();
  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const invalidLinks = await findInvalidReceptionLinks(queryRunner.manager);

    const recepcionPedidoIds = invalidLinks.map(
      (item) => item.recepcionPedidoId
    );
    const recepcionIds = Array.from(
      new Set(invalidLinks.map((item) => item.recepcionId))
    );

    const affectedPedidoIds = Array.from(
      new Set(invalidLinks.map((item) => item.pedidoId))
    );

    if (affectedPedidoIds.length === 0) {
      console.log(
        `No se han encontrado pedidos en estados ${INVALID_RECEPTION_ORDER_STATES.join(', ')} con recepciones inválidas.`
      );
      await queryRunner.rollbackTransaction();
      return;
    }

    const pendingPedidoProductos = await queryRunner.manager.find(
      PedidoProducto,
      {
        where: { pedido: { id: In(affectedPedidoIds) } },
        select: ['id'],
        relations: ['pedido'],
      }
    );

    const pedidoProductoIds = pendingPedidoProductos.map((item) => item.id);

    const recepcionProductos = pedidoProductoIds.length
      ? await queryRunner.manager.find(RecepcionProducto, {
          where: { pedidoProductoId: In(pedidoProductoIds) },
          select: ['id', 'recepcionId'],
        })
      : [];

    const recepcionProductoIds = recepcionProductos.map((item) => item.id);

    const albaranLinks = recepcionPedidoIds.length
      ? await queryRunner.manager.find(AlbaranPedidoRecepcion, {
          where: { recepcionPedidoId: In(recepcionPedidoIds) },
          select: ['id', 'albaranId'],
        })
      : [];

    const albaranLinkIds = albaranLinks.map((item) => item.id);
    const albaranIds = Array.from(
      new Set(albaranLinks.map((item) => item.albaranId))
    );

    const summary: CleanupSummary = {
      pedidosAfectados: affectedPedidoIds.length,
      recepcionesPedidoEliminadas: recepcionPedidoIds.length,
      recepcionesProductoEliminadas: recepcionProductoIds.length,
      albaranLinksEliminados: albaranLinkIds.length,
      recepcionesHuerfanasEliminadas: 0,
      albaranesHuerfanosEliminados: 0,
    };

    console.log('Pedidos contaminados detectados:', invalidLinks);
    console.log('Resumen previsto:', summary);

    if (!applyChanges) {
      console.log(
        'Modo informe. Ejecuta con --apply para aplicar los cambios.'
      );
      await queryRunner.rollbackTransaction();
      return;
    }

    if (albaranLinkIds.length > 0) {
      await queryRunner.manager.delete(AlbaranPedidoRecepcion, {
        id: In(albaranLinkIds),
      });
    }

    if (recepcionProductoIds.length > 0) {
      await queryRunner.manager.delete(RecepcionProducto, {
        id: In(recepcionProductoIds),
      });
    }

    if (recepcionPedidoIds.length > 0) {
      await queryRunner.manager.delete(RecepcionPedido, {
        id: In(recepcionPedidoIds),
      });
    }

    if (recepcionIds.length > 0) {
      const remainingRecepcionLinks = await queryRunner.manager.count(
        RecepcionPedido,
        {
          where: { recepcionId: In(recepcionIds) },
        }
      );
      const remainingRecepcionProducts = await queryRunner.manager.count(
        RecepcionProducto,
        {
          where: { recepcionId: In(recepcionIds) },
        }
      );

      if (remainingRecepcionLinks === 0 && remainingRecepcionProducts === 0) {
        await queryRunner.manager.delete(Recepcion, { id: In(recepcionIds) });
        summary.recepcionesHuerfanasEliminadas = recepcionIds.length;
      } else {
        const orphanRecepciones = await queryRunner.manager
          .getRepository(Recepcion)
          .createQueryBuilder('recepcion')
          .leftJoin('recepcion.recepcionesPedidos', 'rp')
          .leftJoin('recepcion.recepcionProductos', 'rprod')
          .where('recepcion.id IN (:...recepcionIds)', { recepcionIds })
          .groupBy('recepcion.id')
          .having('COUNT(DISTINCT rp.id) = 0')
          .andHaving('COUNT(DISTINCT rprod.id) = 0')
          .getMany();

        if (orphanRecepciones.length > 0) {
          await queryRunner.manager.delete(Recepcion, {
            id: In(orphanRecepciones.map((item) => item.id)),
          });
          summary.recepcionesHuerfanasEliminadas = orphanRecepciones.length;
        }
      }
    }

    if (albaranIds.length > 0) {
      const orphanAlbaranes = await queryRunner.manager
        .getRepository(Albaran)
        .createQueryBuilder('albaran')
        .leftJoin('albaran.albaranPedidoRecepcion', 'apr')
        .where('albaran.id IN (:...albaranIds)', { albaranIds })
        .groupBy('albaran.id')
        .having('COUNT(apr.id) = 0')
        .getMany();

      if (orphanAlbaranes.length > 0) {
        await queryRunner.manager.delete(Albaran, {
          id: In(orphanAlbaranes.map((item) => item.id)),
        });
        summary.albaranesHuerfanosEliminados = orphanAlbaranes.length;
      }
    }

    await queryRunner.commitTransaction();
    console.log('Limpieza aplicada correctamente:', summary);
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error durante la limpieza de recepciones inválidas:', error);
    process.exitCode = 1;
  } finally {
    await queryRunner.release();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

void main();
