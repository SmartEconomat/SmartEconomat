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

@Injectable()
export class AlumnoService {
  constructor(
    @InjectRepository(Alumno) private readonly alumnoRepo: Repository<Alumno>,
    private readonly dataSource: DataSource
  ) {}

  async register(dto: RegisterAlumnoDto) {
    return this.dataSource.transaction(async (manager) => {
      const profesor = await manager.findOne(Profesor, {
        where: { cial: dto.cialProfesor },
      });
      if (!profesor)
        throw new NotFoundException(
          'Profesor no encontrado con el cial proporcionado'
        );

      let slot = await manager.findOne(AlumnoSlot, {
        where: {
          profesor: { id: profesor.id },
          aula: dto.aula,
          numeroClase: dto.numeroClase,
        },
        relations: ['alumno'],
      });

      if (!slot) {
        slot = manager.create(AlumnoSlot, {
          profesor,
          aula: dto.aula,
          numeroClase: dto.numeroClase,
        });
        await manager.save(slot);
      } else if (slot.alumno) {
        throw new BadRequestException(
          'El Slot ya está ocupado por otro alumno'
        );
      }

      const whereConditions: any[] = [{ username: dto.username }];
      if (dto.email) {
        whereConditions.push({ email: dto.email });
      }

      const isExistingUser = await manager.findOne(Usuario, {
        where: whereConditions,
      });

      if (isExistingUser)
        throw new ConflictException('Username or email is already taken');

      const passwordHash = await bcrypt.hash(dto.password, 10);
      const user = manager.create(Usuario, {
        username: dto.username,
        email: dto.email,
        password: passwordHash,
        rol: rolUsuario.ALUMNO,
        status: UserStatus.INACTIVE,
      });
      await manager.save(user);

      const alumno = manager.create(Alumno, {
        user,
        slot,
      });
      await manager.save(alumno);

      return {
        message:
          'Alumno registrado con éxito. Esperando activación por el profesor.',
      };
    });
  }

  async changeProfesor(
    alumnoUserId: string,
    reqUserId: string,
    reqUserRole: rolUsuario,
    dto: ChangeProfesorDto
  ) {
    return this.dataSource.transaction(async (manager) => {
      const alumno = await manager.findOne(Alumno, {
        where: { user: { id: alumnoUserId } },
        relations: ['slot', 'slot.profesor'],
      });

      if (!alumno) throw new NotFoundException('Alumno no encontrado');

      if (reqUserRole !== rolUsuario.ADMINISTRADOR) {
        const profesorActual = await manager.findOne(Profesor, {
          where: { user: { id: reqUserId } },
        });

        if (!profesorActual || alumno.slot.profesor.id !== profesorActual.id) {
          throw new BadRequestException(
            'No tienes permisos para cambiar a este alumno'
          );
        }
      }

      const nuevoProfesor = await manager.findOne(Profesor, {
        where: { cial: dto.cialNuevoProfesor },
      });

      if (!nuevoProfesor)
        throw new NotFoundException('Nuevo profesor no encontrado');

      const nuevoSlot = await manager.findOne(AlumnoSlot, {
        where: {
          profesor: { id: nuevoProfesor.id },
          aula: dto.nuevaAula,
          numeroClase: dto.nuevoNumeroClase,
        },
        relations: ['alumno'],
      });

      if (!nuevoSlot)
        throw new NotFoundException('El nuevo slot especificado no existe');
      if (nuevoSlot.alumno)
        throw new BadRequestException('El nuevo slot ya está ocupado');

      alumno.slot = nuevoSlot;
      await manager.save(alumno);

      return { message: 'Profesor y slot cambiados con éxito' };
    });
  }
}
