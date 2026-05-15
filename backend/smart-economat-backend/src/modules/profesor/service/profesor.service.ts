import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOptionsWhere, Repository } from 'typeorm';
import { Profesor } from '../profesor.entity/profesor.entity';
import { AlumnoSlot } from '../profesor.entity/alumno-slot.entity';
import { rolUsuario, UserStatus } from '../../usuario/enums/usuario.enums';
import { CreateSlotDto } from '../dto/create-slot.dto';
import { CreateProfesorDto } from '../dto/create-profesor.dto';
import { UpdateSlotDto } from '../dto/update-slot.dto';
import { AdminCreateSlotDto } from '../dto/admin-create-slot.dto';
import { AdminUpdateSlotDto } from '../dto/admin-update-slot.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';

/**
 * Documentación en español.
 */
@Injectable()
export class ProfesorService {
  constructor(
    @InjectRepository(Profesor)
    private readonly profesorRepo: Repository<Profesor>,
    @InjectRepository(AlumnoSlot)
    private readonly slotRepo: Repository<AlumnoSlot>,
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService
  ) {}

  /**
   * Documentación en español.
   */
  async register(dto: CreateProfesorDto) {
    if (this.configService.get<string>('ALLOW_PUBLIC_REGISTER') !== 'true') {
      throw new ForbiddenException(
        I18nHelper.getError('PUBLIC_REGISTER_DISABLED')
      );
    }

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
        throw new ConflictException(
          I18nHelper.getError('USER_OR_EMAIL_ALREADY_EXISTS')
        );

      const cialUpper = dto.cial.toUpperCase();

      const isCialExisting = await manager.findOne(Profesor, {
        where: { cial: cialUpper },
      });
      if (isCialExisting)
        throw new ConflictException(I18nHelper.getError('CIAL_ALREADY_EXISTS'));

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const profesorRole = await manager.findOne(Rol, {
        where: { nombre: rolUsuario.PROFESOR },
      });

      const user = manager.create(Usuario, {
        username: dto.username,
        email: dto.email,
        password: passwordHash,
        rol: rolUsuario.PROFESOR,
        status: UserStatus.INACTIVE,
        activo: false,
        roles: profesorRole ? [profesorRole] : [],
      });
      await manager.save(user);

      const profesor = manager.create(Profesor, {
        user,
        cial: cialUpper,
      });
      await manager.save(profesor);

      return {
        message: I18nHelper.translate(
          'messages.PROFESOR_REGISTRADO_CON_XITO_ESPERANDO_A'
        ),
        id: profesor.id,
        username: user.username,
      };
    });
  }

  /**
   * Documentación en español.
   */
  async createSlot(userId: string, dto: CreateSlotDto) {
    const profesor = await this.profesorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!profesor) {
      throw new NotFoundException(
        I18nHelper.getError('PROFESSOR_PROFILE_NOT_FOUND')
      );
    }

    const existingSlot = await this.slotRepo.findOne({
      where: {
        profesor: { id: profesor.id },
        aula: dto.aula,
        numeroClase: dto.numeroClase,
      },
    });

    if (existingSlot) {
      throw new ConflictException(I18nHelper.getError('DUPLICATE_ENTRY'));
    }

    const codigoSlot = `AL-${randomBytes(3).toString('hex').toUpperCase()}`;

    const slot = this.slotRepo.create({
      profesor,
      aula: dto.aula,
      numeroClase: dto.numeroClase,
      capacidad: dto.capacidad ?? 1,
      codigoSlot,
    });

    return this.slotRepo.save(slot);
  }

  /**
   * Documentación en español.
   */
  async adminCreateSlot(dto: AdminCreateSlotDto) {
    const profesor = await this.profesorRepo.findOne({
      where: { id: dto.profesorId },
    });
    if (!profesor) {
      throw new NotFoundException(I18nHelper.getError('PROFESOR_NOT_FOUND'));
    }

    const existingSlot = await this.slotRepo.findOne({
      where: {
        profesor: { id: profesor.id },
        aula: dto.aula,
        numeroClase: dto.numeroClase,
      },
    });

    if (existingSlot) {
      throw new ConflictException(I18nHelper.getError('DUPLICATE_ENTRY'));
    }

    const codigoSlot = `AL-${randomBytes(3).toString('hex').toUpperCase()}`;

    const slot = this.slotRepo.create({
      profesor,
      aula: dto.aula,
      numeroClase: dto.numeroClase,
      capacidad: dto.capacidad ?? 1,
      codigoSlot,
    });

    return this.slotRepo.save(slot);
  }

  /**
   * Documentación en español.
   */
  async updateSlot(userId: string, slotId: string, dto: UpdateSlotDto) {
    const profesor = await this.profesorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!profesor) {
      throw new NotFoundException(
        I18nHelper.getError('PROFESSOR_PROFILE_NOT_FOUND')
      );
    }

    const slot = await this.slotRepo.findOne({
      where: { id: slotId, profesor: { id: profesor.id } },
    });

    if (!slot) {
      throw new NotFoundException(I18nHelper.getError('NOT_FOUND'));
    }

    if (
      (dto.aula && dto.aula !== slot.aula) ||
      (dto.numeroClase && dto.numeroClase !== slot.numeroClase)
    ) {
      const existing = await this.slotRepo.findOne({
        where: {
          profesor: { id: profesor.id },
          aula: dto.aula ?? slot.aula,
          numeroClase: dto.numeroClase ?? slot.numeroClase,
        },
      });
      if (existing && existing.id !== slotId) {
        throw new ConflictException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    Object.assign(slot, dto);
    return this.slotRepo.save(slot);
  }

  /**
   * Documentación en español.
   */
  async getSlots(userId: string) {
    const profesor = await this.profesorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!profesor) {
      throw new NotFoundException(
        I18nHelper.getError('PROFESSOR_PROFILE_NOT_FOUND')
      );
    }

    return this.slotRepo.find({
      where: { profesor: { id: profesor.id } },
      relations: ['alumnos', 'alumnos.user'],
      order: { aula: 'ASC', numeroClase: 'ASC' },
    });
  }

  /**
   * Documentación en español.
   */
  async deleteSlot(userId: string, slotId: string) {
    const profesor = await this.profesorRepo.findOne({
      where: { user: { id: userId } },
    });
    if (!profesor) {
      throw new NotFoundException(
        I18nHelper.getError('PROFESSOR_PROFILE_NOT_FOUND')
      );
    }

    const slot = await this.slotRepo.findOne({
      where: { id: slotId, profesor: { id: profesor.id } },
      relations: ['alumnos'],
    });

    if (!slot) {
      throw new NotFoundException(I18nHelper.getError('NOT_FOUND'));
    }

    if (slot.alumnos && slot.alumnos.length > 0) {
      throw new ConflictException(I18nHelper.getError('SLOT_HAS_STUDENTS'));
    }

    await this.slotRepo.remove(slot);
    return { message: I18nHelper.translate('success.DELETED') };
  }

  /**
   * Documentación en español.
   */
  async activateAlumno(profesorUserId: string, alumnoId: string) {
    return this.dataSource.transaction(async (manager) => {
      const profesor = await manager.findOne(Profesor, {
        where: { user: { id: profesorUserId } },
      });
      if (!profesor)
        throw new NotFoundException(I18nHelper.getError('PROFESOR_NOT_FOUND'));

      const alumno = await manager.findOne(Alumno, {
        where: { id: alumnoId, slot: { profesor: { id: profesor.id } } },
        relations: ['user', 'slot', 'slot.profesor'],
      });

      if (!alumno)
        throw new NotFoundException(
          'Alumno no pertenece a este profesor o no existe'
        );

      alumno.user.status = UserStatus.ACTIVE;
      alumno.user.activo = true;
      await manager.save(alumno.user);

      return {
        status: alumno.user.status,
        message: I18nHelper.translate('messages.ALUMNO_ACTIVADO_CORRECTAMENTE'),
      };
    });
  }

  /**
   * Documentación en español.
   */
  async getAlumnos(profesorUserId: string) {
    const profesor = await this.profesorRepo.findOne({
      where: { user: { id: profesorUserId } },
    });

    if (!profesor)
      throw new NotFoundException(I18nHelper.getError('PROFESOR_NOT_FOUND'));

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

  /**
   * Documentación en español.
   */
  async forcePasswordReset(profesorUserId: string, alumnoId: string) {
    if (!alumnoId || alumnoId === 'undefined') {
      throw new BadRequestException(I18nHelper.getError('INVALID_ALUMNO_ID'));
    }

    const profesor = await this.profesorRepo.findOne({
      where: { user: { id: profesorUserId } },
    });
    if (!profesor)
      throw new NotFoundException(I18nHelper.getError('PROFESOR_NOT_FOUND'));

    const alumno = await this.dataSource.getRepository(Alumno).findOne({
      where: { id: alumnoId, slot: { profesor: { id: profesor.id } } },
      relations: ['user', 'slot', 'slot.profesor'],
    });

    if (!alumno) {
      throw new NotFoundException(
        'Alumno no pertenece a este profesor o no existe'
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
    alumno.user.resetPasswordOtp = null;
    alumno.user.resetPasswordOtpExpires = null;

    await this.dataSource.getRepository(Usuario).save(alumno.user);

    return {
      message: I18nHelper.translate(
        'messages.CONTRASE_A_RESTABLECIDA_EXITOSAMENTE_ENT_1'
      ),
      provisionalPassword,
      mustChangePassword: true,
    };
  }

  /**
   * Documentación en español.
   */
  async getAllSlots() {
    return this.slotRepo.find({
      relations: ['profesor', 'profesor.user', 'alumnos'],
      order: { aula: 'ASC', numeroClase: 'ASC' },
    });
  }

  /**
   * Documentación en español.
   */
  async getAllProfesores() {
    const profesores = await this.profesorRepo.find({
      relations: ['user'],
      order: { user: { username: 'ASC' } },
    });
    return profesores.map((p) => ({
      id: p.id,
      userId: p.user?.id,
      username: p.user?.username,
      nombre: p.user?.nombre,
      email: p.user?.email,
    }));
  }

  /**
   * Documentación en español.
   */
  async adminUpdateSlot(slotId: string, dto: AdminUpdateSlotDto) {
    const slot = await this.slotRepo.findOne({
      where: { id: slotId },
      relations: ['profesor'],
    });

    if (!slot) {
      throw new NotFoundException(I18nHelper.getError('NOT_FOUND'));
    }

    if (dto.aula !== undefined) slot.aula = dto.aula;
    if (dto.numeroClase !== undefined) slot.numeroClase = dto.numeroClase;
    if (dto.capacidad !== undefined) slot.capacidad = dto.capacidad;

    if (dto.profesorId && dto.profesorId !== slot.profesor?.id) {
      const newProfesor = await this.profesorRepo.findOne({
        where: { id: dto.profesorId },
      });
      if (!newProfesor) {
        throw new NotFoundException(I18nHelper.getError('PROFESOR_NOT_FOUND'));
      }
      slot.profesor = newProfesor;
    }

    const nextAula = dto.aula !== undefined ? dto.aula : slot.aula;
    const nextClase =
      dto.numeroClase !== undefined ? dto.numeroClase : slot.numeroClase;
    const nextProfesorId = slot.profesor?.id;

    if (nextProfesorId) {
      const existing = await this.slotRepo.findOne({
        where: {
          profesor: { id: nextProfesorId },
          aula: nextAula,
          numeroClase: nextClase,
        },
      });

      if (existing && existing.id !== slotId) {
        throw new ConflictException(I18nHelper.getError('DUPLICATE_ENTRY'));
      }
    }

    Object.assign(slot, {
      aula: nextAula,
      numeroClase: nextClase,
      capacidad: dto.capacidad !== undefined ? dto.capacidad : slot.capacidad,
    });

    return this.slotRepo.save(slot);
  }

  /**
   * Elimina a un alumno vinculado a un slot del profesor autenticado.
   */
  async removeStudent(profesorUserId: string, alumnoId: string) {
    return this.dataSource.transaction(async (manager) => {
      const profesor = await manager.findOne(Profesor, {
        where: { user: { id: profesorUserId } },
      });
      if (!profesor) {
        throw new NotFoundException(I18nHelper.getError('PROFESOR_NOT_FOUND'));
      }

      const alumno = await manager.findOne(Alumno, {
        where: { id: alumnoId, slot: { profesor: { id: profesor.id } } },
      });

      if (!alumno) {
        throw new NotFoundException(
          'Alumno no pertenece a este profesor o no existe'
        );
      }

      await manager.remove(alumno);
      return { message: I18nHelper.translate('success.DELETED') };
    });
  }

  /**
   * Documentación en español.
   */
  async adminDeleteSlot(slotId: string) {
    const slot = await this.slotRepo.findOne({
      where: { id: slotId },
      relations: ['alumnos'],
    });

    if (!slot) {
      throw new NotFoundException(I18nHelper.getError('NOT_FOUND'));
    }

    if (slot.alumnos && slot.alumnos.length > 0) {
      throw new ConflictException(I18nHelper.getError('SLOT_HAS_STUDENTS'));
    }

    await this.slotRepo.remove(slot);
    return { message: I18nHelper.translate('success.DELETED') };
  }
}
