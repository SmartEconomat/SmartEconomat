import { baseFetch, ApiResponse, parseApiResponse } from './api.service';
import { getRolPrincipal } from '../sherlock-auth/system-roles.constants';

/** Contrato de tipos público (LoginRequest). Contexto: smart-economat-frontend (SPA). */
export interface LoginRequest {
  email: string;
  password: string;
}

/** Contrato de tipos público (LoginResponse). Contexto: smart-economat-frontend (SPA). */
export interface LoginResponse {
  access_token: string;
  requirePasswordChange?: boolean;
}

/** Contrato de tipos público (CurrentUserResponse). Contexto: smart-economat-frontend (SPA). */
export interface CurrentUserResponse {
  id: string;
  username?: string;
  nombre?: string;
  name?: string;
  email: string;
  /** Roles RBAC (M2M); el campo `rol` de la entidad puede quedar desactualizado. */
  roles?: Array<{ nombre: string }> | null;
  rol?: string;
  role?: string;
  permisos?: string[];
  idioma?: 'es' | 'en';
  ubicacionId?: string;
  ubicaciones?: Array<{ id: string; nombre: string }>;
  preferences?: Record<string, unknown>;
}

/** Contrato de tipos público (User). Contexto: smart-economat-frontend (SPA). */
export interface User {
  id: string;
  name: string;
  email: string;
  rol: string;
  username?: string;
  permisos: string[];
  idioma: 'es' | 'en';
  ubicacionId?: string;
  ubicaciones?: Array<{ id: string; nombre: string }>;
  preferences?: Record<string, unknown>;
}

/** Contrato de tipos público (RegisterAlumnoRequest). Contexto: smart-economat-frontend (SPA). */
export interface RegisterAlumnoRequest {
  username: string;
  password: string;
  codigoClase: string;
}

/** Contrato de tipos público (SlotReferenceResponse). Contexto: smart-economat-frontend (SPA). */
export interface SlotReferenceResponse {
  codigoClase?: string;
  aula: string;
  numeroClase: number;
  profesor: string;
  cialProfesor?: string;
}

/** Contrato de tipos público (RegisterProfesorRequest). Contexto: smart-economat-frontend (SPA). */
export interface RegisterProfesorRequest {
  username: string;
  password: string;
  email?: string;
  cial: string;
}

/** Contrato de tipos público (ProfesorOption). Contexto: smart-economat-frontend (SPA). */
export interface ProfesorOption {
  cial: string;
  nombre: string;
}

/** Contrato de tipos público (ResetPasswordRequest). Contexto: smart-economat-frontend (SPA). */
export interface ResetPasswordRequest {
  token?: string;
  newPassword: string;
}

/** Contrato de tipos público (ChangePasswordRequest). Contexto: smart-economat-frontend (SPA). */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

type AuthMutationResponse = Record<string, unknown>;

/**
 * Servicio encargado de la gestión de identidad y accesos.
 * Proporciona métodos para el inicio/cierre de sesión, gestión de perfiles,
 * registro de usuarios con roles específicos y recuperación de credenciales.
 */
export const authService = {
  /**
   * Autentica a un usuario mediante sus credenciales.
   * El token JWT se gestiona automáticamente mediante cookies httpOnly.
   * @param data Credenciales de acceso (email y password).
   * @returns Respuesta con el token y estado de cambio de contraseña requerido.
   */
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

  /**
   * Recupera la información del perfil del usuario actualmente autenticado.
   * Normaliza los campos de nombre y rol para asegurar consistencia en la UI.
   * @returns Datos del usuario mapeados al modelo `User`.
   * @throws Error Si la validación de sesión excede el tiempo de espera o falla.
   */
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

    const resolvedRol = getRolPrincipal(
      result.data.roles ?? null,
      result.data.rol ?? result.data.role ?? null
    );

    return {
      id: result.data.id,
      name:
        result.data.nombre ||
        result.data.name ||
        result.data.username ||
        result.data.email,
      email: result.data.email,
      rol: resolvedRol || result.data.rol || result.data.role || 'usuario',
      username: result.data.username,
      permisos: result.data.permisos || [],
      idioma: result.data.idioma || 'es',
      ubicacionId: result.data.ubicacionId,
      ubicaciones: Array.isArray(result.data.ubicaciones)
        ? result.data.ubicaciones
        : [],
      preferences: result.data.preferences || {},
    };
  },

  /**
   * Actualiza el idioma de preferencia del usuario en el servidor.
   * @param idioma Código de idioma ('es' o 'en').
   */
  async updateLanguage(idioma: 'es' | 'en'): Promise<void> {
    const response = await baseFetch('/usuarios/perfil', {
      method: 'PATCH',
      body: JSON.stringify({ idioma }),
    });

    await parseApiResponse(response, 'Error al actualizar el idioma');
  },

  /**
   * Registra un nuevo alumno vinculándolo a una clase mediante un código.
   * @param data Datos de registro del alumno.
   */
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

  /**
   * Obtiene la información de una clase (aula, profesor) a partir de su código.
   * @param codigoClase Código identificador de la clase/slot.
   */
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

  /**
   * Registra un nuevo profesor en el sistema.
   * @param data Datos de registro del profesor.
   */
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

  /**
   * Obtiene la lista de profesores asignados a un aula y clase específica.
   * @param aula Nombre del aula.
   * @param clase Número de clase.
   */
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

  /**
   * Cierra la sesión activa del usuario, invalidando las cookies en el servidor.
   */
  async logout(): Promise<void> {
    const response = await baseFetch('/auth/logout', {
      method: 'POST',
    });
    await parseApiResponse(response, 'Error al cerrar la sesión');
  },
};
