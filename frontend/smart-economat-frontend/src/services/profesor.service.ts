import { ApiResponse } from '../types/usuario';
import { baseFetch } from './api.service';

export interface AlumnoSlot {
  id: string;
  aula: string;
  numeroClase: number;
  capacidad: number;
  codigoSlot?: string;
  profesorId?: string;
  ubicacionId?: string;
  ubicacion?: {
    id: string;
    nombre: string;
  };
  profesor?: {
    id: string;
    user?: { id: string; username: string; nombre?: string; email?: string };
  };
}

export interface Alumno {
  id: string;
  username: string;
  status: string;
  aula: string;
  numeroClase: number;
}

export interface ProfesorInfo {
  id: string;
  userId?: string;
  username: string;
  nombre?: string;
  email?: string;
}

export const profesorService = {
  /**
   * Documentación en español.
   */
  async getAlumnos(): Promise<ApiResponse<Alumno[]>> {
    const response = await baseFetch('/profesores/alumnos');
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async getSlots(): Promise<ApiResponse<AlumnoSlot[]>> {
    const response = await baseFetch('/profesores/slots');
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async getAllSlots(): Promise<ApiResponse<AlumnoSlot[]>> {
    const response = await baseFetch('/profesores/all-slots');
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async getAllProfesores(): Promise<ApiResponse<ProfesorInfo[]>> {
    const response = await baseFetch('/profesores/all-profesores');
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async createSlot(data: {
    aula: string;
    numeroClase: number;
    capacidad: number;
    ubicacionId?: string;
  }): Promise<ApiResponse<AlumnoSlot>> {
    const response = await baseFetch('/profesores/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async adminCreateSlot(data: {
    aula: string;
    numeroClase: number;
    capacidad: number;
    profesorId: string;
    ubicacionId?: string;
  }): Promise<ApiResponse<AlumnoSlot>> {
    const response = await baseFetch('/profesores/admin/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async updateSlot(
    id: string,
    data: Partial<Omit<AlumnoSlot, 'id' | 'codigoSlot'>>
  ): Promise<ApiResponse<AlumnoSlot>> {
    const response = await baseFetch(`/profesores/slots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async adminUpdateSlot(
    id: string,
    data: Partial<Omit<AlumnoSlot, 'id' | 'codigoSlot'>> & {
      profesorId?: string;
    }
  ): Promise<ApiResponse<AlumnoSlot>> {
    const response = await baseFetch(`/profesores/admin/slots/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async deleteSlot(id: string): Promise<ApiResponse<void>> {
    const response = await baseFetch(`/profesores/slots/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async adminDeleteSlot(id: string): Promise<ApiResponse<void>> {
    const response = await baseFetch(`/profesores/admin/slots/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async activateAlumno(
    alumnoId: string
  ): Promise<ApiResponse<{ status: string; message: string }>> {
    const response = await baseFetch(
      `/profesores/alumnos/${alumnoId}/activate`,
      {
        method: 'PATCH',
      }
    );
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async forcePasswordReset(
    alumnoId: string
  ): Promise<ApiResponse<{ message: string; provisionalPassword?: string }>> {
    const response = await baseFetch(
      `/profesores/force-reset/alumno/${alumnoId}`,
      {
        method: 'PATCH',
      }
    );
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Documentación en español.
   */
  async removeStudent(id: string): Promise<ApiResponse<void>> {
    const response = await baseFetch(`/profesores/alumnos/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },
};
