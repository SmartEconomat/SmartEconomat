import { Test, TestingModule } from '@nestjs/testing';
import { PedidoDraftService } from './pedido-draft.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PedidoDraft } from '../pedido-draft.entity/pedido-draft.entity';
import { PEDIDO_DRAFT_REDIS } from '../constants/pedido-draft.constants';
import { PurchaseBatchService } from '../../pedido/service/purchase-batch.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('PedidoDraftService', () => {
  let service: PedidoDraftService;
  let repository: any;
  let redisClient: any;
  let purchaseBatchService: any;

  const mockRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    merge: jest.fn(),
    softDelete: jest.fn(),
  };

  const mockRedisClient = {
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    status: 'ready',
    quit: jest.fn(),
  };

  const mockPurchaseBatchService = {
    createBatchOrder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PedidoDraftService,
        {
          provide: getRepositoryToken(PedidoDraft),
          useValue: mockRepository,
        },
        {
          provide: PEDIDO_DRAFT_REDIS,
          useValue: mockRedisClient,
        },
        {
          provide: PurchaseBatchService,
          useValue: mockPurchaseBatchService,
        },
      ],
    }).compile();

    service = module.get<PedidoDraftService>(PedidoDraftService);
    repository = module.get(getRepositoryToken(PedidoDraft));
    redisClient = module.get(PEDIDO_DRAFT_REDIS);
    purchaseBatchService = module.get(PurchaseBatchService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('upsertDraft', () => {
    const userId = 'user-1';

    it('debería guardar en caché si no hay conflictos', async () => {
      redisClient.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue({ id: 'new-id' });
      repository.save.mockResolvedValue({
        id: 'new-id',
        usuarioId: userId,
        draftVersion: 1,
        payload: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.upsertDraft(userId, { payload: {} });

      expect(redisClient.set).toHaveBeenCalled();
      expect(result.version).toBe(1);
    });

    it('debería lanzar ConflictException si la versión es antigua', async () => {
      const existingDraft = { version: 5, payload: {} };
      redisClient.get.mockResolvedValue(JSON.stringify(existingDraft));

      await expect(
        service.upsertDraft(userId, { payload: {}, version: 3 })
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('finalizeOrder', () => {
    it('debería llamar a purchaseBatchService y limpiar el borrador', async () => {
      const draft = { userId: 'u1', payload: { lineas: [] }, version: 1 };
      redisClient.get.mockResolvedValue(JSON.stringify(draft));
      purchaseBatchService.createBatchOrder.mockResolvedValue({
        id: 'batch-1',
      });

      const result = await service.finalizeOrder('u1');

      expect(purchaseBatchService.createBatchOrder).toHaveBeenCalled();
      expect(redisClient.del).toHaveBeenCalled();
      expect(result.id).toBe('batch-1');
    });

    it('debería lanzar NotFoundException si no hay borrador', async () => {
      redisClient.get.mockResolvedValue(null);
      repository.findOne.mockResolvedValue(null);

      await expect(service.finalizeOrder('u1')).rejects.toThrow(
        NotFoundException
      );
    });
  });
});
