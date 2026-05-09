import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AuditEvent } from '../../../common/events/audit.event';
import { MovimientoHelper } from '../../../common/helpers/movimiento.helper';

/** Clase pública (AuditListener). Paquete: smart-economat-backend (Nest). */
@Injectable()
export class AuditListener {
  private readonly logger = new Logger(AuditListener.name);

  /**
   * Construye la instancia configurada.
   * @undefined {MovimientoHelper} movimientoHelper - Entrada efectiva esperada por el contrato.
   */
  constructor(private readonly movimientoHelper: MovimientoHelper) {}

  /**
   * Enruta o procesa una petición o evento de dominio.
   * @undefined {AuditEvent} event - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
   */
  @OnEvent('audit.log', { async: true })
  async handleAuditLogEvent(event: AuditEvent) {
    try {
      await this.movimientoHelper.createMovimiento(
        event.userId,
        event.tipo,
        event.entidad,
        event.entidadId,
        0,
        undefined,
        undefined,
        event.descripcion,
        event.accion,
        event.before,
        event.after
      );
    } catch (error) {
      this.logger.error(
        `Error saving audit log for ${event.entidad} ${event.entidadId}`,
        error
      );
    }
  }
}
