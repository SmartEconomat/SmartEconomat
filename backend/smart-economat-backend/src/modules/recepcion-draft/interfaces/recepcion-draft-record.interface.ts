/** Contrato de tipos público (RecepcionDraftRecord). Contexto: smart-economat-backend (Nest). */
export interface RecepcionDraftRecord {
  id?: string;
  userId: string;
  version: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  expiresAt: string | null;
  source: 'redis' | 'database';
}
