import {
  EstadoIncidencia,
  EstadoLineaIncidencia,
  EstadoReclamacion,
  Incidencia,
  IncidenciaLinea,
  IncidenciasQueryParams,
  ResolveIncidenciaPayload,
  TipoDiferencia,
} from './incidencia.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';
import { normalizeLimitParam, normalizePageParam } from './api.utils';

/**
 * Interfaz para datos crudos de proveedor desde la API.
 */
interface RawProveedor {
  id?: string | null;
  nombre?: string | null;
}

/**
 * Interfaz para datos crudos de producto desde la API.
 */
interface RawProducto {
  id?: string;
  nombre?: string | null;
  unidad?: string | null;
}

/**
 * Interfaz para datos crudos de relación producto-proveedor desde la API.
 */
interface RawProductoProveedor {
  producto?: RawProducto | null;
  proveedor?: RawProveedor | null;
}

/**
 * Interfaz para datos crudos de pedido-producto desde la API.
 */
interface RawPedidoProducto {
  id?: string;
  productoProveedor?: RawProductoProveedor | null;
}

/**
 * Interfaz para datos crudos de línea de incidencia desde la API.
 */
interface RawIncidenciaLinea {
  id?: string;
  pedidoProductoId?: string;
  nombreProducto?: string;
  cantidadPedida?: number | string;
  cantidadRecibida?: number | string;
  cantidadAjustada?: number | string;
  diferencia?: number | string;
  tipoDiferencia?: string;
  estado?: string;
  necesitaAjuste?: boolean;
  estadoReclamacion?: string;
  observaciones?: string;
  pedidoProducto?: RawPedidoProducto | null;
}

/**
 * Interfaz para datos crudos de pedido desde la API.
 */
interface RawPedido {
  id?: string;
  motivoIncidencia?: string | null;
  proveedor?: RawProveedor | null;
}

/**
 * Interfaz para datos crudos de incidencia principal desde la API.
 */
interface RawIncidencia {
  id?: string;
  recepcionId?: string;
  pedidoId?: string | null;
  estado?: string;
  proveedorNombre?: string;
  observacionesRecepcion?: string;
  observacionesResolucion?: string;
  resuelta?: boolean;
  fechaResolucion?: string | Date | null;
  lineas?: RawIncidenciaLinea[];
  pedido?: RawPedido | null;
  createdAt?: string;
}

/**
 * Convierte un valor desconocido a un número finito de forma segura.
 */
function toFiniteNumber(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

/**
 * Normaliza una cadena de texto, devolviendo undefined si está vacía.
 */
function toOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Clasifica el tipo de discrepancia detectada en una línea.
 */
function normalizeTipoDiferencia(value: unknown): TipoDiferencia {
  if (value === TipoDiferencia.EXCESO) return TipoDiferencia.EXCESO;
  if (value === TipoDiferencia.DEFECTUOSO) return TipoDiferencia.DEFECTUOSO;
  return TipoDiferencia.FALTANTE;
}

/**
 * Clasifica el estado administrativo de una reclamación.
 */
function normalizeEstadoReclamacion(value: unknown): EstadoReclamacion {
  if (value === EstadoReclamacion.RECLAMADO) {
    return EstadoReclamacion.RECLAMADO;
  }

  if (value === EstadoReclamacion.ABONADO) {
    return EstadoReclamacion.ABONADO;
  }

  if (value === EstadoReclamacion.REENVIADO) {
    return EstadoReclamacion.REENVIADO;
  }

  return EstadoReclamacion.PENDIENTE;
}

/**
 * Normaliza el estado de línea de incidencia devuelto por la API.
 */
function normalizeEstadoLineaIncidencia(value: unknown): EstadoLineaIncidencia {
  if (value === EstadoLineaIncidencia.SIN_PROBLEMA) {
    return EstadoLineaIncidencia.SIN_PROBLEMA;
  }

  if (value === EstadoLineaIncidencia.AJUSTADO) {
    return EstadoLineaIncidencia.AJUSTADO;
  }

  return EstadoLineaIncidencia.PENDIENTE_AJUSTE;
}

/**
 * Genera un texto descriptivo basado en el tipo de diferencia.
 */
function formatMotivoDesdeTipo(tipo: TipoDiferencia): string {
  if (tipo === TipoDiferencia.EXCESO) {
    return 'Exceso de producto recibido';
  }

  if (tipo === TipoDiferencia.DEFECTUOSO) {
    return 'Producto defectuoso o roto';
  }

  return 'Faltante de producto';
}

/**
 * Normaliza y mapea el estado de una incidencia desde el backend.
 * Convierte a mayúsculas antes de comparar para que coincida con los valores
 * del enum (que son todos mayúsculas), evitando el bug de case-sensitivity.
 */
function normalizeEstadoIncidencia(value: unknown): EstadoIncidencia | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value.trim().toUpperCase();

  switch (normalized) {
    case 'NUEVA':
    case 'PENDIENTE':
      return EstadoIncidencia.NUEVA;
    case 'ABIERTA':
      return EstadoIncidencia.ABIERTA;
    case 'EN_PROCESO':
      return EstadoIncidencia.EN_PROCESO;
    case 'EN_AJUSTE':
    case 'EN_REVISION':
    case 'PARCIAL':
      return EstadoIncidencia.EN_AJUSTE;
    case 'PENDIENTE_VALIDACION':
      return EstadoIncidencia.PENDIENTE_VALIDACION;
    case 'RESUELTA':
      return EstadoIncidencia.RESUELTA;
    case 'CANCELADA':
    case 'CANCELADO':
      return EstadoIncidencia.CANCELADA;
    case 'INVALIDA':
    case 'INVALIDO':
      return EstadoIncidencia.INVALIDA;
    default:
      return null;
  }
}

