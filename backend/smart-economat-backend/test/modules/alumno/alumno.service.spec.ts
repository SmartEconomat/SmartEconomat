import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { Alumno } from '../../../src/modules/alumno/alumno.entity/alumno.entity';
import { AlumnoService } from '../../../src/modules/alumno/service/alumno.service';
import { AlumnoSlot } from '../../../src/modules/profesor/profesor.entity/alumno-slot.entity';
import { Profesor } from '../../../src/modules/profesor/profesor.entity/profesor.entity';
import {
  rolUsuario,
  UserStatus,
} from '../../../src/modules/usuario/enums/usuario.enums';
import { Usuario } from '../../../src/modules/usuario/usuario.entity/usuario.entity';

describe('AlumnoService', () => {
  const mockAlumnoRepo = {};
  const mockDataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
  };

  let service: AlumnoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AlumnoService(mockAlumnoRepo as any, mockDataSource as any);
  });

  function buildManager(options?: {
    slot?: AlumnoSlot | null;
    existingUser?: Usuario | null;
    alumnoRole?: Record<string, unknown> | null;
  }) {
    const entities: Array<Record<string, any>> = [];

    return {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(options?.slot ?? null)
        .mockResolvedValueOnce(options?.existingUser ?? null)
        .mockResolvedValueOnce(
          options?.alumnoRole ?? { id: 'rol-alumno', nombre: rolUsuario.ALUMNO }
        ),
      create: jest.fn().mockImplementation((Entity: any, payload: object) => {
        const entity = Object.assign(new Entity(), payload) as Record<
          string,
          any
        >;
        entities.push(entity);
        return entity;
      }),
      count: jest.fn().mockImplementation((_entity: any, query: any) => {
        if (query?.where?.slot?.id === options?.slot?.id) {
          return Array.isArray(options?.slot?.alumnos)
            ? options.slot.alumnos.length
            : 0;
        }

        return 0;
      }),
      save: jest.fn().mockImplementation(async (entity: any) => {
        if (entity instanceof Usuario) {
          await entity.hashPassword();
        }

        if (!entity.id) {
          entity.id = `generated-${entities.indexOf(entity) + 1}`;
        }

        return entity;
      }),
    };
  }

  it('register crea un alumno inactivo con contraseña hasheada en el slot existente', async () => {
    const slot = {
      id: 'slot-1',
      aula: 'Aula A',
      numeroClase: 1,
      codigoSlot: 'AL-ABC123',
      capacidad: 30,
      alumnos: [],
      profesor: { id: 'prof-1' } as Profesor,
    } as unknown as AlumnoSlot;
    const manager = buildManager({ slot });
    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    const result = await service.register({
      username: 'alumno.demo',
      password: 'Password123!',
      codigoClase: 'AL-ABC123',
    });

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.any(String),
        username: 'alumno.demo',
        status: UserStatus.INACTIVE,
      })
    );

    const savedUser = manager.save.mock.calls[0][0] as Usuario;
    expect(savedUser.rol).toBe(rolUsuario.ALUMNO);
    expect(savedUser.status).toBe(UserStatus.INACTIVE);
    expect(savedUser.password).not.toBe('Password123!');
    await expect(
      bcrypt.compare('Password123!', savedUser.password)
    ).resolves.toBe(true);

    expect(manager.create).toHaveBeenCalledWith(
      Alumno,
      expect.objectContaining({
        slot,
      })
    );
  });

  it('register permite registrar varios alumnos para el mismo profesor en slots distintos', async () => {
    const profesor = { id: 'prof-shared' } as Profesor;
    const slotA = {
      id: 'slot-a',
      aula: 'Aula Multi',
      numeroClase: 1,
      codigoSlot: 'AL-MULTI1',
      capacidad: 30,
      alumnos: [],
      profesor,
    } as unknown as AlumnoSlot;
    const slotB = {
      id: 'slot-b',
      aula: 'Aula Multi',
      numeroClase: 2,
      codigoSlot: 'AL-MULTI2',
      capacidad: 30,
      alumnos: [],
      profesor,
    } as unknown as AlumnoSlot;

    const managerA = buildManager({ slot: slotA });
    mockDataSource.transaction.mockImplementationOnce((callback) =>
      callback(managerA)
    );

    const alumnoA = await service.register({
      username: 'alumno.a',
      password: 'Password123!',
      codigoClase: 'AL-MULTI1',
    });

    const managerB = buildManager({ slot: slotB });
    mockDataSource.transaction.mockImplementationOnce((callback) =>
      callback(managerB)
    );

    const alumnoB = await service.register({
      username: 'alumno.b',
      password: 'Password123!',
      codigoClase: 'AL-MULTI2',
    });

    expect(alumnoA.username).toBe('alumno.a');
    expect(alumnoB.username).toBe('alumno.b');
    expect(managerA.create).toHaveBeenCalledWith(
      Alumno,
      expect.objectContaining({ slot: slotA })
    );
    expect(managerB.create).toHaveBeenCalledWith(
      Alumno,
      expect.objectContaining({ slot: slotB })
    );
  });

  it('register rechaza slots ya ocupados por otro alumno', async () => {
    const manager = buildManager({
      slot: {
        id: 'slot-1',
        aula: 'Aula Used',
        numeroClase: 1,
        capacidad: 1,
        codigoSlot: 'AL-USED01',
        alumnos: [{ id: 'alumno-existente' } as Alumno],
        profesor: { id: 'prof-1' } as Profesor,
      } as unknown as AlumnoSlot,
    });
    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    await expect(
      service.register({
        username: 'alumno.ocupado',
        password: 'Password123!',
        codigoClase: 'AL-USED01',
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('register rechaza usernames ya existentes', async () => {
    const slot = {
      id: 'slot-dup',
      aula: 'Aula B',
      numeroClase: 3,
      codigoSlot: 'AL-DUP01',
      capacidad: 30,
      alumnos: [],
      profesor: { id: 'prof-1' } as Profesor,
    } as unknown as AlumnoSlot;
    const manager = buildManager({
      slot,
      existingUser: Object.assign(new Usuario(), { id: 'user-existing' }),
    });
    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    await expect(
      service.register({
        username: 'duplicado',
        password: 'Password123!',
        codigoClase: 'AL-DUP01',
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register falla si el código del slot no existe', async () => {
    const manager = buildManager({ slot: null });
    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    await expect(
      service.register({
        username: 'sin.slot',
        password: 'Password123!',
        codigoClase: 'AL-MISSING',
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getSlotByCode devuelve la referencia visual del código', async () => {
    const slot = {
      id: 'slot-ref',
      aula: 'Aula Ref',
      numeroClase: 5,
      codigoSlot: 'AL-REF05',
      profesor: {
        cial: 'CIAL-REF',
        user: { username: 'profesor.ref' },
      },
    } as unknown as AlumnoSlot;

    mockDataSource.getRepository.mockReturnValue({
      findOne: jest.fn().mockResolvedValue(slot),
    } as any);

    await expect(service.getSlotByCode('al-ref05')).resolves.toEqual({
      codigoClase: 'AL-REF05',
      aula: 'Aula Ref',
      numeroClase: 5,
      profesor: 'profesor.ref',
      cialProfesor: 'CIAL-REF',
    });
  });

  it('changeProfesor permite al alumno mover su propio registro a un slot libre', async () => {
    const alumno = {
      id: 'alumno-1',
      user: { id: 'user-alumno-1' },
      slot: { profesor: { id: 'prof-1' } },
    };
    const nuevoSlot = {
      id: 'slot-destino',
      alumno: null,
    } as unknown as AlumnoSlot;

    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce(alumno)
        .mockResolvedValueOnce({ id: 'prof-2', cial: 'CIAL-DEST' })
        .mockResolvedValueOnce(nuevoSlot),
      save: jest.fn().mockResolvedValue(undefined),
    };

    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    const result = await service.changeProfesor(
      'user-alumno-1',
      'user-alumno-1',
      rolUsuario.ALUMNO,
      {
        cialNuevoProfesor: 'CIAL-DEST',
        nuevaAula: 'Aula Destino',
        nuevoNumeroClase: 7,
      }
    );

    expect(result).toEqual(
      expect.objectContaining({ message: expect.any(String) })
    );
    expect(alumno.slot).toBe(nuevoSlot);
    expect(manager.save).toHaveBeenCalledWith(alumno);
  });

  it('changeProfesor impide que un alumno cambie el registro de otro alumno', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValueOnce({
        id: 'alumno-2',
        user: { id: 'owner-user' },
        slot: { profesor: { id: 'prof-1' } },
      }),
      save: jest.fn(),
    };

    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    await expect(
      service.changeProfesor('owner-user', 'otro-user', rolUsuario.ALUMNO, {
        cialNuevoProfesor: 'CIAL-DEST',
        nuevaAula: 'Aula Destino',
        nuevoNumeroClase: 8,
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('changeProfesor impide a un profesor mover alumnos ajenos', async () => {
    const manager = {
      findOne: jest
        .fn()
        .mockResolvedValueOnce({
          id: 'alumno-3',
          user: { id: 'user-alumno-3' },
          slot: { profesor: { id: 'prof-owner' } },
        })
        .mockResolvedValueOnce({ id: 'prof-other' }),
      save: jest.fn(),
    };

    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    await expect(
      service.changeProfesor(
        'user-alumno-3',
        'prof-user-other',
        rolUsuario.PROFESOR,
        {
          cialNuevoProfesor: 'CIAL-DEST',
          nuevaAula: 'Aula Destino',
          nuevoNumeroClase: 9,
        }
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
