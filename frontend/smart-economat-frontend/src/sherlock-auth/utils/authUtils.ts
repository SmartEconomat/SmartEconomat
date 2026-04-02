import { User } from '../types';

interface BackendUser {
  id: string;
  name: string;
  email: string;
  rol: string;
  username: string;
  permisos?: string[];
  alumno?: {
    id: string;
    slot?: {
      id: string;
      aula: string;
      ubicacion?: { id: string; nombre: string };
    };
  };
  profesor?: {
    id: string;
    slots?: Array<{
      id: string;
      aula: string;
      ubicacion?: { id: string; nombre: string };
    }>;
  };
}

export const mapUserData = (userData: BackendUser): User => {
  return {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    rol: userData.rol,
    username: userData.username,
    permisos: userData.permisos || [],
    alumno: userData.alumno
      ? {
          id: userData.alumno.id,
          slot: userData.alumno.slot
            ? {
                id: userData.alumno.slot.id,
                aula: userData.alumno.slot.aula,
                ubicacion: userData.alumno.slot.ubicacion
                  ? {
                      id: userData.alumno.slot.ubicacion.id,
                      nombre: userData.alumno.slot.ubicacion.nombre,
                    }
                  : undefined,
              }
            : undefined,
        }
      : undefined,
    profesor: userData.profesor
      ? {
          id: userData.profesor.id,
          slots: (userData.profesor.slots || []).map((slot) => ({
            id: slot.id,
            aula: slot.aula,
            ubicacion: slot.ubicacion
              ? {
                  id: slot.ubicacion.id,
                  nombre: slot.ubicacion.nombre,
                }
              : undefined,
          })),
        }
      : undefined,
  };
};

export const saveSession = (userData: User) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

export const getSession = (): User | null => {
  const userStr = localStorage.getItem('user');
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch (e) {
    console.error('Error parsing session', e);
    return null;
  }
};
