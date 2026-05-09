import { rolUsuario } from '../enums/usuario.enums';

/** Clase pública (UsuarioMinimoDto). Paquete: smart-economat-backend (Nest). */
export class UsuarioMinimoDto {
  id: string;
  username: string;
  nombre: string | null;
  email: string | null;
  rol: rolUsuario;
}
