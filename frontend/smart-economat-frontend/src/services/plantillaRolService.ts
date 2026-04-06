import { baseFetch, parseApiResponse } from './api.service';
import type {
  CreatePlantillaRolDto,
  PlantillaRol,
  UpdatePlantillaRolDto,
} from '../types/plantillaRol';

interface ServiceResponse<T> {
  data: T;
  status: number;
  message?: string;
}

export const plantillaRolService = {
  async getPlantillas(): Promise<ServiceResponse<PlantillaRol[]>> {
    const response = await baseFetch('/plantillas-roles');
    const result = await parseApiResponse<PlantillaRol[]>(
      response,
      'No se pudieron cargar las plantillas de roles'
    );

    return {
      data: result.data,
      status: response.status,
      message: result.message,
    };
  },

  async createPlantilla(
    payload: CreatePlantillaRolDto
  ): Promise<ServiceResponse<PlantillaRol>> {
    const response = await baseFetch('/plantillas-roles', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const result = await parseApiResponse<PlantillaRol>(
      response,
      'No se pudo crear la plantilla'
    );

    return {
      data: result.data,
      status: response.status,
      message: result.message,
    };
  },

  async updatePlantilla(
    id: string,
    payload: UpdatePlantillaRolDto
  ): Promise<ServiceResponse<PlantillaRol>> {
    const response = await baseFetch(`/plantillas-roles/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });

    const result = await parseApiResponse<PlantillaRol>(
      response,
      'No se pudo actualizar la plantilla'
    );

    return {
      data: result.data,
      status: response.status,
      message: result.message,
    };
  },

  async duplicatePlantilla(
    id: string,
    nombre?: string
  ): Promise<ServiceResponse<PlantillaRol>> {
    const response = await baseFetch(`/plantillas-roles/${id}/duplicar`, {
      method: 'POST',
      body: JSON.stringify(
        nombre && nombre.trim().length > 0 ? { nombre: nombre.trim() } : {}
      ),
    });

    const result = await parseApiResponse<PlantillaRol>(
      response,
      'No se pudo duplicar la plantilla'
    );

    return {
      data: result.data,
      status: response.status,
      message: result.message,
    };
  },

  async setActivo(
    id: string,
    activo: boolean
  ): Promise<ServiceResponse<PlantillaRol>> {
    const response = await baseFetch(`/plantillas-roles/${id}/activo`, {
      method: 'PATCH',
      body: JSON.stringify({ activo }),
    });

    const result = await parseApiResponse<PlantillaRol>(
      response,
      'No se pudo actualizar el estado de la plantilla'
    );

    return {
      data: result.data,
      status: response.status,
      message: result.message,
    };
  },

  async removePlantilla(id: string): Promise<ServiceResponse<null>> {
    const response = await baseFetch(`/plantillas-roles/${id}`, {
      method: 'DELETE',
    });

    const result = await parseApiResponse<unknown>(
      response,
      'No se pudo eliminar la plantilla'
    );

    return {
      data: null,
      status: response.status,
      message: result.message,
    };
  },

  async updatePermisos(
    id: string,
    permisoIds: string[]
  ): Promise<ServiceResponse<PlantillaRol>> {
    const response = await baseFetch(`/plantillas-roles/${id}/permisos`, {
      method: 'PATCH',
      body: JSON.stringify({ permisoIds }),
    });

    const result = await parseApiResponse<PlantillaRol>(
      response,
      'No se pudieron actualizar los permisos de la plantilla'
    );

    return {
      data: result.data,
      status: response.status,
      message: result.message,
    };
  },
};
