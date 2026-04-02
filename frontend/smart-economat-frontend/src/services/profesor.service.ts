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
   * Obtiene la lista de alumnos asignados a las aulas del profesor actual.
   */
  async getAlumnos(): Promise<ApiResponse<Alumno[]>> {
    const response = await baseFetch('/profesores/alumnos');
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Obtiene la lista de aulas (slots) del profesor actual.
   */
  async getSlots(): Promise<ApiResponse<AlumnoSlot[]>> {
    const response = await baseFetch('/profesores/slots');
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Obtiene TODAS las aulas del sistema. Solo para administradores.
   */
  async getAllSlots(): Promise<ApiResponse<AlumnoSlot[]>> {
    const response = await baseFetch('/profesores/all-slots');
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Obtiene la lista de todos los profesores. Solo para administradores.
   */
  async getAllProfesores(): Promise<ApiResponse<ProfesorInfo[]>> {
    const response = await baseFetch('/profesores/all-profesores');
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Crea una nueva aula para el profesor actual.
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
   * Crea una nueva aula asignada a un profesor específico. Solo administradores.
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
   * Actualiza los datos de un aula propia.
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
   * Actualiza los datos de cualquier aula. Solo administradores.
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
   * Elimina un aula propia.
   */
  async deleteSlot(id: string): Promise<ApiResponse<void>> {
    const response = await baseFetch(`/profesores/slots/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Elimina cualquier aula. Solo administradores.
   */
  async adminDeleteSlot(id: string): Promise<ApiResponse<void>> {
    const response = await baseFetch(`/profesores/admin/slots/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Cambia el estado de activación de un alumno.
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
   * Fuerza el restablecimiento de contraseña de un profesor. Solo administradores.
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
   * Elimina un alumno del slot asignado.
   */
  async removeStudent(id: string): Promise<ApiResponse<void>> {
    const response = await baseFetch(`/profesores/alumnos/${id}`, {
      method: 'DELETE',
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },
};
