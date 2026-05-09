/** Contrato de tipos público (JwtPayload). Contexto: smart-economat-backend (Nest). */
export interface JwtPayload {
  sub: string;
  username: string;
  /**
   * Ejecuta la lógica de operación dentro del flujo de la aplicación.
   */
  role: string;
}
