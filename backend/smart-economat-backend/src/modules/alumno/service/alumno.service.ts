import { I18nHelper } from '../../../common/helpers/i18n.helper';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Usuario } from '../../usuario/usuario.entity/usuario.entity';
import { rolUsuario, UserStatus } from '../../usuario/enums/usuario.enums';
import { Alumno } from '../alumno.entity/alumno.entity';
import { Profesor } from '../../profesor/profesor.entity/profesor.entity';
import { AlumnoSlot } from '../../profesor/profesor.entity/alumno-slot.entity';
import { RegisterAlumnoDto } from '../dto/register-alumno.dto';
import { ChangeProfesorDto } from '../dto/change-profesor.dto';
import { Rol } from '../../roles/rol.entity/rol.entity';

/**
 * Documentación en español.
 */
@Injectable()
export class AlumnoService {
  /**
   * Documentación en español.
   */
  constructor(
    @InjectRepository(Alumno) private readonly alumnoRepo: Repository<Alumno>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Documentación en español.
   */
  private async resolveSlotForRegistration(
    manager: {
      findOne: (...args: unknown[]) => Promise<unknown>;
      create: (...args: unknown[]) => unknown;
      save: (entity: unknown) => Promise<unknown>;
    },
    dto: RegisterAlumnoDto
  ): Promise<AlumnoSlot> {
    if (dto.codigoClase?.trim()) {
      const slotByCode = await this.findSlotByCode(
        manager,
        dto.codigoClase,
        true
      );

      if (!slotByCode) {
        throw new NotFoundException(
          I18nHelper.getError('CLASS_NOT_FOUND_BY_CODE', {
            codigoClase: dto.codigoClase,
          })
        );
      }

      return slotByCode;
    }

    const profesor = (await manager.findOne(Profesor, {
      where: { cial: dto.cialProfesor },
    })) as Profesor | null;

    if (!profesor) {
      throw new NotFoundException(
        I18nHelper.getError('PROFESSOR_NOT_FOUND_WITH_CIAL', {
          cial: dto.cialProfesor,
        })
      );
    }

    let resolvedSlot = (await manager.findOne(AlumnoSlot, {
      where: {
        profesor: { id: profesor.id },
        aula: dto.aula,
        numeroClase: dto.numeroClase,
      },
      relations: ['profesor', 'profesor.user', 'alumnos'],
    })) as AlumnoSlot | null;

    if (!resolvedSlot) {
      resolvedSlot = manager.create(AlumnoSlot, {
        profesor,
        aula: dto.aula,
        numeroClase: dto.numeroClase,
        capacidad: 1,
        alumnos: [],
      }) as AlumnoSlot;
      resolvedSlot = (await manager.save(resolvedSlot)) as AlumnoSlot;
      resolvedSlot = (await manager.findOne(AlumnoSlot, {
        where: { id: resolvedSlot.id },
        relations: ['profesor', 'profesor.user', 'alumnos'],
      })) as AlumnoSlot;
    }

    return resolvedSlot;
  }

  /**
   * Documentación en español.
   */
  private async findSlotByCode(
    manager: {
      findOne: (...args: unknown[]) => Promise<unknown>;
    },
    codigoClase: string,
    includeStudents = false
  ): Promise<AlumnoSlot | null> {
    const normalizedCode = codigoClase.trim().toUpperCase();

    return (await manager.findOne(AlumnoSlot, {
      where: { codigoSlot: normalizedCode },
      relations: includeStudents
        ? ['profesor', 'profesor.user', 'alumnos']
        : ['profesor', 'profesor.user'],
    })) as AlumnoSlot | null;
  }

  /**
   * Documentación en español.
   */
  private async countStudentsInSlot(
    manager: {
      count?: (entity: typeof Alumno, options: unknown) => Promise<number>;
    },
    slot: Partial<AlumnoSlot> & {
      id?: string;
      alumnos?: Alumno[];
      alumno?: Alumno | null;
    }
  ): Promise<number> {
    if (typeof manager.count === 'function' && slot.id) {
      return manager.count(Alumno, {
        where: { slot: { id: slot.id } },
      });
    }

    if (Array.isArray(slot.alumnos)) {
      return slot.alumnos.length;
    }

    return slot.alumno ? 1 : 0;
  }

  /**
   * Documentación en español.
   */
  async register(dto: RegisterAlumnoDto) {
    return this.dataSource.transaction(async (manager) => {
      const slot = await this.resolveSlotForRegistration(manager, dto);

      const alumnosContados = await this.countStudentsInSlot(manager, slot);
      const capacidadSlot = slot.capacidad ?? 1;

      if (alumnosContados >= capacidadSlot) {
        throw new BadRequestException(
          I18nHelper.getError('SLOT_CAPACITY_REACHED')
        );
      }

      const whereConditions: any[] = [{ username: dto.username }];

      const isExistingUser = await manager.findOne(Usuario, {
        where: whereConditions,
      });

      if (isExistingUser)
        throw new ConflictException(
          I18nHelper.getError('USERNAME_OR_EMAIL_IS_ALREADY_TAKEN')
        );

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const alumnoRole = await manager.findOne(Rol, {
        where: { nombre: rolUsuario.ALUMNO },
      });
      const user = manager.create(Usuario, {
        username: dto.username,
        password: passwordHash,
        rol: rolUsuario.ALUMNO,
        status: UserStatus.INACTIVE,
        activo: false,
        roles: alumnoRole ? [alumnoRole] : [],
      });
      await manager.save(user);

      const alumno = manager.create(Alumno, {
        user,
        slot,
        profesor: slot.profesor,
      });
      await manager.save(alumno);

      return {
        id: alumno.id,
        username: user.username,
        status: user.status,
        message: I18nHelper.translate(
          'messages.ALUMNO_REGISTRADO_CON_XITO_ESPERANDO_ACT'
        ),
      };
    });
  }

  /**
   * Documentación en español.
   */
  async getSlotByCode(codigoClase: string) {
    const normalizedCode = codigoClase.trim().toUpperCase();
    const slot = await this.dataSource.getRepository(AlumnoSlot).findOne({
      where: { codigoSlot: normalizedCode },
      relations: ['profesor', 'profesor.user'],
    });

    if (!slot) {
      throw new NotFoundException(
        I18nHelper.getError('CLASS_NOT_FOUND_BY_CODE', {
          codigoClase: codigoClase,
        })
      );
    }

    return {
      codigoClase: slot.codigoSlot,
      aula: slot.aula,
      numeroClase: slot.numeroClase,
      profesor: slot.profesor.user.username,
      cialProfesor: slot.profesor.cial,
    };
  }

  /**
   * Documentación en español.
   */
  async changeProfesor(
    alumnoUserId: string,
    reqUserId: string,
    reqUserRole: rolUsuario,
    dto: ChangeProfesorDto
  ) {
    return this.dataSource.transaction(async (manager) => {
      const alumno = await manager.findOne(Alumno, {
        where: { user: { id: alumnoUserId } },
        relations: ['user', 'slot', 'slot.profesor'],
      });

      if (!alumno)
        throw new NotFoundException(I18nHelper.getError('STUDENT_NOT_FOUND'));

      if (reqUserRole === rolUsuario.PROFESOR) {
        const profesorActual = await manager.findOne(Profesor, {
          where: { user: { id: reqUserId } },
        });

        if (!profesorActual || alumno.slot.profesor.id !== profesorActual.id) {
          throw new BadRequestException(
            I18nHelper.getError('NO_PERMISSION_CHANGE_ALUMNO')
          );
        }
      } else if (
        reqUserRole === rolUsuario.ALUMNO &&
        alumno.user.id !== reqUserId
      ) {
        throw new BadRequestException(
          I18nHelper.getError('NO_PERMISSION_CHANGE_ALUMNO')
        );
      }

      const nuevoProfesor = await manager.findOne(Profesor, {
        where: { cial: dto.cialNuevoProfesor },
      });

      if (!nuevoProfesor)
        throw new NotFoundException(
          I18nHelper.getError('NUEVO_PROFESOR_NO_ENCONTRADO')
        );

      const nuevoSlot = await manager.findOne(AlumnoSlot, {
        where: {
          profesor: { id: nuevoProfesor.id },
          aula: dto.nuevaAula,
          numeroClase: dto.nuevoNumeroClase,
        },
        relations: ['alumnos'],
      });

      if (!nuevoSlot)
        throw new NotFoundException(I18nHelper.getError('NEW_SLOT_NOT_FOUND'));

      const alumnosEnNuevoSlot = await this.countStudentsInSlot(
        manager,
        nuevoSlot
      );
      const capacidadNuevoSlot = nuevoSlot.capacidad ?? 1;

      if (alumnosEnNuevoSlot >= capacidadNuevoSlot)
        throw new BadRequestException(
          I18nHelper.getError('SLOT_CAPACITY_REACHED')
        );

      alumno.slot = nuevoSlot;
      alumno.profesor = nuevoProfesor;
      await manager.save(alumno);

      return {
        message: I18nHelper.translate(
          'messages.PROFESOR_Y_SLOT_CAMBIADOS_CON_XITO'
        ),
      };
    });
  }

  /**
   * Documentación en español.
   */
  async getAulas() {
    const slots = await this.dataSource.getRepository(AlumnoSlot).find({
      select: ['aula'],
    });
    const aulas = [...new Set(slots.map((s) => s.aula))];
    return aulas.sort();
  }

  /**
   * Documentación en español.
   */
  async getClasesByAula(aula: string) {
    const slots = await this.dataSource.getRepository(AlumnoSlot).find({
      where: { aula },
      select: ['numeroClase'],
    });
    const clases = [...new Set(slots.map((s) => s.numeroClase))];
    return clases.sort((a: number, b: number) => a - b);
  }

  /**
   * Documentación en español.
   */
  async getProfesoresBySlot(aula: string, numeroClase: number) {
    const slots = await this.dataSource.getRepository(AlumnoSlot).find({
      where: { aula, numeroClase },
      relations: ['profesor', 'profesor.user'],
    });

    return slots.map((slot) => ({
      cial: slot.profesor.cial,
      nombre: slot.profesor.user.username,
      codigoSlot: slot.codigoSlot,
    }));
  }
}
