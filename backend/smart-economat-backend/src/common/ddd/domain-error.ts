/** Clase pública (DomainError). Paquete: smart-economat-backend (Nest). */
export class DomainError extends Error {
  /**
   * Construye la instancia configurada.
   * @undefined {string} message - Entrada efectiva esperada por el contrato.
   */
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}
