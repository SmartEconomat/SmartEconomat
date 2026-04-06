import { Proveedor } from './proveedor.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';
import { normalizeLimitParam, normalizePageParam } from './api.utils';

const PROVEEDORES_MAX_LIMIT = 50;

type ProviderSortOrder = 'asc' | 'desc' | 'ASC' | 'DESC';

export interface ProveedorPayloadFields {
  nombre?: string;
  contacto?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  nif?: string;
}

export type CreateProveedorPayload = Required<
  Pick<ProveedorPayloadFields, 'nombre'>
> &
  Omit<ProveedorPayloadFields, 'nombre'>;

export type UpdateProveedorPayload = ProveedorPayloadFields;

function normalizeProveedorField(value: unknown): string | undefined {
  if (value == null) {
    return undefined;
  }

  return String(value).trim();
}

function assertProveedorMaxLength(
  fieldName: string,
  value: string | undefined,
  maxLength: number
): void {
  if (value !== undefined && value.length > maxLength) {
    throw new Error(
      `El campo ${fieldName} no puede superar ${maxLength} caracteres.`
    );
  }
}

function sanitizeProveedorPayload(
  proveedor: ProveedorPayloadFields,
  requireNombre: boolean
): ProveedorPayloadFields {
  const normalizedPayload: ProveedorPayloadFields = {
    nombre: normalizeProveedorField(proveedor.nombre),
    contacto: normalizeProveedorField(proveedor.contacto),
    telefono: normalizeProveedorField(proveedor.telefono),
    email: normalizeProveedorField(proveedor.email)?.toLowerCase(),
    direccion: normalizeProveedorField(proveedor.direccion),
    nif: normalizeProveedorField(proveedor.nif),
  };

  if (normalizedPayload.nombre !== undefined && !normalizedPayload.nombre) {
    throw new Error('El nombre del proveedor no puede estar vacio.');
  }

  if (requireNombre && !normalizedPayload.nombre) {
    throw new Error('El nombre del proveedor es obligatorio.');
  }

  assertProveedorMaxLength('nombre', normalizedPayload.nombre, 100);
  assertProveedorMaxLength('contacto', normalizedPayload.contacto, 100);
  assertProveedorMaxLength('telefono', normalizedPayload.telefono, 50);
  assertProveedorMaxLength('email', normalizedPayload.email, 255);
  assertProveedorMaxLength('nif', normalizedPayload.nif, 20);

  return normalizedPayload;
}

function normalizeProviderSortOrder(
  value?: ProviderSortOrder
): 'ASC' | 'DESC' | undefined {
  if (!value) {
    return undefined;
  }

  return String(value).toUpperCase() === 'DESC' ? 'DESC' : 'ASC';
}

export async function fetchProveedores(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy?: string,
  sortOrder?: ProviderSortOrder
): Promise<PaginatedData<Proveedor>> {
  const normalizedPage = normalizePageParam(page);
  const normalizedLimit = normalizeLimitParam(limit, 10, PROVEEDORES_MAX_LIMIT);
  const params = new URLSearchParams({
    page: normalizedPage.toString(),
    limit: normalizedLimit.toString(),
  });
  if (search) params.append('searchTerm', search);
  if (sortBy?.trim()) params.append('sortBy', sortBy.trim());

  const normalizedOrder = normalizeProviderSortOrder(sortOrder);
  if (normalizedOrder) params.append('order', normalizedOrder);

  const response = await baseFetch(`/proveedor?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener proveedores: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Proveedor>>;
  return body.data;
}

export async function createProveedor(
  proveedor: CreateProveedorPayload
): Promise<Proveedor> {
  const payload = sanitizeProveedorPayload(proveedor, true);
  const response = await baseFetch('/proveedor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al crear proveedor: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Proveedor>;
  return body.data;
}

export async function updateProveedor(
  id: string,
  proveedor: UpdateProveedorPayload
): Promise<Proveedor> {
  const payload = sanitizeProveedorPayload(proveedor, false);
  const response = await baseFetch(`/proveedor/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message || `Error al actualizar proveedor: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Proveedor>;
  return body.data;
}

export async function fetchProveedoresConPedidos(): Promise<Proveedor[]> {
  const response = await baseFetch('/proveedor/con-pedidos');
  if (!response.ok) {
    throw new Error(
      `Error al obtener proveedores con pedidos: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<Proveedor[]>;
  return body.data;
}
