import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Profesor } from '../profesor.entity/profesor.entity';
import { AlumnoSlot } from '../profesor.entity/alumno-slot.entity';
import { rolUsuario, UserStatus } from '../../usuario/enums/usuario.enums';
import { CreateSlotDto } from '../dto/create-slot.dto';
import { CreateProfesorDto } from '../dto/create-profesor.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { I18nHelper } from '../../../common/helpers/i18n.helper';

@Injectable()
export class ProfesorService {
  constructor(
    @InjectRepository(Profesor)
    private readonly profesorRepo: Repository<Profesor>,
    @InjectRepository(AlumnoSlot)
    private readonly slotRepo: Repository<AlumnoSlot>,
    private readonly dataSource: DataSource
  ) {}

  async register(dto: CreateProfesorDto) {
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
        throw new ConflictException(I18nHelper.getError('USER_OR_EMAIL_ALREADY_EXISTS'));

      const isCialExisting = await manager.findOne(Profesor, {
        where: { cial: dto.cial },
      });
      if (isCialExisting) throw new ConflictException(I18nHelper.getError('CIAL_ALREADY_EXISTS'));

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
        user,
        cial: dto.cial,
      });
      await manager.save(profesor);

      return {
        message: I18nHelper.getSuccess('PROFESSOR_REGISTERED_WAITING_ACTIVATION'),
        id: profesor.id,
        username: user.username,
      };
    });
  }

  async createSlot(userId: string, dto: CreateSlotDto) {
    const profesor = await this.profesorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!profesor) {
      throw new NotFoundException(I18nHelper.getError('PROFESSOR_PROFILE_NOT_FOUND'));
    }

    const existingSlot = await this.slotRepo.findOne({
      where: {
        profesor: { id: profesor.id },
        aula: dto.aula,
        numeroClase: dto.numeroClase,
      },
    });

    if (existingSlot) {
      throw new ConflictException(
        I18nHelper.getError('SLOT_ALREADY_EXISTS')
      );
    }

    const slot = this.slotRepo.create({
      profesor,
      aula: dto.aula,
      numeroClase: dto.numeroClase,
    });

    return this.slotRepo.save(slot);
  }

  async activateAlumno(profesorUserId: string, alumnoId: string) {
    return this.dataSource.transaction(async (manager) => {
      const profesor = await manager.findOne(Profesor, {
        where: { user: { id: profesorUserId } },
      });
      if (!profesor) throw new NotFoundException(I18nHelper.getError('PROFESSOR_NOT_FOUND'));

      const alumno = await manager.findOne(Alumno, {
        where: { id: alumnoId, slot: { profesor: { id: profesor.id } } },
        relations: ['user', 'slot', 'slot.profesor'],
      });

      if (!alumno)
        throw new NotFoundException(
          I18nHelper.getError('STUDENT_NOT_BELONGS_TO_PROFESSOR')
        );

      alumno.user.status = UserStatus.ACTIVE;
      await manager.save(alumno.user);

      return { message: I18nHelper.getSuccess('STUDENT_ACTIVATED') };
    });
  }

  async getAlumnos(profesorUserId: string) {
    const profesor = await this.profesorRepo.findOne({
      where: { user: { id: profesorUserId } },
    });

    if (!profesor) throw new NotFoundException(I18nHelper.getError('PROFESSOR_NOT_FOUND'));

    const result = await this.dataSource.getRepository(Alumno).find({
      where: { slot: { profesor: { id: profesor.id } } },
      relations: ['user', 'slot'],
    });

    return result.map((alumno) => ({
      id: alumno.id,
      username: alumno.user.username,
      status: alumno.user.status,
      aula: alumno.slot.aula,
      numeroClase: alumno.slot.numeroClase,
    }));
  }

  async forcePasswordReset(profesorUserId: string, alumnoId: string) {
    const profesor = await this.profesorRepo.findOne({
      where: { user: { id: profesorUserId } },
    });
    if (!profesor) throw new NotFoundException(I18nHelper.getError('PROFESSOR_NOT_FOUND'));

    const alumno = await this.dataSource.getRepository(Alumno).findOne({
      where: { id: alumnoId, slot: { profesor: { id: profesor.id } } },
      relations: ['user', 'slot', 'slot.profesor'],
    });

    if (!alumno) {
      throw new NotFoundException(
        I18nHelper.getError('STUDENT_NOT_BELONGS_TO_PROFESSOR')
      );
    }

    const chars =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let provisionalPassword = '';
    const bytes = randomBytes(8);
    for (let i = 0; i < 8; i++) {
      provisionalPassword += chars[bytes[i] % chars.length];
    }

    alumno.user.password = provisionalPassword;
    alumno.user.mustChangePassword = true;
    alumno.user.passwordResetToken = null;
    alumno.user.passwordResetExpires = null;

    await this.dataSource.getRepository(Usuario).save(alumno.user);

    return {
      message: I18nHelper.getSuccess('PASSWORD_RESET_PROVISIONAL'),
      provisionalPassword,
      mustChangePassword: true,
    };
  }
}
