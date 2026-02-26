import {
  Injectable,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from '../dto/register-user.dto';
import { LoginUserDto } from '../dto/login-user.dto';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';
import { rolUsuario } from '../../usuario/enums/usuario.enums';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource
  ) {}

  async register(dto: RegisterUserDto) {
    return await this.dataSource.transaction(async (manager) => {
      const existing = await manager.findOne(Usuario, {
        where: [{ username: dto.username }, { email: dto.email }],
      });

      if (existing) {
        throw new ConflictException(
          I18nHelper.getError('USER_OR_EMAIL_ALREADY_REGISTERED')
        );
      }

      const usuario = manager.create(Usuario, {
        ...dto,
        activo: false,
        rol: rolUsuario.INVITADO,
      });

      await manager.save(usuario);

      return this.generateToken(usuario);
    });
  }

  async login(dto: LoginUserDto) {
    const usuario = await this.usuarioRepo.findOne({
      where: { email: dto.email, activo: true },
    });

    if (!usuario || !(await bcrypt.compare(dto.password, usuario.password))) {
      throw new BadRequestException(I18nHelper.getError('INVALID_CREDENTIALS'));
    }

    return this.generateToken(usuario);
  }

  private generateToken(usuario: Usuario) {
    const payload: JwtPayload = {
      sub: usuario.id,
      nombre: usuario.nombre,
      role: usuario.rol,
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
