/** Contrato de tipos público (PedidoDraftRecord). Contexto: smart-economat-backend (Nest). */
export interface PedidoDraftRecord {
  id?: string;
  userId: string;
  version: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  source: 'redis' | 'database';
}
