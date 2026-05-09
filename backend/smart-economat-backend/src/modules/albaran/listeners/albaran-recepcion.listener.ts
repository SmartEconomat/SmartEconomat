import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AlbaranService } from '../service/albaran.service';
import { RecepcionCompletadaEvent } from '../../recepcion/events/recepcion-completada.event';
import { DataSource } from 'typeorm';
import { AlbaranPedidoRecepcion } from '../albaran-pedido-recepcion.entity/albaran-pedido-recepcion.entity';
import { RecepcionPedido } from '../../recepcion/recepcion-pedido.entity/recepcion-pedido.entity';

/** Clase pública (AlbaranRecepcionListener). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class AlbaranRecepcionListener {
  private readonly logger = new Logger(AlbaranRecepcionListener.name);

  /**
   * Construye la instancia configurada.
   * @undefined {AlbaranService} albaranService - Entrada efectiva esperada por el contrato.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly albaranService: AlbaranService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Enruta o procesa una petición o evento de dominio.
   * @undefined {RecepcionCompletadaEvent} event - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @OnEvent('recepcion.completada')
  async handleRecepcionCompletada(event: RecepcionCompletadaEvent) {
    this.logger.log(`Procesando albarán para recepción ${event.recepcionId}`);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const albaran = await this.albaranService.createOrGetAlbaran({
        numeroReferencia: event.nAlbaran,
        fecha: event.fechaRecepcion,
        manager: queryRunner.manager,
      });

      const recepcionesPedidos = await queryRunner.manager.find(
        RecepcionPedido,
        {
          where: { recepcionId: event.recepcionId },
        }
      );

      for (const rp of recepcionesPedidos) {
        const existingLink = await queryRunner.manager.findOne(
          AlbaranPedidoRecepcion,
          {
            where: {
              albaranId: albaran.id,
              recepcionPedidoId: rp.id,
            },
          }
        );

        if (!existingLink) {
          const apr = queryRunner.manager.create(AlbaranPedidoRecepcion, {
            albaran: albaran,
            recepcionPedido: rp,
          });
          await queryRunner.manager.save(apr);
        }
      }

      await this.albaranService.syncConcordanciaFromRecepciones(
        albaran.id,
        queryRunner.manager
      );

      await queryRunner.commitTransaction();
      this.logger.log(
        `Albarán ${albaran.nAlbaran} vinculado a recepción ${event.recepcionId}`
      );
    } catch (error: any) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error(
        `Error procesando albarán para recepción ${event.recepcionId}: ${error.message}`
      );
    } finally {
      await queryRunner.release();
    }
  }
}
