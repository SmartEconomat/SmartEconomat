/** Clase pública (RecepcionCompletadaEvent). Paquete: smart-economat-backend (Nest). */
export class RecepcionCompletadaEvent {
  /**
   * Construye la instancia configurada.
   * @undefined {string} recepcionId - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} nAlbaran - Entrada efectiva esperada por el contrato.
   * @undefined {string[]} pedidoIds - Entrada efectiva esperada por el contrato.
   * @undefined {Date | undefined} fechaRecepcion - Entrada efectiva esperada por el contrato.
   * @undefined {string | undefined} userId - Entrada efectiva esperada por el contrato.
   */
  constructor(
    public readonly recepcionId: string,
    public readonly nAlbaran?: string,
    public readonly pedidoIds: string[] = [],
    public readonly fechaRecepcion?: Date,
    public readonly userId?: string
  ) {}
}
