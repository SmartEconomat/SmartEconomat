import { ConflictException, NotFoundException } from '@nestjs/common';
import { PreparacionService } from '../../../src/modules/preparacion/service/preparacion.service';
import { PreparacionEstado } from '../../../src/modules/preparacion/enums/preparacion.enums';
import { Preparacion } from '../../../src/modules/preparacion/preparacion.entity/preparacion.entity';
import { ProduccionLote } from '../../../src/modules/receta/produccion-lote.entity/produccion-lote.entity';

describe('PreparacionService', () => {
  const preparacionRepository = {
    create: jest.fn(),
    findAllPaginated: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const produccionService = {
    ejecutarProduccion: jest.fn(),
  };

  const recetaRepository = {
    findById: jest.fn(),
  };

  const preparacionQb = {
    where: jest.fn().mockReturnThis(),
    setLock: jest.fn().mockReturnThis(),
    getOne: jest.fn(),
  };

  const preparacionTxRepository = {
    createQueryBuilder: jest.fn().mockReturnValue(preparacionQb),
  };

  const produccionLoteTxRepository = {
    findOne: jest.fn(),
  };

  const manager = {
    getRepository: jest.fn((entity: unknown) => {
      if (entity === Preparacion) return preparacionTxRepository;
      if (entity === ProduccionLote) return produccionLoteTxRepository;
      return null;
    }),
    save: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn((cb: (managerArg: typeof manager) => unknown) =>
      cb(manager)
    ),
  };

  let service: PreparacionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PreparacionService(
      preparacionRepository as any,
      produccionService as any,
      recetaRepository as any,
      dataSource as any
    );
  });

  it('crea una preparación vinculada únicamente a una receta existente', async () => {
    const dto = {
      recetaId: 'receta-1',
      cantidadAProducir: 4,
      observaciones: 'Cocinar a fuego lento',
    };
    const expected = { id: 'prep-1', ...dto };

    recetaRepository.findById.mockResolvedValue({
      id: 'receta-1',
    });
    preparacionRepository.create.mockResolvedValue(expected);

    await expect(service.create(dto as any, 'user-1')).resolves.toEqual(
      expected
    );
    expect(preparacionRepository.create).toHaveBeenCalledWith(dto, 'user-1');
  });

  it('rechaza crear una preparación si la receta no existe', async () => {
    recetaRepository.findById.mockResolvedValue(null);

    await expect(
      service.create(
        { recetaId: 'missing', cantidadAProducir: 1 } as any,
        'user-1'
      )
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('finaliza usando la receta asociada como única fuente de producción', async () => {
    const preparacion = {
      id: 'prep-1',
      recetaId: 'receta-9',
      cantidadAProducir: 6,
      estado: PreparacionEstado.EN_PROCESO,
      ubicacionDestinoId: 'ubicacion-1',
      receta: {
        raciones: 1,
        rendimiento: 1,
      },
    };

    preparacionQb.getOne.mockResolvedValue(preparacion);
    produccionLoteTxRepository.findOne.mockResolvedValue(null);
    produccionService.ejecutarProduccion.mockResolvedValue({ id: 'lote-1' });
    manager.save.mockImplementation((_entity: unknown, value: any) =>
      Promise.resolve(value)
    );

    await service.finalizarPreparacion('prep-1', 'user-1');

    expect(produccionService.ejecutarProduccion).toHaveBeenCalledWith(
      expect.objectContaining({
        recetaId: 'receta-9',
        cantidadAProducir: 6,
        ubicacionDestinoId: 'ubicacion-1',
        idempotencyKey: expect.any(String),
      }),
      'user-1',
      'prep-1',
      manager
    );
    expect(manager.save).toHaveBeenCalledWith(
      Preparacion,
      expect.objectContaining({
        id: 'prep-1',
        estado: PreparacionEstado.COMPLETADA,
      })
    );
  });

  it('trata finalizar como idempotente cuando la preparación ya está completada', async () => {
    const completed = {
      id: 'prep-1',
      estado: PreparacionEstado.COMPLETADA,
    };

    preparacionQb.getOne.mockResolvedValue(completed);

    await expect(
      service.finalizarPreparacion('prep-1', 'user-1', 'ubicacion-1')
    ).resolves.toEqual(completed);
    expect(produccionService.ejecutarProduccion).not.toHaveBeenCalled();
  });

  it('rechaza finalizar una preparación fuera de proceso', async () => {
    preparacionQb.getOne.mockResolvedValue({
      id: 'prep-2',
      estado: PreparacionEstado.PENDIENTE,
    });

    await expect(
      service.finalizarPreparacion('prep-2', 'user-1', 'ubicacion-1')
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('lanza NotFoundException al finalizar una preparación inexistente', async () => {
    preparacionQb.getOne.mockResolvedValue(null);

    await expect(
      service.finalizarPreparacion('prep-404', 'user-1', 'ubicacion-1')
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
