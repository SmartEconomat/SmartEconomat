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

interface RawProveedor {
  nombre?: string | null;
}

interface RawProducto {
  nombre?: string | null;
  unidad?: string | null;
}

interface RawProductoProveedor {
  producto?: RawProducto | null;
  proveedor?: RawProveedor | null;
}

interface RawPedidoProducto {
  id?: string;
  productoProveedor?: RawProductoProveedor | null;
}

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

interface RawPedido {
  id?: string;
  motivoIncidencia?: string | null;
  proveedor?: RawProveedor | null;
}

interface RawIncidencia {
  id?: string;
  recepcionId?: string;
  pedidoId?: string | null;
  proveedorNombre?: string;
  observacionesRecepcion?: string;
  observacionesResolucion?: string;
  resuelta?: boolean;
  fechaResolucion?: string | Date | null;
  lineas?: RawIncidenciaLinea[];
  pedido?: RawPedido | null;
  createdAt?: string;
}

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

function toOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function normalizeTipoDiferencia(value: unknown): TipoDiferencia {
  if (value === TipoDiferencia.EXCESO) return TipoDiferencia.EXCESO;
  if (value === TipoDiferencia.DEFECTUOSO) return TipoDiferencia.DEFECTUOSO;
  return TipoDiferencia.FALTANTE;
}

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

function formatMotivoDesdeTipo(tipo: TipoDiferencia): string {
  if (tipo === TipoDiferencia.EXCESO) {
    return 'Exceso de producto recibido';
  }

  if (tipo === TipoDiferencia.DEFECTUOSO) {
    return 'Producto defectuoso o roto';
  }

  return 'Faltante de producto';
}

function resolveEstadoIncidencia(
  lineas: IncidenciaLinea[],
  resuelta: boolean,
  observacionesResolucion?: string
): EstadoIncidencia {
  if (observacionesResolucion && /cancelad/i.test(observacionesResolucion)) {
    return EstadoIncidencia.CANCELADA;
  }

  if (resuelta) {
    return EstadoIncidencia.RESUELTA;
  }

  if (lineas.length === 0) {
    return EstadoIncidencia.PENDIENTE;
  }

  const pendientes = lineas.filter((linea) => linea.cantidadPendiente > 0);
  if (pendientes.length === 0) {
    return EstadoIncidencia.RESUELTA;
  }

  if (pendientes.length < lineas.length) {
    return EstadoIncidencia.PARCIAL;
  }

  const enRevision = lineas.some(
    (linea) =>
      linea.estadoReclamacion === EstadoReclamacion.RECLAMADO ||
      linea.estadoReclamacion === EstadoReclamacion.REENVIADO
  );

  return enRevision ? EstadoIncidencia.EN_REVISION : EstadoIncidencia.PENDIENTE;
}

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
  const resuelta =
    Boolean(raw.resuelta) ||
    Boolean(fechaResolucion) ||
    (lineas.length > 0 && cantidadPendienteTotal === 0);

  return {
    id: incidenciaId,
    recepcionId: toOptionalText(raw.recepcionId) || '',
    pedidoId:
      toOptionalText(raw.pedidoId) || toOptionalText(raw.pedido?.id) || null,
    proveedorNombre,
    motivoIncidencia: buildMotivoIncidencia(raw, lineas),
    estado: resolveEstadoIncidencia(lineas, resuelta, observacionesResolucion),
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
