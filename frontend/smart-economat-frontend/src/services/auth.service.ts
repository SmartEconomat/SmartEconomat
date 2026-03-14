import { baseFetch, ApiResponse, parseApiResponse } from './api.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  requirePasswordChange?: boolean;
}

export interface RegisterAlumnoRequest {
  username: string;
  password: string;
  aula: string;
  numeroClase: number;
  cialProfesor: string;
}

export interface RegisterProfesorRequest {
  username: string;
  password: string;
  email?: string;
  cial: string;
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
    return await parseApiResponse(response, 'No se pudo iniciar sesión.');
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
      method: 'POST',
      body: JSON.stringify(data),
    });
    return await parseApiResponse(
      response,
      'No se pudo cambiar la contraseña.'
    );
  },
};
