import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { InventarioController } from '../../../src/modules/inventario/controller/inventario.controller';
import { InventarioService } from '../../../src/modules/inventario/service/inventario.service';
import { JwtAuthGuard } from '../../../src/modules/auth/guards/jwt-auth.guard';
import { PermisosGuard } from '../../../src/modules/auth/guards/auth-permissions.guard';
import { AuthPermissionsService } from '../../../src/modules/auth/service/auth-permissions.service';
import { TipoMovimientoManual } from '../../../src/modules/movimiento/enums/movimiento.enums';

describe('InventarioController', () => {
  let controller: InventarioController;

  const mockInventarioService = {
    ajustarManual: jest.fn(),
    create: jest.fn(),
    findAll: jest.fn(),
    queryStock: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const mockReflector = {
    get: jest.fn(),
    getAll: jest.fn(),
    getAllAndMerge: jest.fn(),
  };

  const mockAuthPermissionsService = {
    checkPermission: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [InventarioController],
      providers: [
        {
          provide: InventarioService,
          useValue: mockInventarioService,
        },
        {
          provide: Reflector,
          useValue: mockReflector,
        },
        {
          provide: AuthPermissionsService,
          useValue: mockAuthPermissionsService,
        },
        {
          provide: JwtAuthGuard,
          useValue: { canActivate: jest.fn() },
        },
        {
          provide: PermisosGuard,
          useValue: { canActivate: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<InventarioController>(InventarioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('ajustarManual delega en el servicio con el usuario autenticado', async () => {
    const dto = {
      inventarioId: '01954a87-0778-74d4-bb32-55b12044579f',
      tipo: TipoMovimientoManual.SALIDA_AJUSTE,
      ajuste: -4,
      motivo: 'Rotura interna',
    };
    const expected = { id: 'inv-1', cantidadActual: 6 };

    mockInventarioService.ajustarManual.mockResolvedValue(expected);

    await expect(controller.ajustarManual(dto as any, 'user-1')).resolves.toBe(
      expected
    );
    expect(mockInventarioService.ajustarManual).toHaveBeenCalledWith(
      dto,
      'user-1'
    );
  });
});
