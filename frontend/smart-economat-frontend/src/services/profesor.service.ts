import { ApiResponse } from '../types/usuario';
import { ApiError, baseFetch, parseApiResponse } from './api.service';

const INVALID_SLOT_ID_TOKENS = new Set(['', 'undefined', 'null', 'nan']);

function resolveSlotIdOrThrow(id: string): string {
  const normalizedId = String(id ?? '').trim();
  if (INVALID_SLOT_ID_TOKENS.has(normalizedId.toLowerCase())) {
    throw new ApiError(
      'ID de slot inválido: la operación se canceló antes de enviar la petición.',
      400,
      { id }
    );
  }

  return encodeURIComponent(normalizedId);
}

async function parseProfesorResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<ApiResponse<T>> {
  const payload = await parseApiResponse<T>(response, fallbackMessage);
  return { ...payload, status: response.status };
}

/** Contrato de tipos público (AlumnoSlot). Contexto: smart-economat-frontend (SPA). */
export interface AlumnoSlot {
  id: string;
  aula: string;
  numeroClase: number;
  capacidad: number;
  codigoSlot?: string;
  profesorId?: string;
  profesor?: {
    id: string;
    user?: { id: string; username: string; nombre?: string; email?: string };
  };
}

/** Contrato de tipos público (Alumno). Contexto: smart-economat-frontend (SPA). */
export interface Alumno {
  id: string;
  username: string;
  status: string;
  aula: string;
  numeroClase: number;
}

/** Contrato de tipos público (ProfesorInfo). Contexto: smart-economat-frontend (SPA). */
export interface ProfesorInfo {
  id: string;
  userId?: string;
  username: string;
  nombre?: string;
  email?: string;
}

/** Servicio para la gestión de alumnos, slots de clase y profesores. */
export const profesorService = {
  /**
   * Obtiene la lista de alumnos asignados al profesor autenticado.
   */
  async getAlumnos(): Promise<ApiResponse<Alumno[]>> {
    const response = await baseFetch('/profesores/alumnos');
    return parseProfesorResponse<Alumno[]>(
      response,
      'No se pudieron cargar los alumnos.'
    );
  },

  /**
   * Recupera los slots de clase del profesor autenticado.
   */
  async getSlots(): Promise<ApiResponse<AlumnoSlot[]>> {
    const response = await baseFetch('/profesores/slots');
    return parseProfesorResponse<AlumnoSlot[]>(
      response,
      'No se pudieron cargar los slots.'
    );
  },

  /**
   * Recupera todos los slots de todos los profesores (vista de administrador).
   */
  async getAllSlots(): Promise<ApiResponse<AlumnoSlot[]>> {
    const response = await baseFetch('/profesores/all-slots');
    return parseProfesorResponse<AlumnoSlot[]>(
      response,
      'No se pudieron cargar todos los slots.'
    );
  },

  /**
   * Lista todos los profesores registrados (uso administrativo).
   */
  async getAllProfesores(): Promise<ApiResponse<ProfesorInfo[]>> {
    const response = await baseFetch('/profesores/all-profesores');
    return parseProfesorResponse<ProfesorInfo[]>(
      response,
      'No se pudieron cargar los profesores.'
    );
  },

  /**
   * Crea un nuevo slot de clase para el profesor autenticado.
   */
  async createSlot(data: {
    aula: string;
    numeroClase: number;
    capacidad: number;
  }): Promise<ApiResponse<AlumnoSlot>> {
    const response = await baseFetch('/profesores/slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseProfesorResponse<AlumnoSlot>(
      response,
      'No se pudo crear el slot.'
    );
  },

  /**
   * Crea un slot de clase en nombre de otro profesor (uso de admin).
   */
  async adminCreateSlot(data: {
    aula: string;
    numeroClase: number;
    capacidad: number;
    profesorId: string;
  }): Promise<ApiResponse<AlumnoSlot>> {
    const response = await baseFetch('/profesores/admin-slots', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return parseProfesorResponse<AlumnoSlot>(
      response,
      'No se pudo crear el slot de administrador.'
    );
  },

  /**
   * Actualiza los datos de un slot del profesor autenticado.
   */
  async updateSlot(
    id: string,
    data: Partial<Omit<AlumnoSlot, 'id' | 'codigoSlot'>>
  ): Promise<ApiResponse<AlumnoSlot>> {
    const slotId = resolveSlotIdOrThrow(id);
    const response = await baseFetch(`/profesores/slots/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return parseProfesorResponse<AlumnoSlot>(
      response,
      'No se pudo actualizar el slot.'
    );
  },

  /**
   * Actualiza los datos de un slot de otro profesor (uso de admin).
   */
  async adminUpdateSlot(
    id: string,
    data: Partial<Omit<AlumnoSlot, 'id' | 'codigoSlot'>> & {
      profesorId?: string;
    }
  ): Promise<ApiResponse<AlumnoSlot>> {
    const slotId = resolveSlotIdOrThrow(id);
    const response = await baseFetch(`/profesores/admin-slots/${slotId}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return parseProfesorResponse<AlumnoSlot>(
      response,
      'No se pudo actualizar el slot de administrador.'
    );
  },

  /**
   * Elimina un slot del profesor autenticado.
   */
  async deleteSlot(id: string): Promise<ApiResponse<void>> {
    const slotId = resolveSlotIdOrThrow(id);
    const response = await baseFetch(`/profesores/slots/${slotId}`, {
      method: 'DELETE',
    });
    return parseProfesorResponse<void>(
      response,
      'No se pudo eliminar el slot.'
    );
  },

  /**
   * Elimina un slot de otro profesor (uso de admin).
   */
  async adminDeleteSlot(id: string): Promise<ApiResponse<void>> {
    const slotId = resolveSlotIdOrThrow(id);
    const response = await baseFetch(`/profesores/admin-slots/${slotId}`, {
      method: 'DELETE',
    });
    return parseProfesorResponse<void>(
      response,
      'No se pudo eliminar el slot de administrador.'
    );
  },

  /**
   * Activa la cuenta de un alumno pendiente de aprobación.
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
    return parseProfesorResponse<{ status: string; message: string }>(
      response,
      'No se pudo activar el alumno.'
    );
  },

  /**
   * Fuerza el reset de contraseña de un alumno, generando una contraseña provisional.
   */
  async forcePasswordReset(
    alumnoId: string
  ): Promise<ApiResponse<{ message: string; provisionalPassword?: string }>> {
    const response = await baseFetch(
      `/profesores/alumnos/${alumnoId}/force-reset`,
      {
        method: 'POST',
      }
    );
    return parseProfesorResponse<{
      message: string;
      provisionalPassword?: string;
    }>(response, 'No se pudo restablecer la contraseña del alumno.');
  },

  /**
   * Elimina a un alumno del sistema.
   */
  async removeStudent(id: string): Promise<ApiResponse<void>> {
    const response = await baseFetch(`/profesores/alumnos/${id}`, {
      method: 'DELETE',
    });
    return parseProfesorResponse<void>(
      response,
      'No se pudo eliminar el alumno.'
    );
  },
};
