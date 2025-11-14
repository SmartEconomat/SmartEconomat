export enum rolUsuario {
  ADMINISTRADOR = 'admin',
  PROFESOR = 'profesor',
  ALUMNO = 'alumno',
}

export const ROLES_DISPONIBLES: string[] = Object.values(rolUsuario);
