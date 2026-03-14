import { ConflictException, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Alumno } from '../../../src/modules/alumno/alumno.entity/alumno.entity';
import { Profesor } from '../../../src/modules/profesor/profesor.entity/profesor.entity';
import { ProfesorService } from '../../../src/modules/profesor/service/profesor.service';
import {
  rolUsuario,
  UserStatus,
} from '../../../src/modules/usuario/enums/usuario.enums';
import { Usuario } from '../../../src/modules/usuario/usuario.entity/usuario.entity';

describe('ProfesorService', () => {
  const mockProfesorRepo = {
    findOne: jest.fn(),
  };

  const mockSlotRepo = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
  };

  let service: ProfesorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProfesorService(
      mockProfesorRepo as any,
      mockSlotRepo as any,
      mockDataSource as any
    );
  });

  function buildRegisterManager(options?: {
    existingUser?: Usuario | null;
    existingProfesor?: Profesor | null;
  }) {
    const createdEntities: Array<Record<string, any>> = [];

    return {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(options?.existingUser ?? null)
        .mockResolvedValueOnce(options?.existingProfesor ?? null),
      create: jest.fn().mockImplementation((Entity: any, payload: object) => {
        const entity = Object.assign(new Entity(), payload) as Record<
          string,
          any
        >;
        createdEntities.push(entity);
        return entity;
      }),
      save: jest.fn().mockImplementation(async (entity: any) => {
        if (entity instanceof Usuario) {
          await entity.hashPassword();
        }

        if (!entity.id) {
          entity.id = `entity-${createdEntities.indexOf(entity) + 1}`;
        }

        return entity;
      }),
    };
  }

  it('register crea varios profesores con credenciales únicas e inactivas', async () => {
    const managerA = buildRegisterManager();
    mockDataSource.transaction.mockImplementationOnce((callback) =>
      callback(managerA)
    );

    const profesorA = await service.register({
      username: 'profesor.a',
      password: 'Password123!',
      email: 'profesor.a@test.local',
      cial: 'CIAL-A',
    });

    const savedUserA = managerA.save.mock.calls[0][0] as Usuario;
    expect(profesorA).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        username: 'profesor.a',
      })
    );
    expect(savedUserA.rol).toBe(rolUsuario.PROFESOR);
    expect(savedUserA.status).toBe(UserStatus.INACTIVE);
    await expect(
      bcrypt.compare('Password123!', savedUserA.password)
    ).resolves.toBe(true);

    const managerB = buildRegisterManager();
    mockDataSource.transaction.mockImplementationOnce((callback) =>
      callback(managerB)
    );

    const profesorB = await service.register({
      username: 'profesor.b',
      password: 'Password123!',
      email: 'profesor.b@test.local',
      cial: 'CIAL-B',
    });

    expect(profesorB.username).toBe('profesor.b');
    expect(managerB.create).toHaveBeenCalledWith(
      Profesor,
      expect.objectContaining({
        cial: 'CIAL-B',
      })
    );
  });

  it('register rechaza usuarios o ciales duplicados', async () => {
    const duplicateUserManager = buildRegisterManager({
      existingUser: Object.assign(new Usuario(), { id: 'user-1' }),
    });
    mockDataSource.transaction.mockImplementationOnce((callback) =>
      callback(duplicateUserManager)
    );

    await expect(
      service.register({
        username: 'duplicado',
        password: 'Password123!',
        email: 'duplicado@test.local',
        cial: 'CIAL-DUP',
      })
    ).rejects.toBeInstanceOf(ConflictException);

    const duplicateCialManager = buildRegisterManager({
      existingProfesor: Object.assign(new Profesor(), { id: 'prof-dup' }),
    });
    mockDataSource.transaction.mockImplementationOnce((callback) =>
      callback(duplicateCialManager)
    );

    await expect(
      service.register({
        username: 'otro.profesor',
        password: 'Password123!',
        email: 'otro.profesor@test.local',
        cial: 'CIAL-DUP',
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('getAlumnos devuelve solo los alumnos del profesor autenticado', async () => {
    mockProfesorRepo.findOne.mockResolvedValue({ id: 'prof-1' });

    const alumnoRepo = {
      find: jest.fn().mockResolvedValue([
        {
          id: 'alu-1',
          user: { username: 'alumno.1', status: UserStatus.ACTIVE },
          slot: { aula: 'Aula A', numeroClase: 1 },
        },
        {
          id: 'alu-2',
          user: { username: 'alumno.2', status: UserStatus.INACTIVE },
          slot: { aula: 'Aula A', numeroClase: 2 },
        },
      ]),
    };
    mockDataSource.getRepository.mockReturnValue(alumnoRepo);

    const result = await service.getAlumnos('user-prof-1');

    expect(alumnoRepo.find).toHaveBeenCalledWith({
      where: { slot: { profesor: { id: 'prof-1' } } },
      relations: ['user', 'slot'],
    });
    expect(result).toEqual([
      {
        id: 'alu-1',
        username: 'alumno.1',
        status: UserStatus.ACTIVE,
        aula: 'Aula A',
        numeroClase: 1,
      },
      {
        id: 'alu-2',
        username: 'alumno.2',
        status: UserStatus.INACTIVE,
        aula: 'Aula A',
        numeroClase: 2,
      },
    ]);
  });

  it('activateAlumno activa al alumno del profesor correspondiente', async () => {
    const alumno = {
      id: 'alu-1',
      user: { id: 'user-alu-1', status: UserStatus.INACTIVE },
      slot: { profesor: { id: 'prof-1' } },
    } as unknown as Alumno;

    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({ id: 'prof-1' } as Profesor)
        .mockResolvedValueOnce(alumno),
      save: jest
        .fn()
        .mockImplementation((entity: any) => Promise.resolve(entity)),
    };
    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    const result = await service.activateAlumno('prof-user-1', 'alu-1');

    expect(manager.save).toHaveBeenCalledWith(alumno.user);
    expect(result).toEqual(
      expect.objectContaining({
        status: UserStatus.ACTIVE,
      })
    );
  });

  it('getAlumnos falla si el profesor no tiene perfil', async () => {
    mockProfesorRepo.findOne.mockResolvedValue(null);

    await expect(service.getAlumnos('missing-prof')).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
