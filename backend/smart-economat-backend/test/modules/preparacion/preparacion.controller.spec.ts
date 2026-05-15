import { UnauthorizedException } from '@nestjs/common';
import { PreparacionController } from '../../../src/modules/preparacion/controller/preparacion.controller';

/**
 * Tests de regresión para PREPARACION-001:
 * Bug — findAll pasaba req.user?.rol?.nombre (undefined siempre) en vez de req.user?.rol (string).
 * Los admins no podían ver preparaciones soft-deleted.
 */
describe('PreparacionController', () => {
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findOne: jest.fn().mockResolvedValue({}),
    iniciarPreparacion: jest.fn(),
    finalizarPreparacion: jest.fn(),
    cancelarPreparacion: jest.fn(),
    remove: jest.fn(),
  };

  let controller: PreparacionController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PreparacionController(mockService as any);
  });

  describe('findAll — extracción del rol del JWT', () => {
    it('pasa req.user.rol (string) directamente al servicio', async () => {
      const req = { user: { rol: 'ADMIN' } };
      const query = { page: 1, limit: 10 } as any;

      await controller.findAll(query, req as any);

      expect(mockService.findAll).toHaveBeenCalledWith(query, 'ADMIN');
    });

    it('pasa undefined cuando req.user.rol no existe', async () => {
      const req = { user: {} };
      const query = { page: 1, limit: 10 } as any;

      await controller.findAll(query, req as any);

      expect(mockService.findAll).toHaveBeenCalledWith(query, undefined);
    });

    it('NO accede a .nombre (ruta anterior rota)', async () => {
      const req = { user: { rol: 'PROFESOR' } };
      const query = { page: 1, limit: 10 } as any;

      await controller.findAll(query, req as any);

      const [, rolArg] = mockService.findAll.mock.calls[0];
      expect(rolArg).toBe('PROFESOR');
      expect(typeof rolArg).toBe('string');
    });
  });

  describe('findOne — extracción del rol del JWT', () => {
    it('pasa req.user.rol (string) al servicio', async () => {
      const req = { user: { rol: 'ADMIN' } };

      await controller.findOne('some-id', req as any);

      expect(mockService.findOne).toHaveBeenCalledWith('some-id', 'ADMIN');
    });
  });

  describe('create — validación de userId', () => {
    it('lanza UnauthorizedException si no hay userId en el token', async () => {
      const req = { user: {} };
      await expect(
        controller.create({} as any, req as any)
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('llama al servicio con el userId del token', async () => {
      mockService.create.mockResolvedValue({});
      const req = { user: { id: 'user-123' } };

      await controller.create({ recetaId: 'r-1' } as any, req as any);

      expect(mockService.create).toHaveBeenCalledWith(
        { recetaId: 'r-1' },
        'user-123'
      );
    });
  });
});
