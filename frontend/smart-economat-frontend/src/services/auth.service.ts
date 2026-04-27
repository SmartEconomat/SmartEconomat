import { baseFetch, ApiResponse, parseApiResponse } from './api.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  requirePasswordChange?: boolean;
}

export interface CurrentUserResponse {
  id: string;
  username?: string;
  nombre?: string;
  name?: string;
  email: string;
  rol?: string;
  role?: string;
  permisos?: string[];
  idioma?: 'es' | 'en';
}

export interface User {
  id: string;
  name: string;
  email: string;
  rol: string;
  username?: string;
  permisos: string[];
  idioma: 'es' | 'en';
}

export interface RegisterAlumnoRequest {
  username: string;
  password: string;
  codigoClase: string;
}

export interface SlotReferenceResponse {
  codigoClase?: string;
  aula: string;
  numeroClase: number;
  profesor: string;
  cialProfesor?: string;
}

export interface RegisterProfesorRequest {
  username: string;
  password: string;
  email?: string;
  cial: string;
}

export interface ProfesorOption {
  cial: string;
  nombre: string;
}

export interface ResetPasswordRequest {
  token?: string;
  newPassword: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

type AuthMutationResponse = Record<string, unknown>;

export const authService = {
  async login(data: LoginRequest): Promise<ApiResponse<LoginResponse>> {
    const response = await baseFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    const result = await parseApiResponse<LoginResponse>(
      response,
      'Usuario o contraseña inválidos.'
    );

    return result;
  },

  async getCurrentUser(): Promise<User> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => {
      controller.abort();
    }, 10000);

    let response: Response;

    try {
      response = await baseFetch('/usuarios/perfil', {
        signal: controller.signal,
      });
    } catch (error: unknown) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new Error(
          'No se pudo validar la sesión a tiempo. Vuelve a intentarlo.'
        );
      }

      throw error;
    } finally {
      window.clearTimeout(timeoutId);
    }

    const result = await parseApiResponse<CurrentUserResponse>(
      response,
      'No se pudo obtener la información del usuario'
    );

    return {
      id: result.data.id,
      name:
        result.data.nombre ||
        result.data.name ||
        result.data.username ||
        result.data.email,
      email: result.data.email,
      rol: result.data.rol || result.data.role || 'usuario',
      username: result.data.username,
      permisos: result.data.permisos || [],
      idioma: result.data.idioma || 'es',
    };
  },

  async updateLanguage(idioma: 'es' | 'en'): Promise<void> {
    const response = await baseFetch('/usuarios/perfil', {
      method: 'PATCH',
      body: JSON.stringify({ idioma }),
    });

    await parseApiResponse(response, 'Error al actualizar el idioma');
  },

  async registerAlumno(
    data: RegisterAlumnoRequest
  ): Promise<ApiResponse<AuthMutationResponse>> {
    const response = await baseFetch('/alumnos/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await parseApiResponse(
      response,
      'No se pudo completar el registro del alumno.'
    );
  },

  async getSlotByCode(
    codigoClase: string
  ): Promise<ApiResponse<SlotReferenceResponse>> {
    const response = await baseFetch(
      `/alumnos/slots/${encodeURIComponent(codigoClase)}`
    );
    return await parseApiResponse(
      response,
      'No se pudo validar el código de la clase.'
    );
  },

  async registerProfesor(
    data: RegisterProfesorRequest
  ): Promise<ApiResponse<AuthMutationResponse>> {
    const response = await baseFetch('/profesores/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await parseApiResponse(
      response,
      'No se pudo completar el registro del profesor.'
    );
  },

  async getAulas(): Promise<ApiResponse<string[]>> {
    const response = await baseFetch('/alumnos/aulas');
    return await parseApiResponse(
      response,
      'No se pudieron obtener las aulas.'
    );
  },

  async getClases(aula: string): Promise<ApiResponse<number[]>> {
    const response = await baseFetch(
      `/alumnos/aulas/${encodeURIComponent(aula)}/clases`
    );
    return await parseApiResponse(
      response,
      'No se pudieron obtener las clases.'
    );
  },

  async getProfesores(
    aula: string,
    clase: number
  ): Promise<ApiResponse<ProfesorOption[]>> {
    const response = await baseFetch(
      `/alumnos/aulas/${encodeURIComponent(aula)}/clases/${clase}/profesores`
    );
    return await parseApiResponse(
      response,
      'No se pudieron obtener los profesores.'
    );
  },

  async forgotPassword(
    email: string
  ): Promise<ApiResponse<AuthMutationResponse>> {
    const response = await baseFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    return await parseApiResponse(
      response,
      'No se pudo procesar la recuperación de contraseña.'
    );
  },

  async resetPassword(
    data: ResetPasswordRequest
  ): Promise<ApiResponse<AuthMutationResponse>> {
    const response = await baseFetch('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await parseApiResponse(
      response,
      'No se pudo restablecer la contraseña.'
    );
  },

  async changePassword(
    data: ChangePasswordRequest
  ): Promise<ApiResponse<AuthMutationResponse>> {
    const response = await baseFetch('/auth/change-password', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return await parseApiResponse(
      response,
      'No se pudo cambiar la contraseña.'
    );
  },

  async updateProfile(data: {
    username: string;
    email?: string;
    idioma?: 'es' | 'en';
  }): Promise<void> {
    const response = await baseFetch('/usuarios/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    await parseApiResponse(response, 'Error al actualizar el perfil');
  },

  async logout(): Promise<void> {
    const response = await baseFetch('/auth/logout', {
      method: 'POST',
    });
    await parseApiResponse(response, 'Error al cerrar la sesión');
  },
};
