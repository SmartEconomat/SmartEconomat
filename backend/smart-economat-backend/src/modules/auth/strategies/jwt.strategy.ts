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
 * Ejecuta la lógica de cookie extractor dentro del flujo de la aplicación.
 *
 * @param req Parámetro de entrada para la operación.
 * @returns Valor resultante de la operación.
 */
const cookieExtractor = (req: Request): string | null => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['access_token'];
  }
  return token;
};

/**
 * Representa jwt strategy en el sistema.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Construye la instancia configurada.
   * @undefined {Repository<Usuario>} usuarioRepo - Entrada efectiva esperada por el contrato.
   * @undefined {ConfigService<Record<string | symbol, unknown>, false>} configService - Entrada efectiva esperada por el contrato.
   */
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
   * Valida validate y aplica las reglas definidas.
   *
   * @param payload Parámetro de entrada para la operación.
   */
  /**
   * Expone "validate" en smart-economat-backend (Nest).
   * @undefined {JwtPayload} payload - Entrada efectiva esperada por el contrato.
   * @undefined {Promise<{ id: string; username: string; rol: string; idioma: import("/home/psych/projects/SmartEconomat/backend/smart-economat-backend/src/modules/usuario/enums/usuario.enums").UserLanguage; }>} Datos efectivos después de ejecutar la operación.
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
      idioma: user.idioma,
    };
  }
}
