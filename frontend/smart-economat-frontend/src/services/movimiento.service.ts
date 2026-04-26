import {
  Movimiento,
  MovimientosQueryParams,
  TipoMovimiento,
} from './movimiento.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';
import {
  normalizeLimitParam,
  normalizePageParam,
  toFiniteNumberOrUndefined,
  toOptionalTrimmedString,
} from './api.utils';

const MOVIMIENTOS_MAX_LIMIT = 50;

interface MovimientoPayloadFields {
  tipo?: TipoMovimiento;
  cantidad?: number;
  entidadTipo?: string;
  entidadId?: string;
  descripcion?: string;
  inventario?: string;
  productoProveedor?: string;
  usuario?: string;
}

export type CreateMovimientoPayload = Required<
  Pick<
    MovimientoPayloadFields,
    'tipo' | 'cantidad' | 'entidadTipo' | 'entidadId'
  >
> &
  Omit<
    MovimientoPayloadFields,
    'tipo' | 'cantidad' | 'entidadTipo' | 'entidadId'
  >;

export type UpdateMovimientoPayload = MovimientoPayloadFields;

function sanitizeRequiredMovimientoField(
  value: unknown,
  fieldName: string,
  requireValue: boolean
): string | undefined {
  const normalizedValue = toOptionalTrimmedString(value);

  if (requireValue && !normalizedValue) {
    throw new Error(`El campo ${fieldName} es obligatorio.`);
  }

  if (!requireValue && value != null && !normalizedValue) {
    throw new Error(`El campo ${fieldName} no puede estar vacio.`);
  }

  return normalizedValue;
}

function sanitizeMovimientoPayload(
  movimiento: MovimientoPayloadFields,
  requireAllFields: boolean
): MovimientoPayloadFields {
  const normalizedCantidad = toFiniteNumberOrUndefined(movimiento.cantidad);

  if (requireAllFields && movimiento.tipo == null) {
    throw new Error('El tipo de movimiento es obligatorio.');
  }

  if (normalizedCantidad !== undefined) {
    if (!Number.isInteger(normalizedCantidad) || normalizedCantidad < 0) {
      throw new Error(
        'La cantidad del movimiento debe ser un entero mayor o igual a 0.'
      );
    }
  } else if (requireAllFields) {
    throw new Error('La cantidad del movimiento es obligatoria.');
  }

  const normalizedPayload: MovimientoPayloadFields = {
    tipo: movimiento.tipo,
    cantidad: normalizedCantidad,
    entidadTipo: sanitizeRequiredMovimientoField(
      movimiento.entidadTipo,
      'entidadTipo',
      requireAllFields
    ),
    entidadId: sanitizeRequiredMovimientoField(
      movimiento.entidadId,
      'entidadId',
      requireAllFields
    ),
    descripcion: toOptionalTrimmedString(movimiento.descripcion),
    inventario: toOptionalTrimmedString(movimiento.inventario),
    productoProveedor: toOptionalTrimmedString(movimiento.productoProveedor),
    usuario: toOptionalTrimmedString(movimiento.usuario),
  };

  if (
    normalizedPayload.descripcion !== undefined &&
    normalizedPayload.descripcion.length > 1000
  ) {
    throw new Error(
      'La descripcion del movimiento no puede superar 1000 caracteres.'
    );
  }

  return normalizedPayload;
}

/**
 * Documentación en español.
 */
export async function fetchMovimientos(
  params: MovimientosQueryParams = {}
): Promise<PaginatedData<Movimiento>> {
  const queryParams = new URLSearchParams();
  const normalizedPage = normalizePageParam(params.page);
  const normalizedLimit = normalizeLimitParam(
    params.limit,
    10,
    MOVIMIENTOS_MAX_LIMIT
  );

  queryParams.append('page', normalizedPage.toString());
  queryParams.append('limit', normalizedLimit.toString());
  if (params.searchTerm) queryParams.append('searchTerm', params.searchTerm);
  if (params.type) {
    if (Array.isArray(params.type)) {
      params.type.forEach((t) => queryParams.append('type', t));
    } else {
      queryParams.append('type', params.type);
    }
  }
  if (params.startDate) queryParams.append('startDate', params.startDate);
  if (params.endDate) queryParams.append('endDate', params.endDate);
  if (params.sortBy) queryParams.append('sortBy', params.sortBy);
  if (params.sortOrder) queryParams.append('order', params.sortOrder);

  const response = await baseFetch(`/movimientos?${queryParams.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener movimientos: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<
    PaginatedData<Movimiento>
  >;
  return body.data;
}

/**
 * Documentación en español.
 */
export async function createMovimiento(
  movimiento: CreateMovimientoPayload
): Promise<Movimiento> {
  const payload = sanitizeMovimientoPayload(movimiento, true);
  const response = await baseFetch('/movimientos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al crear movimiento: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Movimiento>;
  return body.data;
}

/**
 * Documentación en español.
 */
export async function updateMovimiento(
  id: string,
  movimiento: UpdateMovimientoPayload
): Promise<Movimiento> {
  const payload = sanitizeMovimientoPayload(movimiento, false);
  const response = await baseFetch(`/movimientos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al actualizar movimiento: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Movimiento>;
  return body.data;
}
