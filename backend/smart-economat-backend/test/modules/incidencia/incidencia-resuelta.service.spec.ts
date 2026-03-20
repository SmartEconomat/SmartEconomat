import { BadRequestException, NotFoundException } from '@nestjs/common';
import { IncidenciaResuelaService } from '../../../src/modules/incidencia/service/incidencia-resuelta.service';

describe('IncidenciaResuelaService', () => {
  const mockRepo = {
    findByIncidencia: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findAllPaginated: jest.fn(),
    findOne: jest.fn(),
    merge: jest.fn(),
    remove: jest.fn(),
    softDelete: jest.fn(),
  };
  const mockIncidenciaRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
  };

  let service: IncidenciaResuelaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new IncidenciaResuelaService(
      mockRepo as any,
      mockIncidenciaRepo as any
    );
  });

  it('create rechaza incidencias inexistentes', async () => {
    mockIncidenciaRepo.findOne.mockResolvedValue(null);

    await expect(
      service.create({ idIncidencia: 'inc-1' } as any)
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('create rechaza incidencias ya resueltas', async () => {
    mockIncidenciaRepo.findOne.mockResolvedValue({ id: 'inc-2' });
    mockRepo.findByIncidencia.mockResolvedValue({ id: 'res-1' });

    await expect(
      service.create({ idIncidencia: 'inc-2' } as any)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('remove revierte el estado de la incidencia al eliminar la resolución', async () => {
    const incidencia = {
      fechaResolucion: new Date(),
      usuarioResolutor: { id: 'user-1' },
      observacionesResolucion: 'ok',
    };
    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'res-2',
      incidencia,
    } as any);
    mockIncidenciaRepo.save.mockResolvedValue(undefined);
    mockRepo.remove.mockResolvedValue(undefined);

    await service.remove('res-2');

    expect(incidencia.fechaResolucion).toBeNull();
    expect(incidencia.usuarioResolutor).toBeUndefined();
    expect(incidencia.observacionesResolucion).toBeUndefined();
    expect(mockRepo.softDelete).toHaveBeenCalledWith('res-2');
  });
});
