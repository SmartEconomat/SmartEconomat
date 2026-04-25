import {
  EstadoIncidencia,
  EstadoReclamacion,
  Incidencia,
  IncidenciaLinea,
  IncidenciasQueryParams,
  ResolveIncidenciaPayload,
  TipoDiferencia,
} from './incidencia.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

/** Minimal supplier data from the raw API payload. */
interface RawProveedor {
  nombre?: string | null;
}

/** Minimal product data from the raw API payload. */
interface RawProducto {
  id?: string;
  nombre?: string | null;
  unidad?: string | null;
}

/** Raw product-supplier pairing from the API. */
interface RawProductoProveedor {
  producto?: RawProducto | null;
  proveedor?: RawProveedor | null;
}

/** Raw pedido product data embedded in incidence lines. */
interface RawPedidoProducto {
  id?: string;
  productoProveedor?: RawProductoProveedor | null;
}

/** Raw incidence line as returned by the API before normalisation. */
interface RawIncidenciaLinea {
  id?: string;
  pedidoProductoId?: string;
  nombreProducto?: string;
  cantidadEsperada?: number | string;
  cantidadRecibida?: number | string;
  diferencia?: number | string;
  tipoDiferencia?: string;
  estadoReclamacion?: string;
  observaciones?: string;
  pedidoProducto?: RawPedidoProducto | null;
}

/** Raw pedido summary embedded in incidence records. */
interface RawPedido {
  id?: string;
  motivoIncidencia?: string | null;
  proveedor?: RawProveedor | null;
}

/** Raw incidence record as returned by the API before normalisation. */
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
 * Converts an unknown value to a finite number, returning `fallback` when not possible.
 *
 * @param {unknown} value - The value to convert.
 * @param {number} [fallback=0] - Fallback value when conversion fails.
 * @returns {number} A finite number.
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
 * Trims a string value and returns it, or `undefined` when empty/non-string.
 *
 * @param {unknown} value - The value to normalise.
 * @returns {string | undefined} Trimmed string or undefined.
 */
function toOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

/**
 * Normalises an unknown value to a valid `TipoDiferencia` enum member.
 *
 * @param {unknown} value - Raw value from the API.
 * @returns {TipoDiferencia} Normalised type, defaulting to FALTANTE.
 */
function normalizeTipoDiferencia(value: unknown): TipoDiferencia {
  if (value === TipoDiferencia.EXCESO) return TipoDiferencia.EXCESO;
  if (value === TipoDiferencia.DEFECTUOSO) return TipoDiferencia.DEFECTUOSO;
  return TipoDiferencia.FALTANTE;
}

/**
 * Normalises an unknown value to a valid `EstadoReclamacion` enum member.
 *
 * @param {unknown} value - Raw value from the API.
 * @returns {EstadoReclamacion} Normalised state, defaulting to PENDIENTE.
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
 * Returns a human-readable motive string derived from the discrepancy type.
 *
 * @param {TipoDiferencia} tipo - The type of discrepancy.
 * @returns {string} Localised motive description.
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
 * Normalises a raw estado value to a valid `EstadoIncidencia` enum member.
 * Returns `null` when the value cannot be mapped.
 *
 * @param {unknown} value - Raw estado string from the API.
 * @returns {EstadoIncidencia | null} Normalised state or null.
 */
