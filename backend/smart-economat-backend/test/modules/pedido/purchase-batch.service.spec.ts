import { Test, TestingModule } from '@nestjs/testing';
import { PurchaseBatchService } from '../../../src/modules/pedido/service/purchase-batch.service';
import { DataSource } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { MovimientoHelper } from '../../../src/common/helpers/movimiento.helper';
import { PurchaseBatch } from '../../../src/modules/pedido/purchase-batch.entity/purchase-batch.entity';
import { EstadoLote } from '../../../src/modules/pedido/enums/estado-lote.enum';
import { NotFoundException } from '@nestjs/common';
import { ProduccionService } from '../../../src/modules/receta/service/produccion.service';

describe('PurchaseBatchService', () => {
  let service: PurchaseBatchService;

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
      insert: jest.fn(),
      find: jest.fn(),
      findOne: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn().mockReturnValue(mockQueryRunner),
    getRepository: jest.fn().mockReturnValue({
      find: jest.fn(),
      findOne: jest.fn(),
      save: jest.fn(),
    }),
  };

  const mockConfigService = {
    get: jest.fn().mockReturnValue(48),
  };

  const mockMovimientoHelper = {
    trackPedidoCreation: jest.fn(),
  };

  const mockProduccionService = {
    validarMultiple: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PurchaseBatchService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: MovimientoHelper, useValue: mockMovimientoHelper },
        { provide: ProduccionService, useValue: mockProduccionService },
      ],
    }).compile();

    service = module.get<PurchaseBatchService>(PurchaseBatchService);
  });

  it('debería estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('createBatchOrder', () => {
    const userId = 'user-123';
    const dto = {
      observaciones: 'Test batch',
      lineas: [
        { productoProveedorId: 'pp-1', cantidad: 10 },
        { productoProveedorId: 'pp-2', cantidad: 5 },
      ],
    };

    it('debería crear un lote y agrupar pedidos por proveedor', async () => {
      const mockBatch = { id: 'batch-1', ...dto, estado: EstadoLote.PENDIENTE };
      const mockPP1 = {
        id: 'pp-1',
        proveedorId: 'prov-1',
        proveedor: { id: 'prov-1' },
        precioUnitario: 10,
      };
      const mockPP2 = {
        id: 'pp-2',
        proveedorId: 'prov-2',
        proveedor: { id: 'prov-2' },
        precioUnitario: 20,
      };

      mockQueryRunner.manager.create.mockReturnValue(mockBatch);
      mockQueryRunner.manager.save.mockResolvedValue(mockBatch);
      mockQueryRunner.manager.insert.mockResolvedValue(undefined);
      mockQueryRunner.manager.find.mockResolvedValue([mockPP1, mockPP2]);

      mockDataSource.getRepository().findOne.mockResolvedValue(mockBatch);

      const result = await service.createBatchOrder(dto as any, userId);

      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.create).toHaveBeenCalledWith(
        PurchaseBatch,
        expect.any(Object)
      );
      expect(mockQueryRunner.manager.insert).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(result).toEqual(mockBatch);
    });

    it('debería lanzar NotFoundException si un productoProveedor no existe', async () => {
      mockQueryRunner.manager.find.mockResolvedValue([]);

      await expect(
        service.createBatchOrder(dto as any, userId)
      ).rejects.toThrow(NotFoundException);
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
    });
  });

  describe('syncBatchStatus', () => {
    it('debería actualizar el estado del lote basado en sus pedidos', async () => {
      const mockBatch = {
        id: 'batch-1',
        estado: EstadoLote.PENDIENTE,
        pedidos: [{ estado: 'RECIBIDO' }],
      };

      mockDataSource.getRepository().findOne.mockResolvedValue(mockBatch);

      const calcEnumSpy = jest
        .spyOn(PurchaseBatch, 'calcularEstadoLote')
        .mockReturnValue(EstadoLote.COMPLETADO);

      await service.syncBatchStatus('batch-1');

      expect(mockDataSource.getRepository().save).toHaveBeenCalledWith(
        expect.objectContaining({
          estado: EstadoLote.COMPLETADO,
        })
      );

      calcEnumSpy.mockRestore();
    });
  });
});
