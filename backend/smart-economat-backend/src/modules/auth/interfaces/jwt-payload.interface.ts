import { rolUsuario } from '../../usuario/enums/usuario.enums';

export interface JwtPayload {
  sub: string;
  nombre: string;
  role: rolUsuario;
}
