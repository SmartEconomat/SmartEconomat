import type {
  Ubicacion,
  CreateUbicacionDto,
  UpdateUbicacionDto,
} from './ubicacion.types';
import { baseFetch, ApiResponse, unwrapList } from './api.service';

const UBICACIONES_CACHE_TTL_MS = 60_000;

let ubicacionesCache: {
  data: Ubicacion[];
  expiresAt: number;
} | null = null;

let ubicacionesInFlightRequest: Promise<Ubicacion[]> | null = null;

type UbicacionApiRecord = Ubicacion & {
  deleted_at?: string | null;
};

const isUbicacionDeleted = (ubicacion: UbicacionApiRecord): boolean =>
  Boolean(ubicacion.deletedAt || ubicacion.deleted_at);

const isUbicacionesCacheValid = (): boolean =>
  Boolean(ubicacionesCache && ubicacionesCache.expiresAt > Date.now());

/**
 * Expone "invalidateUbicacionesCache" en smart-economat-frontend (SPA).
 * @undefined {void} Datos efectivos después de ejecutar la operación.
 */
export const invalidateUbicacionesCache = (): void => {
  ubicacionesCache = null;
};

/** Constantes públicas (UbicacionService) expuestas en smart-economat-frontend (SPA). */
export const UbicacionService = {
  findAll: async (options?: {
    forceRefresh?: boolean;
  }): Promise<Ubicacion[]> => {
    if (
      !options?.forceRefresh &&
      isUbicacionesCacheValid() &&
      ubicacionesCache
    ) {
      return ubicacionesCache.data;
    }

    if (ubicacionesInFlightRequest) {
      return ubicacionesInFlightRequest;
    }

    ubicacionesInFlightRequest = (async () => {
      const response = await baseFetch('/ubicacion');
      if (!response.ok) throw new Error('Error al obtener ubicaciones');
      const { data } = (await response.json()) as ApiResponse<unknown>;
      const ubicaciones = unwrapList<UbicacionApiRecord>(data).filter(
        (ubicacion) => !isUbicacionDeleted(ubicacion)
      );

      ubicacionesCache = {
        data: ubicaciones,
        expiresAt: Date.now() + UBICACIONES_CACHE_TTL_MS,
      };

      return ubicaciones;
    })().finally(() => {
      ubicacionesInFlightRequest = null;
    });

    return ubicacionesInFlightRequest;
  },

  create: async (data: CreateUbicacionDto): Promise<Ubicacion> => {
    const response = await baseFetch('/ubicacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear ubicación');
    const resData = (await response.json()) as ApiResponse<Ubicacion>;
    invalidateUbicacionesCache();
    return resData.data;
  },

  update: async (id: string, data: UpdateUbicacionDto): Promise<Ubicacion> => {
    const response = await baseFetch(`/ubicacion/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al actualizar ubicación');
    const resData = (await response.json()) as ApiResponse<Ubicacion>;
    invalidateUbicacionesCache();
    return resData.data;
  },

  remove: async (id: string): Promise<void> => {
    const response = await baseFetch(`/ubicacion/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar ubicación');
    invalidateUbicacionesCache();
  },
};