/**
 * Infiere el estado lógico de una incidencia basado en sus líneas y resolución.
 */
/**
 * Convierte el estado final del modelo UI al literal esperado por `ResolverIncidenciaDto`.
 */
function mapEstadoFinalToApi(
  estado?: EstadoIncidencia
): 'resuelta' | 'cancelada' | 'invalida' | undefined {
  switch (estado) {
    case EstadoIncidencia.RESUELTA:
      return 'resuelta';
    case EstadoIncidencia.CANCELADA:
      return 'cancelada';
    case EstadoIncidencia.INVALIDA:
      return 'invalida';
    default:
      return undefined;
  }
}

function resolveEstadoIncidenciaFallback(
  lineas: IncidenciaLinea[],
  resuelta: boolean,
  observacionesResolucion?: string
): EstadoIncidencia {
  if (observacionesResolucion && /cancelad/i.test(observacionesResolucion)) {
    return EstadoIncidencia.CANCELADA;
  }

  if (
    observacionesResolucion &&
    /inválid|invalid/i.test(observacionesResolucion)
  ) {
    return EstadoIncidencia.INVALIDA;
  }

  if (resuelta) {
    return EstadoIncidencia.RESUELTA;
  }

  if (lineas.length === 0) {
    return EstadoIncidencia.INVALIDA;
  }

  const pendientes = lineas.filter((linea) => linea.cantidadPendiente > 0);
  if (pendientes.length === 0) {
    return EstadoIncidencia.PENDIENTE_VALIDACION;
  }

  const enAjuste = lineas.some(
    (linea) =>
      linea.estadoReclamacion === EstadoReclamacion.RECLAMADO ||
      linea.estadoReclamacion === EstadoReclamacion.REENVIADO
  );

  return enAjuste ? EstadoIncidencia.EN_AJUSTE : EstadoIncidencia.NUEVA;
}

/**
 * Mapea una línea cruda de la API al modelo de dominio de la aplicación.
 */
