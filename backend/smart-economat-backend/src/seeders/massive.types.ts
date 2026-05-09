/** Alias público (HttpMethod) para simplificar payloads o props en smart-economat-backend (Nest). */
export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

/** Contrato de tipos público (Endpoint). Contexto: smart-economat-backend (Nest). */
export interface Endpoint {
  method: HttpMethod;
  path: string;
  source: string;
}

/** Alias público (RequestResult) para simplificar payloads o props en smart-economat-backend (Nest). */
export type RequestResult = {
  ok: boolean;
  countAsSuccess?: boolean;
  key: string;
  endpoint: Endpoint;
  resolvedPath: string;
  payload?: unknown;
  response?: unknown;
  statusCode?: number;
  resourceId?: string;
  error?: string;
};

/** Alias público (EnumCoverage) para simplificar payloads o props en smart-economat-backend (Nest). */
export type EnumCoverage = Record<string, Set<string>>;
