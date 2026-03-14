import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MovimientoService } from '../../../src/modules/movimiento/service/movimiento.service';

describe('MovimientoService', () => {
  const mockRepo = {
    createMovimiento: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateMovimiento: jest.fn(),
    deleteMovimiento: jest.fn(),
    findMovimientosByEntity: jest.fn(),
  };

  let service: MovimientoService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MovimientoService(mockRepo as any);
  });

  it('getMovimientoHistory exige entityId o userId', async () => {
    await expect(
      service.getMovimientoHistory({} as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getMovimientoHistory rechaza rangos de fechas inválidos', async () => {
    await expect(
      service.getMovimientoHistory({
        entityId: 'ent-1',
        startDate: '2026-03-20',
        endDate: '2026-03-10',
      } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('getMovimientoHistory lanza NotFoundException sin resultados', async () => {
    mockRepo.findMovimientosByEntity.mockResolvedValue([]);

    await expect(
      service.getMovimientoHistory({ entityId: 'ent-2' } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('getMovimientoHistory devuelve los movimientos filtrados y respeta orden personalizado', async () => {
    mockRepo.findMovimientosByEntity.mockResolvedValue([
      { id: 'mov-1', tipo: 'entrada', cantidad: 1 },
      { id: 'mov-2', tipo: 'entrada', cantidad: 2 },
    ]);

    const dto = {
      entityId: 'ent-3',
      type: 'entrada',
      sortBy: 'cantidad',
      sortOrder: 'ASC',
    };
    const result = await service.getMovimientoHistory(dto as any);

    expect(mockRepo.findMovimientosByEntity).toHaveBeenCalledWith(dto);
    expect(result).toEqual([
      { id: 'mov-1', tipo: 'entrada', cantidad: 1 },
      { id: 'mov-2', tipo: 'entrada', cantidad: 2 },
    ]);
  });
});
