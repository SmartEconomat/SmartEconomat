/** Clase pública (UseCase). Paquete: smart-economat-backend (Nest). */
export abstract class UseCase<Input = unknown, Output = unknown> {
  /**
   * Expone "execute" en smart-economat-backend (Nest).
   * @undefined {Input} input - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<Output>} Datos efectivos después de ejecutar la operación.
   */
  abstract execute(input: Input): Promise<Output>;
}
