import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DataSource } from 'typeorm';
import { RecetaService } from '../service/receta.service';
import { RecepcionCompletadaEvent } from '../../recepcion/events/recepcion-completada.event';
import { RecepcionProducto } from '../../recepcion/recepcion-productos.entity/recepcion-producto.entity';
import { ProductoPrecioActualizadoEvent } from '../../producto/events/producto-precio-actualizado.event';
import { RecetaIngrediente } from '../receta-ingrediente.entity/receta-ingrediente.entity';

/** Clase pública (RecetaRecepcionListener). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class RecetaRecepcionListener {
  private readonly logger = new Logger(RecetaRecepcionListener.name);

  /**
   * Construye la instancia configurada.
   * @undefined {RecetaService} recetaService - Entrada efectiva esperada por el contrato.
   * @undefined {DataSource} dataSource - Entrada efectiva esperada por el contrato.
   */
  constructor(
    private readonly recetaService: RecetaService,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Enruta o procesa una petición o evento de dominio.
   * @undefined {RecepcionCompletadaEvent} event - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @OnEvent('recepcion.completada')
  async handleRecepcionCompletada(event: RecepcionCompletadaEvent) {
    this.logger.log(`Recalculando recetas tras recepción ${event.recepcionId}`);

    try {
      const recepcionProductos = await this.dataSource
        .getRepository(RecepcionProducto)
        .find({
          where: { recepcionId: event.recepcionId },
          relations: ['pedidoProducto', 'pedidoProducto.productoProveedor'],
        });

      const productoIds = [
        ...new Set(
          recepcionProductos
            .map((rp) => rp.pedidoProducto?.productoProveedor?.productoId)
            .filter(Boolean)
        ),
      ];

      if (productoIds.length === 0) {
        return;
      }

      const ingredientes = await this.dataSource
        .getRepository(RecetaIngrediente)
        .createQueryBuilder('ri')
        .select('DISTINCT ri.receta_id', 'recetaId')
        .where('ri.producto_id IN (:...productoIds)', { productoIds })
        .getRawMany<{ recetaId: string }>();

      const recetaIds = ingredientes.map((i) => i.recetaId);

      if (recetaIds.length === 0) {
        return;
      }

      this.logger.log(
        `Iniciando recálculo para ${recetaIds.length} recetas afectadas`
      );

      for (const id of recetaIds) {
        try {
          await this.recetaService.recalcularCostes(id);
        } catch (err) {
          this.logger.error(
            `Error recalcuando receta ${id}: ${(err as Error).message}`
          );
        }
      }

      this.logger.log(
        `Recálculo completado para las recetas afectadas por la recepción ${event.recepcionId}`
      );
    } catch (error) {
      this.logger.error(
        `Error procesando recálculo tras recepción: ${(error as Error).message}`
      );
    }
  }

  /**
   * Enruta o procesa una petición o evento de dominio.
   * @undefined {ProductoPrecioActualizadoEvent} event - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @OnEvent('producto.precio.actualizado')
  async handleProductoPrecioActualizado(event: ProductoPrecioActualizadoEvent) {
    this.logger.log(
      `Recalculando recetas tras cambio de precio manual para producto ${event.productoId}`
    );

    try {
      const ingredientes = await this.dataSource
        .getRepository(RecetaIngrediente)
        .createQueryBuilder('ri')
        .select('DISTINCT ri.receta_id', 'recetaId')
        .where('ri.producto_id = :productoId', { productoId: event.productoId })
        .getRawMany<{ recetaId: string }>();

      const recetaIds = ingredientes.map((i) => i.recetaId);

      if (recetaIds.length === 0) return;

      for (const id of recetaIds) {
        try {
          await this.recetaService.recalcularCostes(id);
        } catch (err) {
          this.logger.error(
            `Error recalcuando receta ${id}: ${(err as Error).message}`
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Error procesando recálculo tras cambio de precio manual: ${(error as Error).message}`
      );
    }
  }
}
