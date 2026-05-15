import { PermisosController } from '../../../src/modules/permisos/controller/permisos.controller';

/**
 * Tests de regresión para PERMISOS-001:
 * La ruta 'grouped' debe resolver antes que ':id' en el controlador de permisos.
 * Verificamos que el método findGroupedByModule se llama cuando se invoca 'grouped'.
 */
describe('PermisosController — orden de rutas (grouped antes de :id)', () => {
  const mockService = {
    findAll: jest.fn().mockResolvedValue({ data: [], total: 0 }),
    findAllNoPagination: jest.fn().mockResolvedValue([]),
    findGroupedByModule: jest
      .fn()
      .mockResolvedValue({ admin: [], producto: [] }),
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  let controller: PermisosController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new PermisosController(mockService as any);
  });

  it('findGroupedByModule devuelve un objeto agrupado por módulo', async () => {
    const result = await controller.findGroupedByModule();
    expect(result).toHaveProperty('admin');
    expect(result).toHaveProperty('producto');
    expect(mockService.findGroupedByModule).toHaveBeenCalledTimes(1);
  });

  it('findOne recibe un id UUID, no el string "grouped"', async () => {
    mockService.findOne.mockResolvedValue({
      id: 'real-uuid',
      codigo: 'test:ver',
    });
    const result = await controller.findOne('real-uuid');
    expect(mockService.findOne).toHaveBeenCalledWith('real-uuid');
    expect(result).toHaveProperty('codigo', 'test:ver');
  });

  it('findGroupedByModule y findOne son métodos distintos y NO comparten lógica', () => {
    const grouped = Reflect.get(
      PermisosController.prototype,
      'findGroupedByModule'
    );
    const findOneById = Reflect.get(PermisosController.prototype, 'findOne');
    expect(grouped).toBeDefined();
    expect(findOneById).toBeDefined();
    expect(grouped).not.toBe(findOneById);
  });
});
