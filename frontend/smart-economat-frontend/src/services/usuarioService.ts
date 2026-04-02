import {
  Usuario,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
  PaginatedResponse,
  ApiResponse,
  RolOption,
  Permiso,
} from '../types/usuario';
import { ApiError, baseFetch, parseApiResponse } from './api.service';

const DEFAULT_TEMP_PASSWORD = 'Temp1234!';
const BACKEND_DEFAULT_PAGE_LIMIT = 20;
const BACKEND_MAX_PAGE_LIMIT = 50;

// Mapeo temporal para adaptar el formato del frontend al backend
const mapFrontendToBackend = (
  data: Partial<CrearUsuarioDTO>,
  isUpdate = false
): Record<string, unknown> => {
  const mapped: Record<string, unknown> = { ...data };

  // Map Rol (Asegurar upper case para compatibilidad con backend DB pero permitir nombres dinámicos)
  if (mapped.rol) {
    mapped.rol = (mapped.rol as string).toUpperCase();
  }

  // Map Status
  if (mapped.estado) {
    mapped.status = mapped.estado === 'Activo' ? 'ACTIVE' : 'INACTIVE';
    delete mapped.estado;
  }

  // Handle empty email
  if (mapped.email === '') {
    mapped.email = null;
  }

  if (isUpdate) {
    delete mapped.password;
  } else if (!mapped.password) {
    mapped.password = DEFAULT_TEMP_PASSWORD;
  }

  // Remove extra fields that are not in backend DTOs
  delete mapped.activo;
  delete mapped.id;
  delete mapped.fecha_registro;
  delete mapped.roleId;
  delete mapped.roleName;
  delete mapped.permisosAdicionalesIds;
  delete mapped.permisosExcluidosIds;

  return mapped;
};

const mapBackendToFrontend = (user: Record<string, unknown>): Usuario => {
  const dynamicRoles = Array.isArray(user.roles)
    ? (user.roles as Array<Record<string, unknown>>)
    : [];
  const primaryRole = dynamicRoles[0];
  const backendRol =
    (primaryRole?.nombre as string | undefined) ||
    (user.rol as string | undefined);
  const rolName = backendRol || 'Alumno';

  const backendStatus = (user.status as string | undefined)?.toUpperCase();
  const isActiveFromStatus = backendStatus === 'ACTIVE';
  const isInactiveFromStatus = backendStatus === 'INACTIVE';
  const fallbackActivo = Boolean(user.activo);

  return {
    id: (user.id as string | number) || 0,
    username: user.username as string,
    nombre: user.nombre as string | undefined,
    email: user.email as string,
    rol: rolName,
    roleId: primaryRole?.id as string | undefined,
    roleName: primaryRole?.nombre as string | undefined,
    estado: isActiveFromStatus
      ? 'Activo'
      : isInactiveFromStatus
        ? 'Inactivo'
        : fallbackActivo || user.estado === 'Activo'
          ? 'Activo'
          : 'Inactivo',
    fecha_registro: (user.createdAt as string) || new Date().toISOString(),
    permisosAdicionales: (user.permisosAdicionales as Permiso[]) || [],
    permisosExcluidos: (user.permisosExcluidos as Permiso[]) || [],
    slotId: user.slotId as string | undefined,
    ubicacionId: user.ubicacionId as string | undefined,
  };
};

