import { MovimientoController } from '../../../src/modules/movimiento/controller/movimiento.controller';

/**
 * Tests de regresión para MOVIMIENTO-001:
 * Bug de seguridad — POST /movimientos permitía que el cliente enviara un
 * `usuario` arbitrario en el DTO, comprometiendo la integridad de la auditoría.
 * El fix fuerza dto.usuario = req.user.id siempre.
 */
describe('MovimientoController — integridad de auditoría', () => {
  const mockService = {
    create: jest.fn().mockResolvedValue({ id: 'mov-1' }),
    findAll: jest.fn(),
    getMovimientoHistory: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: MovimientoController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new MovimientoController(mockService as any);
  });

  it('siempre asigna dto.usuario desde el token, ignorando el cuerpo', async () => {
    const req = { user: { id: 'token-user-id' } };
    const dto = { usuario: 'otro-usuario-malicioso', cantidad: 5 } as any;

    await controller.create(dto, req);

    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({ usuario: 'token-user-id' })
    );
  });

  it('funciona sin campo usuario en el DTO original (lo asigna el controller)', async () => {
    const req = { user: { id: 'user-abc' } };
    const dto = { cantidad: 10 } as any;

    await controller.create(dto, req);

    expect(mockService.create).toHaveBeenCalledWith(
      expect.objectContaining({ usuario: 'user-abc' })
    );
  });

  it('un usuario autenticado no puede atribuir el movimiento a otro usuario', async () => {
    const req = { user: { id: 'real-actor-id' } };
    const dto = { usuario: 'victim-id', cantidad: 1 } as any;

    await controller.create(dto, req);

    const calledWith = mockService.create.mock.calls[0][0];
    expect(calledWith.usuario).toBe('real-actor-id');
    expect(calledWith.usuario).not.toBe('victim-id');
  });
});
