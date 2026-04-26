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
 * Documentación en español.
 */
const cookieExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['access_token'];
  }
  return token;
};

/**
 * Documentación en español.
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
     * Documentación en español.
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
