import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CreateMermaDto } from '../../../src/modules/merma/dto/create-merma.dto';
import { CreateMermaProduccionDto } from '../../../src/modules/merma/dto/create-merma-produccion.dto';
import { MotivoMerma } from '../../../src/modules/merma/enums/merma.enums';
import { MermaService } from '../../../src/modules/merma/service/merma.service';

describe('MermaService', () => {
  const mermaRepository = {
    findOne: jest.fn(),
    createQueryBuilder: jest.fn(),
    findAndCount: jest.fn(),
  };

  const productoRepository = {
    findOne: jest.fn(),
  };

  const produccionLoteRepository = {
    findOne: jest.fn(),
  };

  const recetaIngredienteRepository = {
    findOne: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
  };

  let service: MermaService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new MermaService(
      mermaRepository as never,
      productoRepository as never,
      produccionLoteRepository as never,
      recetaIngredienteRepository as never,
      dataSource as unknown as DataSource
    );
  });

  it('debe retornar el mismo evento cuando llega la misma idempotencyKey', async () => {
    const existingMerma = {
      id: 'merma-idempotente',
      productoId: 'producto-1',
      cantidad: 2,
      motivo: MotivoMerma.ROTURA,
    };

    mermaRepository.findOne.mockResolvedValue(existingMerma);

    const dto: CreateMermaDto = {
      productoId: 'producto-1',
      cantidad: 2,
      motivo: MotivoMerma.ROTURA,
      idempotencyKey: '01961496-cc99-7d4d-89f8-e7ac15e809f0',
    };

    const result = await service.create(dto, 'user-1');

    expect(result).toBe(existingMerma);
    expect(dataSource.transaction).not.toHaveBeenCalled();
    expect(productoRepository.findOne).not.toHaveBeenCalled();
  });

  it('debe fallar si el lote de producción no existe', async () => {
    produccionLoteRepository.findOne.mockResolvedValue(null);

    const dto: CreateMermaProduccionDto = {
      produccionLoteId: '01961496-cc99-7d4d-89f8-e7ac15e809f1',
      productoId: '01961496-cc99-7d4d-89f8-e7ac15e809f2',
      cantidad: 1,
      motivo: MotivoMerma.ERROR_PREPARACION,
    };

    await expect(service.createFromProduccion(dto, 'user-2')).rejects.toThrow(
      NotFoundException
    );
  });

  it('debe fallar si el producto no pertenece a la receta del lote', async () => {
    produccionLoteRepository.findOne.mockResolvedValue({
      id: 'lote-1',
      recetaId: 'receta-1',
    });
    recetaIngredienteRepository.findOne.mockResolvedValue(null);

    const dto: CreateMermaProduccionDto = {
      produccionLoteId: '01961496-cc99-7d4d-89f8-e7ac15e809f3',
      productoId: '01961496-cc99-7d4d-89f8-e7ac15e809f4',
      cantidad: 1.5,
      motivo: MotivoMerma.ERROR_PREPARACION,
    };

    await expect(service.createFromProduccion(dto, 'user-3')).rejects.toThrow(
      BadRequestException
    );
  });
});
