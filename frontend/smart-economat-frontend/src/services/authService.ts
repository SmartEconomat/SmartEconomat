import { baseFetch, parseApiResponse } from './api.service';
import { User } from '../store/auth.types';

interface CurrentUserResponse {
  id: string;
  username?: string;
  nombre?: string;
  name?: string;
  email: string;
  rol?: string;
  role?: string;
  permisos?: string[];
}

/**
 * Servicio de autenticación para gestionar el perfil del usuario.
 */
export const authService = {
  /**
   * Obtiene los datos del usuario actual.
   * @returns {Promise<User>}
   */
  async getCurrentUser(): Promise<User> {
    const response = await baseFetch('/usuarios/perfil');
    const result = await parseApiResponse<CurrentUserResponse>(
      response,
      'No se pudo obtener la información del usuario'
    );

    // Adaptar al formato esperado por el frontend
    return {
      id: result.data.id,
      name:
        result.data.username ||
        result.data.nombre ||
        result.data.name ||
        result.data.email,
      email: result.data.email,
      rol: result.data.rol || result.data.role || 'usuario',
      username: result.data.username,
      permisos: result.data.permisos || [],
    };
  },

  /**
   * Actualiza los datos básicos del perfil.
   * @param {Partial<User>} data - Datos a actualizar (nombre, etc).
   */
  async updateProfile(data: {
    username: string;
    email?: string;
  }): Promise<void> {
    const response = await baseFetch('/usuarios/perfil', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    await parseApiResponse(response, 'Error al actualizar el perfil');
  },

  /**
   * Cambia la contraseña del usuario.
   * @param {string} currentPassword - Contraseña actual.
   * @param {string} newPassword - Nueva contraseña.
   */
  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const response = await baseFetch('/usuarios/perfil/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword: currentPassword, newPassword }),
    });

    await parseApiResponse(response, 'Error al cambiar la contraseña');
  },
};
