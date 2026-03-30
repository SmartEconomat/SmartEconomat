export type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface Endpoint {
  method: HttpMethod;
  path: string;
  source: string;
}

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

export type EnumCoverage = Record<string, Set<string>>;
