import {
  TipoMovimiento,
  AccionMovimiento,
} from '../../modules/movimiento/enums/movimiento.enums';

/**
 * Evento que representa una acción auditable en el sistema.
 * Se emite cuando se detecta un cambio relevante que debe quedar registrado en el historial de movimientos.
 */
export class AuditEvent {
  /**
   * Crea una instancia de AuditEvent.
   * @param userId ID del usuario que realizó la acción.
   * @param entidad Nombre de la entidad afectada (ej: 'Producto', 'Pedido').
   * @param entidadId UUID de la instancia específica de la entidad.
   * @param accion Acción realizada (CREATE, UPDATE, etc.).
   * @param descripcion Detalle textual de lo que ocurrió.
   * @param before Estado previo de los datos.
   * @param after Estado posterior de los datos.
   * @param tipo Categoría del movimiento de stock (opcional).
   */
  constructor(
    public readonly userId: string,
    public readonly tipo: TipoMovimiento,
    public readonly entidad: string,
    public readonly entidadId: string,
    public readonly descripcion?: string,
    public readonly accion?: AccionMovimiento,
    public readonly before?: any,
    public readonly after?: any
  ) {}
}