export const usuarioService = {
  async getRoles(): Promise<ApiResponse<RolOption[]>> {
    const response = await baseFetch('/admin/roles');
    const result = await parseApiResponse<RolOption[]>(
      response,
      'No se pudieron obtener los roles disponibles'
    );

    return {
      data: result.data,
      status: response.status,
      message: result.message,
    };
  },

  async getPermissions(): Promise<ApiResponse<Permiso[]>> {
    const response = await baseFetch('/admin/permissions');
    const result = await parseApiResponse<Permiso[]>(
      response,
      'No se pudieron obtener los permisos disponibles'
    );

    return {
      data: result.data,
      status: response.status,
      message: result.message,
    };
  },

  async getUsuarioById(id: string | number): Promise<ApiResponse<Usuario>> {
    const response = await baseFetch(`/usuarios/${id}`);
    const result = await parseApiResponse<Record<string, unknown>>(
      response,
      'No se pudo obtener el detalle del usuario'
    );

    return {
      data: mapBackendToFrontend(result.data),
      status: response.status,
      message: result.message,
    };
  },

  async getUsuarios(
    page: number = 1,
    limit: number = BACKEND_DEFAULT_PAGE_LIMIT,
    search?: string,
    filterRol?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc',
    filterEstado?: string
  ): Promise<PaginatedResponse<Usuario>> {
    try {
      const safeLimit = Math.min(Math.max(1, limit), BACKEND_MAX_PAGE_LIMIT);

      const params = new URLSearchParams({
        page: String(page),
        limit: String(safeLimit),
      });

      if (search?.trim()) params.set('searchTerm', search.trim());
      if (filterRol && filterRol !== 'Todos') params.set('rol', filterRol);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('order', sortOrder.toUpperCase());
      if (filterEstado?.trim()) params.set('estado', filterEstado.trim());

      const response = await baseFetch(`/usuarios?${params.toString()}`);
      const result = await parseApiResponse<Record<string, unknown>>(
        response,
        'Error al obtener usuarios'
      );
      const payload = result.data as
        | {
            data?: unknown[];
            total?: number;
            page?: number;
            limit?: number;
            totalPages?: number;
          }
        | unknown[];

      const rawList: unknown[] =
        !Array.isArray(payload) && Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
            ? payload
            : [];

      const mappedData = (rawList as Record<string, unknown>[]).map(
        mapBackendToFrontend
      );

      return {
        data: mappedData,
        status: response.status,
        total: !Array.isArray(payload)
          ? (payload?.total ?? mappedData.length)
          : mappedData.length,
        page: !Array.isArray(payload) ? (payload?.page ?? page) : page,
        pageSize: !Array.isArray(payload)
          ? (payload?.limit ?? safeLimit)
          : safeLimit,
        totalPages: !Array.isArray(payload) ? (payload?.totalPages ?? 1) : 1,
      };
    } catch (error) {
      console.error('Error al obtener usuarios', error);
      throw error;
    }
  },

  async crearUsuario(data: CrearUsuarioDTO): Promise<ApiResponse<Usuario>> {
    const payload = mapFrontendToBackend(data);
    try {
      const response = await baseFetch('/usuarios', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const result = await parseApiResponse<Record<string, unknown>>(
        response,
        'Error al crear usuario'
      );
      return {
        data: mapBackendToFrontend(result.data),
        status: response.status,
        message: result.message || 'Usuario creado exitosamente',
      };
    } catch (error) {
      console.error('Error al crear usuario', error);
      throw error;
    }
  },

  async actualizarUsuario(
    id: string | number,
    data: ActualizarUsuarioDTO
  ): Promise<ApiResponse<Usuario>> {
    const payload = mapFrontendToBackend(data, true);
    delete payload.roleName;
    try {
      const response = await baseFetch(`/usuarios/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const result = await parseApiResponse<Record<string, unknown>>(
        response,
        'Error al actualizar usuario'
      );
      return {
        data: mapBackendToFrontend(result.data),
        status: response.status,
        message: result.message || 'Usuario actualizado exitosamente',
      };
    } catch (error) {
      console.error('Error al actualizar usuario', error);
      throw error;
    }
  },

  async updateUserRole(
    id: string | number,
    roleId: string,
    permisosAdicionalesIds?: string[],
    permisosExcluidosIds?: string[]
  ): Promise<ApiResponse<Usuario>> {
    const response = await baseFetch(`/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({
        roleId,
        permisosAdicionalesIds,
        permisosExcluidosIds,
      }),
    });

    const result = await parseApiResponse<Record<string, unknown>>(
      response,
      'Error al actualizar el rol del usuario'
    );

    return {
      data: mapBackendToFrontend(result.data),
      status: response.status,
      message: result.message || 'Privilegios actualizados correctamente',
    };
  },

  async setUserActivation(
    id: string | number,
    active: boolean
  ): Promise<ApiResponse<{ status: string; activo: boolean }>> {
    const response = await baseFetch(`/admin/users/${id}/activate`, {
      method: 'PATCH',
      body: JSON.stringify({ active }),
    });

    const result = await parseApiResponse<{ status: string; activo: boolean }>(
      response,
      'Error al actualizar el estado del usuario'
    );

    return {
      data: result.data,
      status: response.status,
      message: result.message,
    };
  },

  async eliminarUsuario(id: string | number): Promise<ApiResponse<null>> {
    try {
      const response = await baseFetch(`/usuarios/${id}`, {
        method: 'DELETE',
      });

      const result = await parseApiResponse<unknown>(
        response,
        'Error al eliminar usuario'
      );
      return {
        data: null,
        status: response.status,
        message: result.message || 'Usuario eliminado exitosamente',
      };
    } catch (error) {
      console.error('Error al eliminar usuario', error);
      throw error;
    }
  },

  async resetPassword(id: string | number): Promise<ApiResponse<string>> {
    const characters =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    const generateRandomPassword = () => {
      let pass = '';
      // Asegurar al menos uno de cada tipo para validación del backend
      pass += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
      pass += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
      pass += '0123456789'[Math.floor(Math.random() * 10)];
      pass += '!@#$%^&*'[Math.floor(Math.random() * 8)];

      for (let i = 0; i < 6; i++) {
        pass += characters[Math.floor(Math.random() * characters.length)];
      }
      // Barajar
      return pass
        .split('')
        .sort(() => 0.5 - Math.random())
        .join('');
    };

    const randomPassword = generateRandomPassword();

    try {
      const response = await baseFetch(`/usuarios/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password: randomPassword }),
      });

      const result = await parseApiResponse<unknown>(
        response,
        'Error al restablecer contraseña'
      );
      return {
        data: randomPassword,
        status: response.status,
        message: result.message || 'Contraseña restablecida exitosamente',
      };
    } catch (error) {
      console.error('Error al restablecer contraseña', error);
      if (error instanceof ApiError) {
        throw new Error(error.message);
      }
      throw error;
    }
  },
};
