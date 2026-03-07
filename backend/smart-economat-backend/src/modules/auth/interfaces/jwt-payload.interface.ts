import { rolUsuario } from '../../usuario/enums/usuario.enums';

export interface JwtPayload {
  sub: string;
  username: string;
  role: rolUsuario;
}
