/** Contrato de tipos público (RepositoryInterface). Contexto: smart-economat-backend (Nest). */
export interface RepositoryInterface<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  save(entity: T): Promise<T>;
  delete(id: ID): Promise<void>;
}
