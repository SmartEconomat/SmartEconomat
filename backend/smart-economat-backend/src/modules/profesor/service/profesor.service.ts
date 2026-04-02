import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  BadRequestException,
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
import { UpdateSlotDto } from '../dto/update-slot.dto';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'node:crypto';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { Alumno } from '../../alumno/alumno.entity/alumno.entity';
import { Rol } from '../../roles/rol.entity/rol.entity';
import { Ubicacion } from '../../ubicacion/ubicacion.entity/ubicacion.entity';

@Injectable()
export class ProfesorService {
  constructor(
    @InjectRepository(Profesor)
    private readonly profesorRepo: Repository<Profesor>,
    @InjectRepository(AlumnoSlot)
    private readonly slotRepo: Repository<AlumnoSlot>,
    @InjectRepository(Ubicacion)
    private readonly ubicacionRepo: Repository<Ubicacion>,
    private readonly dataSource: DataSource
  ) {}

  private async resolveUbicacion(
    ubicacionId?: string
  ): Promise<Ubicacion | null> {
    if (!ubicacionId) return null;

    const ubicacion = await this.ubicacionRepo.findOne({
      where: { id: ubicacionId },
    });

    if (!ubicacion) {
      throw new NotFoundException('Ubicación no encontrada');
    }

    return ubicacion;
  }

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
    const ubicacion = await this.resolveUbicacion(dto.ubicacionId);

    const slot = this.slotRepo.create({
      profesor,
      aula: dto.aula,
      numeroClase: dto.numeroClase,
      capacidad: dto.capacidad ?? 1,
      codigoSlot,
      ...(ubicacion ? { ubicacion } : {}),
    });

    return this.slotRepo.save(slot);
  }

  async adminCreateSlot(dto: CreateSlotDto & { profesorId: string }) {
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
    const ubicacion = await this.resolveUbicacion(dto.ubicacionId);

    const slot = this.slotRepo.create({
      profesor,
      aula: dto.aula,
      numeroClase: dto.numeroClase,
      capacidad: dto.capacidad ?? 1,
      codigoSlot,
      ...(ubicacion ? { ubicacion } : {}),
    });

    return this.slotRepo.save(slot);
  }

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

    const ubicacion = await this.resolveUbicacion(dto.ubicacionId);

    Object.assign(slot, {
      ...dto,
      ...(dto.ubicacionId !== undefined
        ? { ubicacion: ubicacion ?? null, ubicacionId: dto.ubicacionId ?? null }
        : {}),
    });
    return this.slotRepo.save(slot);
  }

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
      relations: ['alumnos', 'alumnos.user', 'ubicacion'],
      order: { aula: 'ASC', numeroClase: 'ASC' },
    });
  }

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

  async forcePasswordReset(profesorUserId: string, alumnoId: string) {
    if (!alumnoId || alumnoId === 'undefined') {
      throw new BadRequestException('ID de alumno no válido');
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

  async getAllSlots() {
    return this.slotRepo.find({
      relations: ['profesor', 'profesor.user', 'alumnos', 'ubicacion'],
      order: { aula: 'ASC', numeroClase: 'ASC' },
    });
  }

  /** Lista todos los profesores con su info de usuario (para selector en panel admin) */
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

  /** Admin: actualiza un slot (campos basicos + reasignacion de profesor) */
  async adminUpdateSlot(
    slotId: string,
    dto: UpdateSlotDto & { profesorId?: string }
  ) {
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
    if (dto.ubicacionId !== undefined) {
      const ubicacion = await this.resolveUbicacion(dto.ubicacionId);
      slot.ubicacion = ubicacion ?? undefined;
      slot.ubicacionId = dto.ubicacionId;
    }

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
      ...(dto.ubicacionId !== undefined
        ? { ubicacionId: dto.ubicacionId ?? null }
        : {}),
    });

    return this.slotRepo.save(slot);
  }

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
