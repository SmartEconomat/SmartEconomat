import { baseFetch, ApiResponse } from './api.service';

export interface AlumnoSlot {
  id: string;
  aula: string;
  numeroClase: number;
  capacidad: number;
  codigoSlot?: string;
}

export interface Alumno {
  id: string;
  username: string;
  status: string;
  aula: string;
  numeroClase: number;
}

export const profesorService = {
  /**
   * Obtiene los slots (aula y clase) creados por el profesor actual.
   */
  async getSlots(): Promise<ApiResponse<AlumnoSlot[]> & { status: number }> {
    const response = await baseFetch('/profesores/slots', { method: 'GET' });
    const data = await response.json();
    return { ...data, status: response.status };
  },

  /**
   * Crea un nuevo slot con capacidad de alumnos.
   */
  async createSlot(data: { aula: string; numeroClase: number; capacidad: number }): Promise<ApiResponse<AlumnoSlot> & { status: number }> {
    const response = await baseFetch('/profesores/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await response.json();
    return { ...result, status: response.status };
  },

  /**
   * Elimina un slot.
   */
  async deleteSlot(slotId: string): Promise<ApiResponse<void> & { status: number }> {
    const response = await baseFetch(`/profesores/slots/${slotId}`, { method: 'DELETE' });
    const data = await response.json();
    return { ...data, status: response.status };
  },

  /**
   * Obtiene la lista de alumnos vinculados al profesor.
   */
  async getAlumnos(): Promise<ApiResponse<Alumno[]> & { status: number }> {
    const response = await baseFetch('/profesores/alumnos', { method: 'GET' });
    const data = await response.json();
    return { ...data, status: response.status };
  },

  /**
   * Activa a un alumno.
   */
  async activateAlumno(alumnoId: string): Promise<ApiResponse<any> & { status: number }> {
    const response = await baseFetch(`/profesores/alumnos/${alumnoId}/activate`, {
      method: 'PATCH',
    });
    const data = await response.json();
    return { ...data, status: response.status };
  },

  /**
   * Fuerza el restablecimiento de contraseña de un alumno.
   */
  async forcePasswordReset(alumnoId: string): Promise<ApiResponse<{ message: string; provisionalPassword?: string }> & { status: number }> {
    const response = await baseFetch(`/profesores/alumnos/${alumnoId}/force-reset`, {
      method: 'POST',
    });
    const data = await response.json();
    return { ...data, status: response.status };
  },

  /**
   * Elimina/Desvincula a un alumno.
   */
  async removeStudent(alumnoId: string): Promise<ApiResponse<void> & { status: number }> {
    const response = await baseFetch(`/profesores/alumnos/${alumnoId}`, {
      method: 'DELETE',
    });
    const data = await response.json();
    return { ...data, status: response.status };
  },

  /**
   * Actualiza los permisos de un alumno.
   */
  async updateStudentPermissions(alumnoId: string, permissions: string[]): Promise<ApiResponse<void> & { status: number }> {
    const response = await baseFetch(`/profesores/alumnos/${alumnoId}/permissions`, {
      method: 'PATCH',
      body: JSON.stringify({ permissions }),
    });
    const data = await response.json();
    return { ...data, status: response.status };
  }
};
