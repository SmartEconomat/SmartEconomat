import { rolUsuario } from 'src/modules/usuario/enums/usuario.enums';

export interface JwtPayload {
  sub: string;
  nombre: string;
  role: rolUsuario;
}
