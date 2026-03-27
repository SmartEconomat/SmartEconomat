import { Receta } from './receta.types';
import { baseFetch } from './api.service';
import { DownloadOptions, DownloadService } from './download.service';

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

export async function createReceta(
  receta: Partial<Receta> & { imagen?: File }
): Promise<Receta> {
  // Excluir 'imagen' del payload (ya se subió por separado)
  const payload = Object.fromEntries(
    Object.entries(receta).filter(([key]) => key !== 'imagen')
  );

  const response = await baseFetch('/recetas', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
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
  receta: Partial<Receta> & { imagen?: File }
): Promise<Receta> {
  // Excluir 'imagen' del payload (ya se subió por separado)
  const payload = Object.fromEntries(
    Object.entries(receta).filter(([key]) => key !== 'imagen')
  );

  const response = await baseFetch(`/recetas/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json',
    },
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
type RecetaDetalleApiData = {
  receta: Receta;
  detalleIngredientes: Array<{
    productoId: string;
    productoNombre: string;
    cantidadNecesaria: number;
    stockActual: number;
    cantidadFaltante: number;
    unidad: string;
  }>;
  alergenosConsolidados: string[];
};

export async function getRecetaDetalle(
  id: string
): Promise<RecetaDetalleApiData> {
  const response = await baseFetch(`/recetas/${id}/detalle`);
  if (!response.ok) {
    throw new Error(`Error al obtener detalle: ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<RecetaDetalleApiData>;
  return body.data;
}

export async function exportRecipesPdf(
  ids: string[],
  options: { includeImage?: boolean; toast: DownloadOptions['toast'] }
): Promise<void> {
  if (ids.length === 0) {
    throw new Error('Debe seleccionar al menos una receta para exportar.');
  }

  const query = new URLSearchParams({
    ids: ids.join(','),
    includeImage: String(options.includeImage !== false),
  });

  await DownloadService.downloadFile(
    `/recetas/export/pdf?${query.toString()}`,
    {
      filename: `SmartEconomat_Recetas_${new Date().toISOString().split('T')}.pdf`,
      toast: options.toast,
    }
  );
}
export async function calculatePreviewCost(dto: {
  ingredientes: Array<{
    productoId: string;
    cantidad: number;
    unidad: string;
    mermaAplicada?: number;
    proveedorFavoritoId?: string;
  }>;
  rendimiento?: number;
}): Promise<{ costoTotal: number; costoUnitarioEstimado?: number }> {
  const response = await baseFetch('/recetas/calculate-preview', {
    method: 'POST',
    body: JSON.stringify(dto),
    headers: {
      'Content-Type': 'application/json',
    },
  });
  if (!response.ok) {
    throw new Error(`Error al previsualizar coste: ${response.status}`);
  }
  const body = (await response.json()) as ApiResponse<{
    costoTotal: number;
    costoUnitarioEstimado?: number;
  }>;
  return body.data;
}
