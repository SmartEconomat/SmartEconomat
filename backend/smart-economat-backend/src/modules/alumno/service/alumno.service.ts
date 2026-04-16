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
 * Servicio que gestiona el registro de alumnos, la resolución de slots de aula,
 * los cambios de asignación de profesor y las operaciones de consulta de soporte.
 * Todas las operaciones de escritura se ejecutan dentro de transacciones de base de datos para garantizar la consistencia.
 * @class AlumnoService
 */
@Injectable()
export class AlumnoService {
  /**
   * @description Construye el servicio con sus dependencias requeridas.
   * @param {Repository<Alumno>} alumnoRepo - Repositorio TypeORM para la entidad Alumno.
   * @param {DataSource} dataSource - DataSource de TypeORM utilizado para ejecutar transacciones de base de datos.
   */
  constructor(
    @InjectRepository(Alumno) private readonly alumnoRepo: Repository<Alumno>,
    private readonly dataSource: DataSource
  ) {}

  /**
   * Resuelve el AlumnoSlot correcto para el registro de un nuevo alumno.
   * Cuando se proporciona dto.codigoClase, el slot se localiza por su código único.
   * De lo contrario, el slot se busca o se crea a partir de dto.cialProfesor, dto.aula y dto.numeroClase.
   * @param {{ findOne: (...args: unknown[]) => Promise<unknown>; create: (...args: unknown[]) => unknown; save: (entity: unknown) => Promise<unknown> }} manager - Gestor de entidades transaccional.
   * @param {RegisterAlumnoDto} dto - Carga útil del registro.
   * @returns {Promise<AlumnoSlot>} AlumnoSlot resuelto o recién creado con las relaciones cargadas.
   * @throws {NotFoundException} Cuando el código de slot o el CIAL del profesor no coincide con ningún registro.
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
   * Busca un AlumnoSlot por su código de clase único (sin distinguir mayúsculas/minúsculas).
   * @param {{ findOne: (...args: unknown[]) => Promise<unknown> }} manager - Gestor de entidades transaccional.
   * @param {string} codigoClase - Código de clase a buscar (normalizado a mayúsculas).
   * @param {boolean} [includeStudents=false] - Si se debe incluir la relación alumnos en el resultado.
   * @returns {Promise<AlumnoSlot | null>} Slot encontrado o null.
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
   * Cuenta el número de alumnos actualmente matriculados en un slot dado.
   * Usa manager.count cuando está disponible; recurre a la longitud del array alumnos cargado.
   * @param {{ count?: (entity: typeof Alumno, options: unknown) => Promise<number> }} manager - Gestor de entidades transaccional.
   * @param {Partial<AlumnoSlot> & { id?: string; alumnos?: Alumno[]; alumno?: Alumno | null }} slot - Entidad slot (puede tener alumnos cargados o no).
   * @returns {Promise<number>} Número de alumnos en el slot.
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
   * Registra una nueva cuenta de alumno dentro de una transacción de base de datos.
   * Resuelve el slot correcto, valida la capacidad, crea un Usuario con estado INACTIVE
   * y lo vincula a un registro Alumno.
   * @param {RegisterAlumnoDto} dto - Carga útil del registro con credenciales y detalles del slot.
   * @returns {Promise<{ id: string; username: string; status: UserStatus; message: string }>} Resumen de la cuenta creada.
   * @throws {NotFoundException} Cuando no se puede resolver el slot o el profesor.
   * @throws {BadRequestException} Cuando el slot ha alcanzado su capacidad.
   * @throws {ConflictException} Cuando el nombre de usuario ya está en uso.
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
   * Devuelve información resumida sobre un slot de clase identificado por su código.
   * @param {string} codigoClase - Código de clase a buscar (normalizado a mayúsculas).
   * @returns {Promise<{ codigoClase: string; aula: string; numeroClase: number; profesor: string; cialProfesor: string }>} Resumen del slot.
   * @throws {NotFoundException} Cuando ningún slot coincide con el código dado.
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
   * Cambia el profesor y la asignación de slot de un alumno dentro de una transacción.
   * Los admins pueden reasignar cualquier alumno; los profesores solo pueden reasignar alumnos de sus propios slots;
   * los alumnos solo pueden reasignarse a sí mismos.
   * @param {string} alumnoUserId - ID de usuario del alumno cuyo slot se está cambiando.
   * @param {string} reqUserId - ID de usuario del solicitante (usado para comprobaciones de permisos).
   * @param {rolUsuario} reqUserRole - Rol del solicitante.
   * @param {ChangeProfesorDto} dto - Nuevo CIAL del profesor, aula y numeroClase.
   * @returns {Promise<{ message: string }>} Mensaje de éxito.
   * @throws {NotFoundException} Cuando no se puede encontrar el alumno, el nuevo profesor o el nuevo slot.
   * @throws {BadRequestException} Cuando el solicitante no tiene permiso o el nuevo slot está lleno.
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
        throw new NotFoundException(
          I18nHelper.getError('ALUMNO_NO_ENCONTRADO')
        );

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
        throw new NotFoundException(
          I18nHelper.getError('EL_NUEVO_SLOT_ESPECIFICADO_NO_EXISTE')
        );

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
   * Devuelve una lista deduplicada y ordenada de todos los identificadores de aula que tienen slots.
   * @returns {Promise<string[]>} Array ordenado de valores únicos de aula.
   */
  async getAulas() {
    const slots = await this.dataSource.getRepository(AlumnoSlot).find({
      select: ['aula'],
    });
    const aulas = [...new Set(slots.map((s) => s.aula))];
    return aulas.sort();
  }

  /**
   * Devuelve una lista deduplicada y ordenada numéricamente de números de clase dentro de un aula dada.
   * @param {string} aula - Identificador del aula por el que filtrar.
   * @returns {Promise<number[]>} Array ordenado de valores únicos de numeroClase.
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
   * Devuelve los profesores (con CIAL, nombre de usuario y código de slot) que imparten en una combinación
   * específica de aula y número de clase.
   * @param {string} aula - Identificador del aula.
   * @param {number} numeroClase - Número de clase dentro del aula.
   * @returns {Promise<Array<{ cial: string; nombre: string; codigoSlot: string }>>} Array de resúmenes de profesores.
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