function mapLinea(
  rawLinea: RawIncidenciaLinea,
  incidenciaId: string,
  index: number
): IncidenciaLinea {
  const cantidadPedida = toFiniteNumber(rawLinea.cantidadPedida, 0);
  const cantidadRecibida = toFiniteNumber(rawLinea.cantidadRecibida, 0);
  const diferenciaRaw = rawLinea.diferencia;
  const diferencia =
    diferenciaRaw !== undefined
      ? toFiniteNumber(diferenciaRaw, cantidadRecibida - cantidadPedida)
      : cantidadRecibida - cantidadPedida;
  const tipoDiferencia =
    rawLinea.tipoDiferencia !== undefined
      ? normalizeTipoDiferencia(rawLinea.tipoDiferencia)
      : normalizeTipoDiferencia(
          diferencia > 0
            ? TipoDiferencia.EXCESO
            : diferencia < 0
              ? TipoDiferencia.FALTANTE
              : TipoDiferencia.FALTANTE
        );

  const nombreProducto =
    toOptionalText(rawLinea.nombreProducto) ||
    toOptionalText(
      rawLinea.pedidoProducto?.productoProveedor?.producto?.nombre
    ) ||
    'Producto sin nombre';

  const productoId =
    toOptionalText(rawLinea.pedidoProducto?.productoProveedor?.producto?.id) ||
    undefined;

  const unidad = toOptionalText(
    rawLinea.pedidoProducto?.productoProveedor?.producto?.unidad
  );

  const pedidoProductoId =
    toOptionalText(rawLinea.pedidoProductoId) ||
    toOptionalText(rawLinea.pedidoProducto?.id) ||
    '';

  const cantidadAjustada = toFiniteNumber(rawLinea.cantidadAjustada, 0);

  return {
    id: toOptionalText(rawLinea.id) || `${incidenciaId}-linea-${index + 1}`,
    pedidoProductoId,
    productoId,
    nombreProducto,
    unidad,
    cantidadPedida,
    cantidadRecibida,
    cantidadAjustada,
    cantidadPendiente: Math.max(cantidadPedida - cantidadRecibida, 0),
    diferencia,
    tipoDiferencia,
    estado: normalizeEstadoLineaIncidencia(rawLinea.estado),
    necesitaAjuste:
      typeof rawLinea.necesitaAjuste === 'boolean'
        ? rawLinea.necesitaAjuste
        : Math.abs(diferencia) > 0.001,
    estadoReclamacion: normalizeEstadoReclamacion(rawLinea.estadoReclamacion),
    observaciones: toOptionalText(rawLinea.observaciones),
  };
}

/**
 * Construye el motivo principal de la incidencia basado en el pedido o sus líneas.
 */
function buildMotivoIncidencia(
  raw: RawIncidencia,
  lineas: IncidenciaLinea[]
): string {
  const motivoPedido = toOptionalText(raw.pedido?.motivoIncidencia);
  if (motivoPedido) {
    return motivoPedido;
  }

  if (lineas.length === 0) {
    return 'Sin motivo especificado';
  }

  const motivos = Array.from(
    new Set(lineas.map((linea) => formatMotivoDesdeTipo(linea.tipoDiferencia)))
  );

  return motivos.join(' · ');
}

/**
 * Transforma un objeto de incidencia crudo del backend al modelo tipado del frontend.
 */
function mapIncidencia(raw: RawIncidencia): Incidencia {
  const incidenciaId = toOptionalText(raw.id) || 'incidencia-sin-id';
  const lineasRaw = Array.isArray(raw.lineas) ? raw.lineas : [];
  const lineas = lineasRaw.map((linea, index) =>
    mapLinea(linea, incidenciaId, index)
  );

  const cantidadPedidaTotal = lineas.reduce(
    (total, linea) => total + linea.cantidadPedida,
    0
  );
  const cantidadRecibidaTotal = lineas.reduce(
    (total, linea) => total + linea.cantidadRecibida,
    0
  );
  const cantidadPendienteTotal = lineas.reduce(
    (total, linea) => total + linea.cantidadPendiente,
    0
  );

  const proveedorNombre =
    toOptionalText(raw.proveedorNombre) ||
    toOptionalText(raw.pedido?.proveedor?.nombre) ||
    toOptionalText(
      lineasRaw[0]?.pedidoProducto?.productoProveedor?.proveedor?.nombre
    ) ||
    '—';

  const fechaResolucion =
    raw.fechaResolucion instanceof Date
      ? raw.fechaResolucion.toISOString()
      : toOptionalText(raw.fechaResolucion);

  const observacionesResolucion = toOptionalText(raw.observacionesResolucion);
  // Criterio canónico: una incidencia solo está resuelta si backend lo indica
  // explícitamente o si existe fecha de resolución persistida.
  const resuelta = Boolean(raw.resuelta) || Boolean(fechaResolucion);

  return {
    id: incidenciaId,
    recepcionId: toOptionalText(raw.recepcionId) || '',
    pedidoId:
      toOptionalText(raw.pedidoId) || toOptionalText(raw.pedido?.id) || null,
    proveedorId:
      toOptionalText(raw.pedido?.proveedor?.id) ||
      toOptionalText(raw.pedidoId) ||
      '',
    proveedorNombre,
    motivoIncidencia: buildMotivoIncidencia(raw, lineas),
    estado:
      normalizeEstadoIncidencia(raw.estado) ??
      resolveEstadoIncidenciaFallback(
        lineas,
        resuelta,
        observacionesResolucion
      ),
    observacionesRecepcion: toOptionalText(raw.observacionesRecepcion),
    observacionesResolucion,
    resuelta,
    fechaResolucion,
    cantidadPedidaTotal,
    cantidadRecibidaTotal,
    cantidadPendienteTotal,
    lineas,
    createdAt: toOptionalText(raw.createdAt) || new Date().toISOString(),
  };
}

