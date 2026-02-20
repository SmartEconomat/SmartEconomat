import { rolUsuario } from '../../enums/usuario.enums';

export interface JwtPayload {
  sub: string;
  email: string;
  role: rolUsuario;
}
