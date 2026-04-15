import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { UserStatus } from '../../usuario/enums/usuario.enums';
import { getRolPrincipal } from '../../sherlock-auth/utils/access.utils';
import type { Request } from 'express';

/**
 * Extracts the JWT access token from the HTTP-only `access_token` cookie.
 * Returns null when no cookie is present so PassportStrategy can fall back
 * to the Authorization header extractor.
 *
 * @param {Request} req - Incoming Express request.
 * @returns {string | null} Raw JWT string or null if the cookie is absent.
 */
const cookieExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['access_token'];
  }
  return token;
};

/**
 * Passport strategy that validates JWT tokens for the application.
 * Accepts tokens from both the `Authorization: Bearer <token>` header
 * and the `access_token` HTTP-only cookie.
 * On successful validation it enriches the request with the user's id,
 * username and resolved principal role.
 *
 * @class JwtStrategy
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  /**
   * Called by Passport after the JWT signature and expiry have been verified.
   * Loads the full user record from the database to confirm the account is still active.
   *
   * @param {JwtPayload} payload - Decoded JWT payload containing `sub`, `username` and `role`.
   * @returns {Promise<{ id: string; username: string; rol: string }>} Minimal user object attached to `req.user`.
   * @throws {UnauthorizedException} When the user no longer exists or is not in ACTIVE status.
   */
  async validate(payload: JwtPayload) {
    const user = await this.usuarioRepo.findOne({
      where: { id: payload.sub, status: UserStatus.ACTIVE },
      relations: ['roles'],
    });

    if (!user) throw new UnauthorizedException();

    return {
      id: user.id,
      username: user.username,
      rol: getRolPrincipal(user.roles, user.rol),
    };
  }
}
