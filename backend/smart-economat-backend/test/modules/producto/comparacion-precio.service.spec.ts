import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProductoProveedorService } from '../../../src/modules/producto/service/producto-proveedor.service';

describe('ProductoProveedorService - updateMerma y compararProveedores', () => {
  const mockDataSource = {
    transaction: jest.fn(),
    getRepository: jest.fn(),
    manager: { findOne: jest.fn() },
  };

  let service: ProductoProveedorService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProductoProveedorService(mockDataSource as any);
  });

  describe('updateMerma', () => {
    it('lanza NotFoundException si no existe el producto-proveedor', async () => {
      const manager = {
        findOne: jest.fn().mockResolvedValue(null),
        save: jest.fn(),
      };
      mockDataSource.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.updateMerma('missing-id', { nuevaMerma: 5 } as any)
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('lanza ConflictException si la merma no cambia', async () => {
      const manager = {
        findOne: jest.fn().mockResolvedValue({ id: 'pp-1', mermaEsperada: 5 }),
        save: jest.fn(),
      };
      mockDataSource.transaction.mockImplementation((cb) => cb(manager));

      await expect(
        service.updateMerma('pp-1', { nuevaMerma: 5 } as any)
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('actualiza y persiste la nueva merma', async () => {
      const pp = { id: 'pp-2', mermaEsperada: 3 };
      const manager = {
        findOne: jest.fn().mockResolvedValue(pp),
        save: jest.fn().mockResolvedValue({ ...pp, mermaEsperada: 8 }),
      };
      mockDataSource.transaction.mockImplementation((cb) => cb(manager));

      const result = await service.updateMerma('pp-2', {
        nuevaMerma: 8,
      } as any);

      expect(manager.save).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ mermaEsperada: 8 })
      );
      expect(result.mermaEsperada).toBe(8);
    });
  });

  describe('compararProveedores', () => {
    const buildQb = (rows: any[]) => ({
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getMany: jest.fn().mockResolvedValue(rows),
    });

    it('lanza NotFoundException si no hay proveedores con precio', async () => {
      mockDataSource.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(buildQb([])),
      });

      await expect(
        service.compararProveedores('prod-vacio')
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('devuelve proveedor único como óptimo con ahorro 0', async () => {
      const rows = [
        {
          id: 'pp-1',
          marca: undefined,
          precioUnitario: 10,
          mermaEsperada: 5,
          producto: { id: 'prod-1', nombre: 'Tomate' },
          proveedor: { id: 'prov-1', nombre: 'FruitCo' },
        },
      ];
      mockDataSource.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(buildQb(rows)),
      });

      const result = await service.compararProveedores('prod-1');

      expect(result.productoNombre).toBe('Tomate');
      expect(result.proveedores).toHaveLength(1);
      expect(result.proveedores[0].esOptimo).toBe(true);
      expect(result.proveedores[0].ahorroAbsoluto).toBe(0);
      expect(result.proveedores[0].ahorroAbsolutoPct).toBe(0);
      expect(result.proveedores[0].costeEfectivoUnitario).toBe(10.5263);
    });

    it('ordena por coste efectivo y calcula ahorro correctamente', async () => {
      const rows = [
        {
          id: 'pp-a',
          marca: undefined,
          precioUnitario: 10,
          mermaEsperada: 10,
          producto: { id: 'prod-2', nombre: 'Cebolla' },
          proveedor: { id: 'prov-a', nombre: 'ProvA' },
        },
        {
          id: 'pp-b',
          marca: undefined,
          precioUnitario: 10.5,
          mermaEsperada: 2,
          producto: { id: 'prod-2', nombre: 'Cebolla' },
          proveedor: { id: 'prov-b', nombre: 'ProvB' },
        },
      ];
      mockDataSource.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(buildQb(rows)),
      });

      const result = await service.compararProveedores('prod-2');

      expect(result.proveedores[0].proveedorNombre).toBe('ProvB');
      expect(result.proveedores[0].esOptimo).toBe(true);
      expect(result.proveedores[0].costeEfectivoUnitario).toBe(10.7143);

      expect(result.proveedores[1].proveedorNombre).toBe('ProvA');
      expect(result.proveedores[1].esOptimo).toBe(false);
      expect(result.proveedores[1].costeEfectivoUnitario).toBe(11.1111);

      expect(result.proveedores[0].ahorroAbsoluto).toBe(0.3968);
      expect(result.proveedores[0].ahorroAbsolutoPct).toBeCloseTo(3.57, 1);

      expect(result.proveedores[1].ahorroAbsoluto).toBe(0);
      expect(result.proveedores[1].ahorroAbsolutoPct).toBe(0);
    });

    it('proveedor con mayor merma pierde aunque tenga precio base menor', async () => {
      const rows = [
        {
          id: 'pp-barato',
          marca: undefined,
          precioUnitario: 5,
          mermaEsperada: 30,
          producto: { id: 'prod-3', nombre: 'Lechuga' },
          proveedor: { id: 'prov-barato', nombre: 'ProvBarato' },
        },
        {
          id: 'pp-calidad',
          marca: undefined,
          precioUnitario: 6,
          mermaEsperada: 3,
          producto: { id: 'prod-3', nombre: 'Lechuga' },
          proveedor: { id: 'prov-calidad', nombre: 'ProvCalidad' },
        },
      ];
      mockDataSource.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(buildQb(rows)),
      });

      const result = await service.compararProveedores('prod-3');

      expect(result.proveedores[0].proveedorNombre).toBe('ProvCalidad');
      expect(result.proveedores[0].esOptimo).toBe(true);
      expect(result.proveedores[1].proveedorNombre).toBe('ProvBarato');
      expect(result.proveedores[1].esOptimo).toBe(false);
    });

    it('trata mermaEsperada null como 0', async () => {
      const rows = [
        {
          id: 'pp-null',
          marca: undefined,
          precioUnitario: 8,
          mermaEsperada: null,
          producto: { id: 'prod-4', nombre: 'Arroz' },
          proveedor: { id: 'prov-x', nombre: 'ProvX' },
        },
      ];
      mockDataSource.getRepository.mockReturnValue({
        createQueryBuilder: jest.fn().mockReturnValue(buildQb(rows)),
      });

      const result = await service.compararProveedores('prod-4');

      expect(result.proveedores[0].mermaEsperada).toBe(0);
      expect(result.proveedores[0].costeEfectivoUnitario).toBe(8);
    });
  });
});
