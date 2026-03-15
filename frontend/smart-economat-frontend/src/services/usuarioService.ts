import {
  Usuario,
  CrearUsuarioDTO,
  ActualizarUsuarioDTO,
  PaginatedResponse,
  ApiResponse,
} from '../types/usuario';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const DEFAULT_TEMP_PASSWORD = 'Temp1234!';

// Mapeo temporal para adaptar el formato del frontend al backend
const mapFrontendToBackend = (
  data: Partial<CrearUsuarioDTO>,
  isUpdate = false
): Record<string, unknown> => {
  const mapped: Record<string, unknown> = { ...data };

  // Map Rol
  if (mapped.rol) {
    let r = (mapped.rol as string).toUpperCase();
    if (r === 'ADMINISTRADOR') r = 'ADMIN';
    mapped.rol = r;
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

  return mapped;
};

const mapBackendToFrontend = (user: Record<string, unknown>): Usuario => {
  let rolUpper = 'Alumno';
  const backendRol = (user.rol as string | undefined)?.toUpperCase();
  if (backendRol === 'ADMIN' || backendRol === 'ADMINISTRADOR')
    rolUpper = 'Administrador';
  if (backendRol === 'PROFESOR') rolUpper = 'Profesor';

  return {
    id: (user.id as string | number) || 0,
    username: user.username as string,
    email: user.email as string,
    rol: rolUpper as Usuario['rol'],
    estado:
      user.status === 'ACTIVE' || user.estado === 'Activo' || user.activo
        ? 'Activo'
        : 'Inactivo',
    fecha_registro: (user.createdAt as string) || new Date().toISOString(),
  };
};

export const usuarioService = {
  async getUsuarios(
    page: number = 1,
    limit: number = 10,
    search?: string,
    filterRol?: string,
    sortBy?: string,
    sortOrder?: 'asc' | 'desc'
  ): Promise<PaginatedResponse<Usuario>> {
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });

      if (search?.trim()) params.set('searchTerm', search.trim());
      if (filterRol && filterRol !== 'Todos') params.set('rol', filterRol);
      if (sortBy) params.set('sortBy', sortBy);
      if (sortOrder) params.set('order', sortOrder.toUpperCase());

      const response = await fetch(`${API_URL}/usuarios?${params.toString()}`, {
        headers: getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      const payload = result.data;

      const rawList: unknown[] = Array.isArray(payload?.data)
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
        total: payload?.total ?? mappedData.length,
        page: payload?.page ?? page,
        pageSize: payload?.limit ?? limit,
        totalPages: payload?.totalPages ?? 1,
      };
    } catch (error) {
      console.error('Error al obtener usuarios', error);
      throw error;
    }
  },

  async crearUsuario(data: CrearUsuarioDTO): Promise<ApiResponse<Usuario>> {
    const payload = mapFrontendToBackend(data);
    try {
      const response = await fetch(`${API_URL}/usuarios`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al crear usuario');
      }
      const result = await response.json();
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
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al actualizar usuario');
      }
      const result = await response.json();
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

  async eliminarUsuario(id: string | number): Promise<ApiResponse<null>> {
    try {
      const response = await fetch(`${API_URL}/usuarios/${id}`, {
        method: 'DELETE',
        headers: getHeaders(),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al eliminar usuario');
      }
      const result = await response.json();
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
      const response = await fetch(`${API_URL}/usuarios/${id}/password`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify({ password: randomPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Error al restablecer contraseña');
      }
      const result = await response.json();
      return {
        data: randomPassword,
        status: response.status,
        message: result.message || 'Contraseña restablecida exitosamente',
      };
    } catch (error) {
      console.error('Error al restablecer contraseña', error);
      throw error;
    }
  },
};
