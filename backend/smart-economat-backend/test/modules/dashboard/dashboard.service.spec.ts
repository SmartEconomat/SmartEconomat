import { DashboardService } from '../../../src/modules/dashboard/service/dashboard.service';
import { EstadoPedido } from '../../../src/modules/pedido/enums/estado-pedido.enum';

describe('DashboardService', () => {
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

    service = new DashboardService(
      mockInventarioRepo as any,
      mockPedidoRepo as any,
      mockMovimientoRepo as any,
      mockProductoRepo as any,
      mockProveedorRepo as any,
      mockIncidenciaRepo as any
    );
  });

  it('getStats calcula valorTotal, stock bajo y últimos 5 movimientos', async () => {
    inventoryValueQb.getRawOne.mockResolvedValue({ valorTotal: '123.50' });
    lowStockQb.getCount.mockResolvedValue(2);
    mockInventarioRepo.count
      .mockResolvedValueOnce(10)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(1);
    mockPedidoRepo.count.mockResolvedValueOnce(4).mockResolvedValueOnce(2);
    mockIncidenciaRepo.count.mockResolvedValueOnce(1);
    pendingCostQb.getRawOne.mockResolvedValue({ costeTotal: '44.25' });
    mockProductoRepo.count.mockResolvedValueOnce(8).mockResolvedValueOnce(2);
    mockProveedorRepo.count.mockResolvedValue(5);
    mockMovimientoRepo.find.mockResolvedValue([
      { id: 'mov-1', entidad: 'PRODUCTO', entidadId: 'prod-1' },
      { id: 'mov-2', entidad: 'PEDIDO', entidadId: 'ped-1' },
    ]);
    mockProductoRepo.find.mockResolvedValue([
      { id: 'prod-1', nombre: 'Leche' },
    ]);

    const result = await service.getStats();

    expect(mockPedidoRepo.count).toHaveBeenNthCalledWith(1, {
      where: {
        estado: expect.anything(),
      },
    });
    expect(result.inventario).toEqual({
      valorTotal: 123.5,
      totalItems: 10,
      itemsBajoStock: 2,
    });
    expect(result.pedidos).toEqual({
      pendientes: 4,
      completadosHoy: 2,
      costeTotalPendiente: 44.25,
      incidencias: 1,
    });
    expect(result.alertas).toEqual({ porCaducar: 3, caducados: 1 });
    expect(result.movimientosRecientes[0]).toMatchObject({
      id: 'mov-1',
      productoNombre: 'Leche',
    });
  });

  it('getStats filtra pedidos pendientes por PENDIENTE, EN_PROCESO e INCIDENCIA', async () => {
    inventoryValueQb.getRawOne.mockResolvedValue({ valorTotal: '0' });
    lowStockQb.getCount.mockResolvedValue(0);
    mockInventarioRepo.count.mockResolvedValue(0);
    mockPedidoRepo.count.mockResolvedValue(0);
    mockIncidenciaRepo.count.mockResolvedValue(0);
    pendingCostQb.getRawOne.mockResolvedValue({ costeTotal: '0' });
    mockProductoRepo.count.mockResolvedValue(0);
    mockProveedorRepo.count.mockResolvedValue(0);
    mockMovimientoRepo.find.mockResolvedValue([]);
    mockProductoRepo.find.mockResolvedValue([]);

    await service.getStats();

    expect(mockPedidoRepo.count.mock.calls[0][0]).toEqual({
      where: {
        estado: expect.objectContaining({
          _value: [
            EstadoPedido.PENDIENTE,
            EstadoPedido.EN_PROCESO,
            EstadoPedido.INCIDENCIA,
          ],
        }),
      },
    });
  });
});
