import { BadRequestException, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { DataSource } from 'typeorm';
import { MailService } from '../../../src/modules/auth/mail.service';
import { AuthService } from '../../../src/modules/auth/service/auth.service';
import { Usuario } from '../../../src/modules/usuario/usuario.entity/usuario.entity';
import {
  rolUsuario,
  UserStatus,
} from '../../../src/modules/usuario/enums/usuario.enums';

describe('AuthService', () => {
  let service: AuthService;

  const mockUsuarioRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  const mockDataSource = {
    transaction: jest.fn(),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getRepositoryToken(Usuario),
          useValue: mockUsuarioRepo,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('true') },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  function createLoginQueryBuilder(user: Usuario | null) {
    return {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue(user),
    };
  }

  function createUsuario(payload: Partial<Usuario>): Usuario {
    return Object.assign(new Usuario(), payload);
  }

  it('register crea usuario alumno inactivo con password hasheado y devuelve JWT', async () => {
    const dto = {
      username: 'nuevo.usuario',
      password: 'Pass1234*',
      email: 'nuevo@demo.local',
      nombre: 'Nuevo Usuario',
    };

    const manager = {
      findOne: jest.fn().mockResolvedValue(null),
      create: jest
        .fn()
        .mockImplementation((_: unknown, payload: Partial<Usuario>) =>
          createUsuario(payload)
        ),
      save: jest.fn().mockImplementation(async (entity: Usuario) => {
        await entity.hashPassword();
        return Object.assign(entity, { id: 'user-1' } as Partial<Usuario>);
      }),
    };

    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );
    mockJwtService.sign.mockReturnValue('jwt-token');

    const result = await service.register(dto);

    expect(result).toEqual({ access_token: 'jwt-token' });
    expect(manager.findOne).toHaveBeenCalledWith(Usuario, {
      where: [{ username: dto.username }, { email: dto.email }],
    });

    const savedUser = manager.save.mock.calls[0][0] as Usuario;
    expect(savedUser.status).toBe(UserStatus.INACTIVE);
    expect(savedUser.rol).toBe(rolUsuario.ALUMNO);
    expect(savedUser.password).not.toBe(dto.password);
    await expect(
      bcrypt.compare(dto.password, savedUser.password)
    ).resolves.toBe(true);
    expect(mockJwtService.sign).toHaveBeenCalledWith({
      sub: 'user-1',
      username: dto.username,
      role: rolUsuario.ALUMNO,
    });
  });

  it('register rechaza username duplicado', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue(createUsuario({ id: 'existing-1' })),
    };

    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    await expect(
      service.register({
        username: 'duplicado',
        password: 'Pass1234*',
        email: 'otro@demo.local',
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('register rechaza email duplicado', async () => {
    const manager = {
      findOne: jest.fn().mockResolvedValue(createUsuario({ id: 'existing-2' })),
    };

    mockDataSource.transaction.mockImplementation((callback) =>
      callback(manager)
    );

    await expect(
      service.register({
        username: 'usuario-nuevo',
        password: 'Pass1234*',
        email: 'duplicado@demo.local',
      })
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('login rechaza usuarios inactivos', async () => {
    const user = createUsuario({
      id: 'user-2',
      username: 'inactive',
      password: await bcrypt.hash('Pass1234*', 10),
      status: UserStatus.INACTIVE,
    });

    mockUsuarioRepo.createQueryBuilder.mockReturnValue(
      createLoginQueryBuilder(user)
    );

    await expect(
      service.login({ email: 'inactive', password: 'Pass1234*' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('login rechaza usuarios bloqueados', async () => {
    const user = createUsuario({
      id: 'user-3',
      username: 'blocked',
      password: await bcrypt.hash('Pass1234*', 10),
      status: UserStatus.BLOCKED,
    });

    mockUsuarioRepo.createQueryBuilder.mockReturnValue(
      createLoginQueryBuilder(user)
    );

    await expect(
      service.login({ email: 'blocked', password: 'Pass1234*' })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('login exitoso devuelve JWT y requirePasswordChange', async () => {
    const user = createUsuario({
      id: 'user-4',
      username: 'active.user',
      rol: rolUsuario.ADMIN,
      password: await bcrypt.hash('Pass1234*', 10),
      status: UserStatus.ACTIVE,
      mustChangePassword: true,
    });

    mockUsuarioRepo.createQueryBuilder.mockReturnValue(
      createLoginQueryBuilder(user)
    );
    mockJwtService.sign.mockReturnValue('signed-jwt');

    const result = await service.login({
      email: 'active.user',
      password: 'Pass1234*',
    });

    expect(result).toEqual({
      access_token: 'signed-jwt',
      requirePasswordChange: true,
    });
    expect(mockJwtService.sign).toHaveBeenCalledWith({
      sub: 'user-4',
      username: 'active.user',
      role: rolUsuario.ADMIN,
    });
  });

  it('forgotPassword no revela si el email no existe', async () => {
    mockUsuarioRepo.findOne.mockResolvedValue(null);

    await expect(
      service.forgotPassword('missing@demo.local')
    ).resolves.toBeUndefined();

    expect(mockUsuarioRepo.save).not.toHaveBeenCalled();
    expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('forgotPassword genera hash SHA256 y expiración de 1 hora', async () => {
    const now = new Date('2026-03-14T10:00:00.000Z').getTime();
    const usuario = createUsuario({
      id: 'user-5',
      email: 'reset@demo.local',
    });

    jest.spyOn(Date, 'now').mockReturnValue(now);
    mockUsuarioRepo.findOne.mockResolvedValue(usuario);
    mockUsuarioRepo.save.mockImplementation((entity: Usuario) =>
      Promise.resolve(entity)
    );

    await service.forgotPassword('reset@demo.local');

    const sentToken = mockMailService.sendPasswordResetEmail.mock.calls[0][1];
    const expectedHash = crypto
      .createHash('sha256')
      .update(sentToken)
      .digest('hex');

    expect(usuario.resetPasswordOtp).toBe(expectedHash);
    expect(usuario.resetPasswordOtpExpires).toEqual(
      new Date(now + 60 * 60 * 1000)
    );
    expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
      'reset@demo.local',
      sentToken
    );
  });

  it('resetPassword rechaza tokens expirados', async () => {
    mockUsuarioRepo.findOne.mockResolvedValue(
      createUsuario({
        id: 'user-6',
        resetPasswordOtp: 'hash',
        resetPasswordOtpExpires: new Date('2026-03-14T09:59:59.000Z'),
      })
    );

    await expect(
      service.resetPassword('token-expirado', 'NuevaPass123*')
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('resetPassword exitoso limpia token, expiración y mustChangePassword', async () => {
    const token = 'token-valido';
    const futureExpiry = new Date(Date.now() + 60 * 60 * 1000);
    const usuario = createUsuario({
      id: 'user-7',
      password: 'OldPass123*',
      resetPasswordOtp: crypto.createHash('sha256').update(token).digest('hex'),
      resetPasswordOtpExpires: futureExpiry,
      mustChangePassword: true,
    });

    mockUsuarioRepo.findOne.mockResolvedValue(usuario);
    mockUsuarioRepo.save.mockImplementation(async (entity: Usuario) => {
      await entity.hashPassword();
      return entity;
    });

    await service.resetPassword(token, 'NuevaPass123*');

    const savedUser = mockUsuarioRepo.save.mock.calls[0][0] as Usuario;
    expect(savedUser.resetPasswordOtp).toBeNull();
    expect(savedUser.resetPasswordOtpExpires).toBeNull();
    expect(savedUser.mustChangePassword).toBe(false);
    await expect(
      bcrypt.compare('NuevaPass123*', savedUser.password)
    ).resolves.toBe(true);
  });

  it('changePassword rechaza la contraseña actual incorrecta', async () => {
    const usuario = createUsuario({
      id: 'user-8',
      password: await bcrypt.hash('Correcta123*', 10),
    });

    mockUsuarioRepo.createQueryBuilder.mockReturnValue(
      createLoginQueryBuilder(usuario)
    );

    await expect(
      service.changePassword('user-8', 'Incorrecta123*', 'NuevaPass123*')
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('changePassword exitoso actualiza el hash y limpia mustChangePassword', async () => {
    const usuario = createUsuario({
      id: 'user-9',
      password: await bcrypt.hash('Actual123*', 10),
      mustChangePassword: true,
    });

    mockUsuarioRepo.createQueryBuilder.mockReturnValue(
      createLoginQueryBuilder(usuario)
    );
    mockUsuarioRepo.save.mockImplementation(async (entity: Usuario) => {
      await entity.hashPassword();
      return entity;
    });

    await service.changePassword('user-9', 'Actual123*', 'NuevaPass123*');

    const savedUser = mockUsuarioRepo.save.mock.calls[0][0] as Usuario;
    expect(savedUser.mustChangePassword).toBe(false);
    await expect(
      bcrypt.compare('NuevaPass123*', savedUser.password)
    ).resolves.toBe(true);
  });
});
