import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { CreateProfesorDto } from '../../profesor/dto/create-profesor.dto';
import { rolUsuario, UserStatus } from '../../usuario/enums/usuario.enums';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(Profesor)
    private readonly profesorRepo: Repository<Profesor>,
    private readonly dataSource: DataSource
  ) {}

  async createProfesor(dto: CreateProfesorDto) {
    return this.dataSource.transaction(async (manager) => {
      const whereConditions: FindOptionsWhere<Usuario>[] = [
        { username: dto.username },
      ];
      if (dto.email) {
        whereConditions.push({ email: dto.email });
      }

      const isExisting = await manager.findOne(Usuario, {
        where: whereConditions,
      });

      if (isExisting)
        throw new ConflictException('User or email already exists');

      const isCialExisting = await manager.findOne(Profesor, {
        where: { cial: dto.cial },
      });
      if (isCialExisting) throw new ConflictException('Cial already exists');

      const passwordHash = await bcrypt.hash(dto.password, 10);

      const user = manager.create(Usuario, {
        username: dto.username,
        email: dto.email,
        password: passwordHash,
        rol: rolUsuario.PROFESOR,
        status: UserStatus.INACTIVE,
      });
      await manager.save(user);

      const profesor = manager.create(Profesor, {
        userId: user.id,
        cial: dto.cial,
      });
      await manager.save(profesor);

      return {
        id: profesor.id,
        user_id: user.id,
        username: user.username,
        cial: profesor.cial,
        status: user.status,
      };
    });
  }

  async activateUser(userId: string) {
    const user = await this.usuarioRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (user.status === UserStatus.ACTIVE) {
      throw new BadRequestException('User is already active');
    }

    user.status = UserStatus.ACTIVE;
    await this.usuarioRepo.save(user);

    return {
      message: 'User activated successfully',
      id: user.id,
      status: user.status,
    };
  }

  async forcePasswordReset(userId: string) {
    const user = await this.usuarioRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let provisionalPassword = '';
    const bytes = randomBytes(8);
    for (let i = 0; i < 8; i++) {
      provisionalPassword += chars[bytes[i] % chars.length];
    }

    user.password = provisionalPassword;
    user.mustChangePassword = true;
    user.passwordResetToken = null;
    user.passwordResetExpires = null;

    await this.usuarioRepo.save(user);

    return {
      message:
        'Contraseña restablecida exitosamente. Entregue esta clave provisional al usuario.',
      provisionalPassword,
      mustChangePassword: true,
    };
  }
}
