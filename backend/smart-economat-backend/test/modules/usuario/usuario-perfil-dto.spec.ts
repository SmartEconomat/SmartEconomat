import { UsuarioPerfilController } from '../../../src/modules/usuario/controller/usuario-perfil.controller';

/**
 * Tests de regresión para USUARIO-001:
 * GET /usuarios/perfil no debe exponer password ni campos OTP.
 */
describe('UsuarioController.getPerfil — exclusión de campos sensibles', () => {
  const mockService = {
    findOne: jest.fn(),
    getUserPermissions: jest.fn().mockResolvedValue(['productos:listar']),
  };

  let controller: UsuarioPerfilController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new UsuarioPerfilController(mockService as any);
  });

  it('excluye password del perfil', async () => {
    mockService.findOne.mockResolvedValue({
      id: 'u-1',
      username: 'admin',
      password: '$2b$10$hashedpassword',
      rol: 'ADMIN',
      activo: true,
      status: 'active',
      mustChangePassword: false,
    });

    const perfil = await controller.getPerfil('u-1');
    expect(perfil).not.toHaveProperty('password');
  });

  it('excluye resetPasswordOtp del perfil', async () => {
    mockService.findOne.mockResolvedValue({
      id: 'u-1',
      username: 'admin',
      password: 'hash',
      resetPasswordOtp: 'some-otp-token',
      resetPasswordOtpExpires: new Date(),
      rol: 'ADMIN',
      activo: true,
      status: 'active',
      mustChangePassword: false,
    });

    const perfil = await controller.getPerfil('u-1');
    expect(perfil).not.toHaveProperty('resetPasswordOtp');
    expect(perfil).not.toHaveProperty('resetPasswordOtpExpires');
  });

  it('excluye deletedAt y deletedBy', async () => {
    mockService.findOne.mockResolvedValue({
      id: 'u-1',
      username: 'test',
      password: 'hash',
      deletedAt: new Date(),
      deletedBy: 'admin-id',
      rol: 'ALUMNO',
      activo: true,
      status: 'active',
      mustChangePassword: false,
    });

    const perfil = await controller.getPerfil('u-1');
    expect(perfil).not.toHaveProperty('deletedAt');
    expect(perfil).not.toHaveProperty('deletedBy');
  });

  it('incluye permisos en la respuesta', async () => {
    mockService.findOne.mockResolvedValue({
      id: 'u-1',
      username: 'test',
      password: 'hash',
      rol: 'ALUMNO',
      activo: true,
      status: 'active',
      mustChangePassword: false,
    });
    mockService.getUserPermissions.mockResolvedValue([
      'pedidos:listar',
      'productos:ver',
    ]);

    const perfil = await controller.getPerfil('u-1');
    expect(perfil.permisos).toEqual(['pedidos:listar', 'productos:ver']);
  });

  it('incluye campos seguros como id, username, rol', async () => {
    mockService.findOne.mockResolvedValue({
      id: 'u-123',
      username: 'profe',
      nombre: 'Profesor Test',
      password: 'hash',
      rol: 'PROFESOR',
      activo: true,
      status: 'active',
      mustChangePassword: false,
    });

    const perfil = await controller.getPerfil('u-123');
    expect(perfil).toMatchObject({
      id: 'u-123',
      username: 'profe',
      nombre: 'Profesor Test',
    });
  });
});
