import { DashboardService } from '../../../src/modules/dashboard/service/dashboard.service';

/**
 * Tests de regresión para DASHBOARD-001:
 * getStats() debe incluir generatedAt para que el cliente sepa la antigüedad del dato cacheado.
 */
describe('DashboardService — generatedAt en respuesta', () => {
  const inventoryValueQb = {
    leftJoinAndSelect: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };
  const lowStockQb = {
    where: jest.fn().mockReturnThis(),
    getCount: jest.fn(),
  };
  const pendingCostQb = {
    select: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    getRawOne: jest.fn(),
  };

  const mockInventarioRepo = {
    createQueryBuilder: jest
      .fn()
      .mockImplementationOnce(() => inventoryValueQb)
      .mockImplementationOnce(() => lowStockQb),
    count: jest.fn(),
  };
  const mockPedidoRepo = {
    count: jest.fn(),
    createQueryBuilder: jest.fn().mockReturnValue(pendingCostQb),
  };
  const mockMovimientoRepo = {
    find: jest.fn(),
  };
  const mockProductoRepo = {
    count: jest.fn(),
    find: jest.fn(),
  };
  const mockProveedorRepo = {
    count: jest.fn(),
  };
  const mockIncidenciaRepo = {
    count: jest.fn(),
  };

  let service: DashboardService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockInventarioRepo.createQueryBuilder.mockReset();
    mockInventarioRepo.createQueryBuilder
      .mockImplementationOnce(() => inventoryValueQb)
      .mockImplementationOnce(() => lowStockQb);

    inventoryValueQb.getRawOne.mockResolvedValue({ valorTotal: '0' });
    lowStockQb.getCount.mockResolvedValue(0);
    mockInventarioRepo.count.mockResolvedValue(0);
    mockPedidoRepo.count.mockResolvedValue(0);
    mockIncidenciaRepo.count.mockResolvedValue(0);
    pendingCostQb.getRawOne.mockResolvedValue({ costeTotal: null });
    mockProductoRepo.count.mockResolvedValue(0);
    mockProveedorRepo.count.mockResolvedValue(0);
    mockMovimientoRepo.find.mockResolvedValue([]);

    service = new DashboardService(
      mockInventarioRepo as any,
      mockPedidoRepo as any,
      mockMovimientoRepo as any,
      mockProductoRepo as any,
      mockProveedorRepo as any,
      mockIncidenciaRepo as any
    );
  });

  it('devuelve generatedAt como instancia de Date', async () => {
    const result = await service.getStats();

    expect(result.generatedAt).toBeInstanceOf(Date);
    expect(result.generatedAt.getTime()).toBeLessThanOrEqual(Date.now());
  });
});