function normalizeEstadoIncidencia(value: unknown): EstadoIncidencia | null {
  if (typeof value !== 'string') {
    return null;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  switch (normalized) {
    case EstadoIncidencia.NUEVA:
      return EstadoIncidencia.NUEVA;
    case EstadoIncidencia.EN_AJUSTE:
      return EstadoIncidencia.EN_AJUSTE;
    case EstadoIncidencia.PENDIENTE_VALIDACION:
      return EstadoIncidencia.PENDIENTE_VALIDACION;
    case EstadoIncidencia.RESUELTA:
      return EstadoIncidencia.RESUELTA;
    case EstadoIncidencia.CANCELADA:
    case 'cancelado':
      return EstadoIncidencia.CANCELADA;
    case EstadoIncidencia.INVALIDA:
    case 'invalido':
      return EstadoIncidencia.INVALIDA;
    case 'pendiente':
      return EstadoIncidencia.NUEVA;
    case 'en_revision':
    case 'parcial':
      return EstadoIncidencia.EN_AJUSTE;
    default:
      return null;
  }
}

/**
 * Derives the incidence state from its lines and resolution data when the
 * API does not provide a mappable `estado` value.
 *
 * @param {IncidenciaLinea[]} lineas - Normalised incidence lines.
 * @param {boolean} resuelta - Whether the incidence has been resolved.
 * @param {string} [observacionesResolucion] - Optional resolution notes.
 * @returns {EstadoIncidencia} The inferred state.
 */
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
 * Maps a raw incidence line from the API to the normalised `IncidenciaLinea` shape.
 *
 * @param {RawIncidenciaLinea} rawLinea - Raw line data.
 * @param {string} incidenciaId - Parent incidence identifier (used for fallback IDs).
 * @param {number} index - Zero-based index within the parent incidence's lines array.
 * @returns {IncidenciaLinea} Normalised line.
 */
function mapLinea(
  rawLinea: RawIncidenciaLinea,
  incidenciaId: string,
  index: number
): IncidenciaLinea {
  const cantidadEsperada = toFiniteNumber(rawLinea.cantidadEsperada, 0);
  const cantidadRecibida = toFiniteNumber(rawLinea.cantidadRecibida, 0);
  const diferenciaRaw = rawLinea.diferencia;
  const diferencia =
    diferenciaRaw !== undefined
      ? toFiniteNumber(diferenciaRaw, cantidadRecibida - cantidadEsperada)
      : cantidadRecibida - cantidadEsperada;
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

  return {
    id: toOptionalText(rawLinea.id) || `${incidenciaId}-linea-${index + 1}`,
    pedidoProductoId,
    productoId,
    nombreProducto,
    unidad,
    cantidadEsperada,
    cantidadRecibida,
    cantidadPendiente: Math.max(cantidadEsperada - cantidadRecibida, 0),
    diferencia,
    tipoDiferencia,
    estadoReclamacion: normalizeEstadoReclamacion(rawLinea.estadoReclamacion),
    observaciones: toOptionalText(rawLinea.observaciones),
  };
}

/**
 * Constructs the human-readable motive string for an incidence from raw data.
 *
 * @param {RawIncidencia} raw - Raw incidence record.
 * @param {IncidenciaLinea[]} lineas - Already-normalised incidence lines.
 * @returns {string} The motive string.
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
 * Maps a raw incidence record from the API to the normalised `Incidencia` shape.
 *
 * @param {RawIncidencia} raw - Raw incidence data.
 * @returns {Incidencia} Normalised incidence.
 */
function mapIncidencia(raw: RawIncidencia): Incidencia {
  const incidenciaId = toOptionalText(raw.id) || 'incidencia-sin-id';
  const lineasRaw = Array.isArray(raw.lineas) ? raw.lineas : [];
  const lineas = lineasRaw.map((linea, index) =>
    mapLinea(linea, incidenciaId, index)
  );

  const cantidadPedidaTotal = lineas.reduce(
    (total, linea) => total + linea.cantidadEsperada,
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
 * Normalises a paginated or plain-array incidencias payload to a `PaginatedData<Incidencia>` shape.
 *
 * @param {PaginatedData<RawIncidencia> | RawIncidencia[]} payload - Raw API data.
 * @returns {PaginatedData<Incidencia>} Normalised paginated incidencias.
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
 * Fetches a paginated list of incidencias, normalising each record.
 *
 * @param {IncidenciasQueryParams} [params] - Filter and pagination options.
 * @returns {Promise<PaginatedData<Incidencia>>} Paginated incidencias.
 * @throws {Error} If the API returns a non-OK response.
 * @example
 * const result = await fetchIncidencias({ page: 1, resuelta: false });
 */
export async function fetchIncidencias(
  params: IncidenciasQueryParams = {}
): Promise<PaginatedData<Incidencia>> {
  const queryParams = new URLSearchParams();

  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
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
 * Resolves an incidence by applying line adjustments and optionally marking it as resolved.
 *
 * @param {string} id - The incidence UUID to resolve.
 * @param {ResolveIncidenciaPayload} dto - Resolution details and line adjustments.
 * @returns {Promise<Incidencia>} The updated and normalised incidence.
 * @throws {Error} If the API returns an error response.
 * @example
 * const resolved = await resolveIncidencia('abc-123', { marcarComoResuelta: true });
 */
export async function resolveIncidencia(
  id: string,
  dto: ResolveIncidenciaPayload
): Promise<Incidencia> {
  const response = await baseFetch(`/incidencias/${id}/resolver`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dto),
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
 * Soft-deletes an incidence record.
 *
 * @param {string} id - The incidence UUID to remove.
 * @returns {Promise<void>}
 * @throws {Error} If the API returns an error response.
 * @example
 * await removeIncidencia('abc-123');
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
