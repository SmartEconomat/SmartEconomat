/**
 * Shape del objeto `req.user` inyectado por JwtStrategy.validate()
 * en todos los controladores protegidos con JwtAuthGuard.
 */
export interface AuthenticatedUser {
  id: string;
  username: string;
  rol: string;
  idioma?: string;
}
