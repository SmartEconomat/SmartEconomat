import { rolUsuario } from '../enums/usuario.enums';

export class UsuarioMinimoDto {
  id: string;
  username: string;
  nombre: string | null;
  email: string | null;
  rol: rolUsuario;
}
