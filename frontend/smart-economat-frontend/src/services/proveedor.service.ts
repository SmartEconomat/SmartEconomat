import { Proveedor } from './proveedor.types';
import { baseFetch, ApiResponse, PaginatedData } from './api.service';

const PROVEEDORES_MAX_LIMIT = 50;

function normalizeSortableValue(value: unknown): string | number | boolean {
  if (value === null || value === undefined) return '';
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  ) {
    return value;
  }
  return String(value);
}

export async function fetchProveedores(
  page: number = 1,
  limit: number = 10,
  search: string = '',
  sortBy?: string,
  sortOrder?: 'asc' | 'desc'
): Promise<PaginatedData<Proveedor>> {
  const normalizedLimit = Math.min(
    Math.max(1, Math.trunc(limit)),
    PROVEEDORES_MAX_LIMIT
  );
  const params = new URLSearchParams({
    page: page.toString(),
    limit: normalizedLimit.toString(),
  });
  if (search) params.append('searchTerm', search);

  const response = await baseFetch(`/proveedor?${params.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener proveedores: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Proveedor>>;
  const data = body.data.data;

  if (sortBy) {
    data.sort((a, b) => {
      const aRecord = a as unknown as Record<string, unknown>;
      const bRecord = b as unknown as Record<string, unknown>;
      const aValue = normalizeSortableValue(aRecord[sortBy]);
      const bValue = normalizeSortableValue(bRecord[sortBy]);

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'desc'
          ? bValue.localeCompare(aValue, undefined, {
              numeric: true,
              sensitivity: 'base',
            })
          : aValue.localeCompare(bValue, undefined, {
              numeric: true,
              sensitivity: 'base',
            });
      }

      if (typeof aValue === 'boolean' && typeof bValue === 'boolean') {
        return sortOrder === 'desc'
          ? Number(bValue) - Number(aValue)
          : Number(aValue) - Number(bValue);
      }

      if (aValue < bValue) return sortOrder === 'desc' ? 1 : -1;
      if (aValue > bValue) return sortOrder === 'desc' ? -1 : 1;
      return 0;
    });
  }

  return {
    ...body.data,
    data: data,
  };
}

export async function createProveedor(
  proveedor: Partial<Proveedor>
): Promise<Proveedor> {
  const response = await baseFetch('/proveedor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proveedor),
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
  proveedor: Partial<Proveedor>
): Promise<Proveedor> {
  const response = await baseFetch(`/proveedor/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(proveedor),
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
