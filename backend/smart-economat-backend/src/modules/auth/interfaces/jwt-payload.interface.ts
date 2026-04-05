export interface JwtPayload {
  sub: string;
  username: string;
  /** Nombre del rol principal (resuelto desde M:M roles). */
  role: string;
}