/**
 * Mapea un conjunto de datos paginados de incidencias.
 */
function mapPaginatedIncidencias(
  payload: PaginatedData<RawIncidencia> | RawIncidencia[]
): PaginatedData<Incidencia> {
  if (Array.isArray(payload)) {
    const data = payload.map(mapIncidencia);
    return {
      data,
      total: data.length,
      page: 1,
      limit: data.length,
      totalPages: 1,
    };
  }

  return {
    data: payload.data.map(mapIncidencia),
    total: payload.total,
    page: payload.page,
    limit: payload.limit,
    totalPages: payload.totalPages,
  };
}

/**
 * Recupera la lista paginada de incidencias registradas.
 */
/**
 * Expone "fetchIncidencias" en smart-economat-frontend (SPA).
 * @undefined {IncidenciasQueryParams} params - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<PaginatedData<Incidencia>>} Datos efectivos después de ejecutar la operación.
 */
export async function fetchIncidencias(
  params: IncidenciasQueryParams = {}
): Promise<PaginatedData<Incidencia>> {
  const queryParams = new URLSearchParams();

  queryParams.append('page', normalizePageParam(params.page).toString());
  queryParams.append('limit', normalizeLimitParam(params.limit).toString());
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.resuelta !== undefined)
    queryParams.append('resuelta', params.resuelta.toString());
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);

  const response = await baseFetch(`/incidencias?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener incidencias: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<
    PaginatedData<RawIncidencia> | RawIncidencia[]
  >;

  return mapPaginatedIncidencias(body.data);
}

/**
 * Resuelve formalmente una incidencia, aplicando las correcciones de stock necesarias.
 */
/**
 * Expone "resolveIncidencia" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {ResolveIncidenciaPayload} payload - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<Incidencia>} Datos efectivos después de ejecutar la operación.
 */
export async function resolveIncidencia(
  id: string,
  payload: ResolveIncidenciaPayload
): Promise<Incidencia> {
  const { estadoFinal, ...restPayload } = payload;
  const estadoFinalApi = mapEstadoFinalToApi(estadoFinal);
  const requestBody: Record<string, unknown> = { ...restPayload };
  if (estadoFinalApi !== undefined) {
    requestBody.estadoFinal = estadoFinalApi;
  }

  const response = await baseFetch(`/incidencias/${id}/resolver`, {
    method: 'PATCH',
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al resolver incidencia: ${response.status}`
    );
  }

  const body = (await response.json()) as ApiResponse<RawIncidencia>;
  return mapIncidencia(body.data);
}

/**
 * Elimina un registro de incidencia.
 */
/**
 * Expone "removeIncidencia" en smart-economat-frontend (SPA).
 * @undefined {string} id - Entrada efectiva esperada por el contrato.
 * @undefined {Promise<void>} Datos efectivos después de ejecutar la operación.
 */
export async function removeIncidencia(id: string): Promise<void> {
  const response = await baseFetch(`/incidencias/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al eliminar incidencia: ${response.status}`
    );
  }
}
