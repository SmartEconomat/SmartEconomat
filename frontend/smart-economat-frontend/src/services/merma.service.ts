import {
  baseFetch,
  ApiResponse,
  buildQueryParams,
  PaginatedData,
} from './api.service';
import {
  Merma,
  CreateMermaPayload,
  CreateMermaProduccionPayload,
  MermaStats,
  MermasQueryParams,
} from './merma.types';

/**
 * Construye la cadena de query string a partir de los filtros de mermas.
 */
function buildMermasQueryString(params?: MermasQueryParams): string {
  const search = buildQueryParams(
    {
      page: params?.page,
      limit: params?.limit,
      sortBy: params?.sortBy,
      order: params?.order,
      motivo: params?.motivo,
      startDate: params?.startDate,
      endDate: params?.endDate,
    },
    20,
    50
  );

  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Recupera una lista paginada de registros de merma.
 */
/**
 * Expone "fetchMermas" en smart-economat-frontend (SPA).
 * @undefined {MermasQueryParams | undefined} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PaginatedData<Merma>>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchMermas(
  params?: MermasQueryParams
): Promise<PaginatedData<Merma>> {
  const query = buildMermasQueryString(params);
  const response = await baseFetch(`/merma${query}`);
  if (!response.ok) {
    throw new Error(`Error al obtener mermas: ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Merma>>;

  if (Array.isArray(body.data)) {
    return {
      data: body.data,
      total: body.data.length,
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
      totalPages: 1,
    };
  }

  return body.data || { data: [], total: 0, page: 1, limit: 10, totalPages: 1 };
}

/**
 * Registra una nueva pérdida o merma de stock manual.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreateMermaPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Merma>} Datos efectivos después de ejecutar la operación.
 */
export async function createMerma(payload: CreateMermaPayload): Promise<Merma> {
  const response = await baseFetch('/merma', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al registrar merma: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Merma>;
  return body.data;
}

/**
 * Registra una merma derivada de un proceso de producción en cocina.
 */
/**
 * Crea recursos nuevos en base a las reglas de negocio.
 * @undefined {CreateMermaProduccionPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Merma>} Datos efectivos después de ejecutar la operación.
 */
export async function createMermaProduccion(
  payload: CreateMermaProduccionPayload
): Promise<Merma> {
  const response = await baseFetch('/merma/produccion/reportar', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ||
        `Error al registrar merma desde produccion: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<Merma>;
  return body.data;
}

/**
 * Obtiene las estadísticas agregadas de mermas (totales, por motivo, etc.).
 */
/**
 * Expone "fetchMermaStats" en smart-economat-frontend (SPA).
 * @undefined {Promise<MermaStats>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchMermaStats(): Promise<MermaStats> {
  const response = await baseFetch('/merma/stats');
  if (!response.ok) {
    throw new Error(
      `Error al obtener estadísticas de merma: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<MermaStats>;
  return body.data;
}
