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
import { Usuario } from 'src/modules/usuario/usuario.entity/usuario.entity';

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
        throw new ConflictException('Usuario o email ya registrado');
      }

      const hashedPassword = await bcrypt.hash(dto.password, 10);

      const usuario = manager.create(Usuario, {
        ...dto,
        password: hashedPassword,
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
      throw new BadRequestException('Credenciales incorrectas');
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
