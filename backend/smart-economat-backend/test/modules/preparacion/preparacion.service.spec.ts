import { ConflictException, NotFoundException } from '@nestjs/common';
import { PreparacionService } from '../../../src/modules/preparacion/service/preparacion.service';
import { PreparacionEstado } from '../../../src/modules/preparacion/enums/preparacion.enums';

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

  let service: PreparacionService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PreparacionService(
      preparacionRepository as any,
      produccionService as any,
      recetaRepository as any
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
    };

    jest.spyOn(service, 'findOne').mockResolvedValue(preparacion as any);
    produccionService.ejecutarProduccion.mockResolvedValue({ id: 'lote-1' });
    preparacionRepository.save.mockImplementation((value: any) =>
      Promise.resolve(value)
    );

    await service.finalizarPreparacion('prep-1', 'user-1');

    expect(produccionService.ejecutarProduccion).toHaveBeenCalledWith(
      {
        recetaId: 'receta-9',
        cantidadProducida: 6,
        ubicacionDestinoId: 'ubicacion-1',
      },
      'user-1',
      'prep-1'
    );
    expect(preparacionRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'prep-1',
        estado: PreparacionEstado.COMPLETADA,
      })
    );
  });

  it('rechaza finalizar una preparación fuera de proceso', async () => {
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'prep-2',
      estado: PreparacionEstado.PENDIENTE,
    } as any);

    await expect(
      service.finalizarPreparacion('prep-2', 'user-1', 'ubicacion-1')
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
