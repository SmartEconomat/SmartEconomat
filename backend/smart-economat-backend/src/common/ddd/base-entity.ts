/** Clase pública (DomainEntity). Paquete: smart-economat-backend (Nest). */
export abstract class DomainEntity<ID = string> {
  readonly id: ID;

  /**
   * Construye la instancia configurada.
   * @undefined {ID} id - Entrada efectiva esperada por el contrato.
   */
  protected constructor(id: ID) {
    this.id = id;
  }
}
