import { Receta } from './receta.types';
import { baseFetch } from './api.service';

import { PaginatedData } from './api.service';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export async function fetchRecetas(
  page: number = 1,
  limit: number = 100,
  search: string = ''
): Promise<PaginatedData<Receta>> {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (search) query.append('searchTerm', search);

  const response = await baseFetch(`/recetas?${query.toString()}`);
  if (!response.ok) {
    throw new Error(
      `Error al obtener recetas: ${response.status} ${response.statusText}`
    );
  }
  const body = (await response.json()) as ApiResponse<PaginatedData<Receta>>;
  return body.data;
}

export async function createReceta(receta: Partial<Receta>): Promise<Receta> {
  const response = await baseFetch('/recetas', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(receta),
  });
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(
      errorBody.message || `Error al crear receta: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Receta>;
  return body.data ?? (body as unknown as Receta);
}

export async function updateReceta(
  id: string,
  receta: Partial<Receta>
): Promise<Receta> {
  const response = await baseFetch(`/recetas/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(receta),
  });
  if (!response.ok) {
    const errorBody = (await response.json().catch(() => ({}))) as {
      message?: string;
    };
    throw new Error(
      errorBody.message || `Error al actualizar receta: ${response.status}`
    );
  }
  const body = (await response.json()) as ApiResponse<Receta>;
  return body.data ?? (body as unknown as Receta);
}
