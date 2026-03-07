import { Usuario, CrearUsuarioDTO, ActualizarUsuarioDTO, PaginatedResponse, ApiResponse } from '../types/usuario';

const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

const getHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
    };
};

// Mapeo temporal para adaptar el formato del frontend al backend
const mapFrontendToBackend = (data: Partial<CrearUsuarioDTO>, isUpdate = false) => {
    const mapped: any = { ...data };

    // Map Rol
    if (mapped.rol) {
        let r = mapped.rol.toUpperCase();
        if (r === 'ADMINISTRADOR') r = 'ADMIN';
        mapped.rol = r;
    }

    // Map Status
    if (mapped.estado) {
        mapped.status = (mapped.estado === 'Activo') ? 'ACTIVE' : 'INACTIVE';
        delete mapped.estado;
    }

    if (isUpdate) {
        delete mapped.password;
    } else if (!mapped.password) {
        mapped.password = '123456';
    }

    // Remove extra fields that are not in backend DTOs
    delete mapped.activo;
    delete mapped.id;
    delete mapped.fecha_registro;

    return mapped;
};

const mapBackendToFrontend = (user: any): Usuario => {
    let rolUpper = 'Alumno';
    const backendRol = user.rol?.toUpperCase();
    if (backendRol === 'ADMIN' || backendRol === 'ADMINISTRADOR') rolUpper = 'Administrador';
    if (backendRol === 'PROFESOR') rolUpper = 'Profesor';

    return {
        id: user.id || 0,
        username: user.username,
        email: user.email,
        rol: rolUpper as any,
        estado: (user.status === 'ACTIVE' || user.estado === 'Activo' || user.activo) ? 'Activo' : 'Inactivo',
        fecha_registro: user.createdAt || new Date().toISOString()
    };
};

// Variables para MOCK en caso de error de red o auth (Backend inalcanzable)
let mockUsuarios: Usuario[] = [
    { id: 1, username: 'admin', email: 'admin@smarteconomat.com', rol: 'Administrador', estado: 'Activo', fecha_registro: new Date().toISOString() },
    { id: 2, username: 'profesor-demo', email: 'profesor@test.com', rol: 'Profesor', estado: 'Activo', fecha_registro: new Date().toISOString() },
    { id: 3, username: 'alumno-demo', email: 'alumno@demo.com', rol: 'Alumno', estado: 'Activo', fecha_registro: new Date().toISOString() }
];

export const usuarioService = {
    async getUsuarios(page: number = 1, limit: number = 10, search?: string, filterRol?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<PaginatedResponse<Usuario>> {
        let mappedData: Usuario[] = [];

        try {
            const response = await fetch(`${API_URL}/usuarios`, {
                headers: getHeaders()
            });

            if (!response.ok) {
                // Forzamos caer al catch si es 401 Unauthorized u otro error
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const result = await response.json();
            const payload = result.data;
            const rawList: unknown[] = Array.isArray(payload) ? payload : (Array.isArray(payload?.data) ? payload.data : []);
            mappedData = rawList.map(mapBackendToFrontend);
        } catch (error) {
            console.error('Error al obtener usuarios', error);
            throw error;
        }

        // Simulando paginación/búsqueda
        let filteredData = mappedData;

        if (search) {
            const lowerSearch = search.toLowerCase();
            filteredData = filteredData.filter((u: Usuario) =>
                (u.username?.toLowerCase() || '').includes(lowerSearch) ||
                (u.email?.toLowerCase() || '').includes(lowerSearch)
            );
        }

        if (filterRol && filterRol !== 'Todos') {
            filteredData = filteredData.filter((u: Usuario) => u.rol === filterRol);
        }

        if (sortBy) {
            filteredData.sort((a: any, b: any) => {
                let aValue = a[sortBy];
                let bValue = b[sortBy];

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';

                if (typeof aValue === 'string' && typeof bValue === 'string') {
                    return sortOrder === 'desc'
                        ? bValue.localeCompare(aValue, undefined, { numeric: true, sensitivity: 'base' })
                        : aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
                }

                if (aValue < bValue) return sortOrder === 'desc' ? 1 : -1;
                if (aValue > bValue) return sortOrder === 'desc' ? -1 : 1;
                return 0;
            });
        }

        const total = filteredData.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const startIndex = (page - 1) * limit;
        const paginatedData = filteredData.slice(startIndex, startIndex + limit);

        return {
            data: paginatedData,
            status: 200,
            total,
            page,
            pageSize: limit,
            totalPages
        };
    },

    async crearUsuario(data: CrearUsuarioDTO): Promise<ApiResponse<Usuario>> {
        const payload = mapFrontendToBackend(data);
        try {
            const response = await fetch(`${API_URL}/usuarios`, {
                method: 'POST',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al crear usuario');
            }
            const result = await response.json();
            return {
                data: mapBackendToFrontend(result.data),
                status: response.status,
                message: result.message || 'Usuario creado exitosamente'
            };
        } catch (error: any) {
            console.error('Error al crear usuario', error);
            throw error;
        }
    },

    async actualizarUsuario(id: string | number, data: ActualizarUsuarioDTO): Promise<ApiResponse<Usuario>> {
        const payload = mapFrontendToBackend(data, true);
        try {
            const response = await fetch(`${API_URL}/usuarios/${id}`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al actualizar usuario');
            }
            const result = await response.json();
            return {
                data: mapBackendToFrontend(result.data),
                status: response.status,
                message: result.message || 'Usuario actualizado exitosamente'
            };
        } catch (error: any) {
            console.error('Error al actualizar usuario', error);
            throw error;
        }
    },

    async eliminarUsuario(id: string | number): Promise<ApiResponse<null>> {
        try {
            const response = await fetch(`${API_URL}/usuarios/${id}`, {
                method: 'DELETE',
                headers: getHeaders()
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al eliminar usuario');
            }
            const result = await response.json();
            return {
                data: null,
                status: response.status,
                message: result.message || 'Usuario eliminado exitosamente'
            };
        } catch (error: any) {
            console.error('Error al eliminar usuario', error);
            throw error;
        }
    },

    async resetPassword(id: string | number): Promise<ApiResponse<string>> {
        const characters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
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
            return pass.split('').sort(() => 0.5 - Math.random()).join('');
        };

        const randomPassword = generateRandomPassword();

        try {
            const response = await fetch(`${API_URL}/usuarios/${id}/password`, {
                method: 'PATCH',
                headers: getHeaders(),
                body: JSON.stringify({ password: randomPassword })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error al restablecer contraseña');
            }
            const result = await response.json();
            return {
                data: randomPassword,
                status: response.status,
                message: result.message || 'Contraseña restablecida exitosamente'
            };
        } catch (error: any) {
            console.error('Error al restablecer contraseña', error);
            throw error;
        }
    }
};
