import type {
  Ubicacion,
  CreateUbicacionDto,
  UpdateUbicacionDto,
} from './ubicacion.types';
import { baseFetch, ApiResponse, unwrapList } from './api.service';

type UbicacionApiRecord = Ubicacion & {
  deleted_at?: string | null;
};

const isUbicacionDeleted = (ubicacion: UbicacionApiRecord): boolean =>
  Boolean(ubicacion.deletedAt || ubicacion.deleted_at);

export const UbicacionService = {
  findAll: async (): Promise<Ubicacion[]> => {
    const response = await baseFetch('/ubicacion');
    if (!response.ok) throw new Error('Error al obtener ubicaciones');
    const { data } = (await response.json()) as ApiResponse<unknown>;
    const ubicaciones = unwrapList<UbicacionApiRecord>(data);
    return ubicaciones.filter((ubicacion) => !isUbicacionDeleted(ubicacion));
  },

  create: async (data: CreateUbicacionDto): Promise<Ubicacion> => {
    const response = await baseFetch('/ubicacion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Error al crear ubicación');
    const resData = (await response.json()) as ApiResponse<Ubicacion>;
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
    return resData.data;
  },

  remove: async (id: string): Promise<void> => {
    const response = await baseFetch(`/ubicacion/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Error al eliminar ubicación');
  },
};
