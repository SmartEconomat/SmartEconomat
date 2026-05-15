import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchAppNotifications } from '../../src/services/notifications.service';
import * as inventarioService from '../../src/services/inventario.service';
import type { InventarioItem } from '../../src/services/inventario.types';

vi.mock('../../src/services/inventario.service', async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import('../../src/services/inventario.service')
    >();
  return {
    ...actual,
    fetchAllInventarioForExport: vi.fn(),
    fetchAlertasStock: vi.fn(),
  };
});

interface BuildInventarioItemInput {
  id: string;
  productoId: string;
  nombreProducto: string;
  cantidadActual: number;
  cantidadMinima: number;
  fechaCaducidad?: string | null;
}

const buildInventarioItem = ({
  id,
  productoId,
  nombreProducto,
  cantidadActual,
  cantidadMinima,
  fechaCaducidad = null,
}: BuildInventarioItemInput): InventarioItem => ({
  id,
  cantidadActual,
  cantidadMinima,
  fechaCaducidad,
  productoProveedor: {
    id: `pp-${id}`,
    producto: {
      id: productoId,
      nombre: nombreProducto,
      unidad: 'kg',
      tipo: 'VERDURA',
    },
    proveedor: {
      id: 'prov-1',
      nombre: 'Proveedor',
    },
  },
});

describe('notifications.service inventory alerts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('incluye notificacion urgente cuando hay productos bajo minimo en alertas de stock', async () => {
    vi.mocked(inventarioService.fetchAllInventarioForExport).mockResolvedValue(
      []
    );
    vi.mocked(inventarioService.fetchAlertasStock).mockResolvedValue([
      {
        id: 'inv-1',
        cantidadActual: 1,
        cantidadMinima: 5,
        nombreProducto: 'Tomate',
      },
      {
        id: 'inv-2',
        cantidadActual: 2,
        cantidadMinima: 8,
        nombreProducto: 'Lechuga',
      },
    ]);

    const notifications = await fetchAppNotifications({
      includePendingUsers: false,
      includeInventoryAlerts: true,
      forceRefresh: true,
    });

    const lowStockNotification = notifications.find(
      (notification) => notification.id === 'low-stock-products'
    );

    expect(lowStockNotification).toMatchObject({
      priority: 'urgent',
      count: 2,
      actionPath: '/inventario',
    });
  });

  it('usa fallback al inventario cuando falla el endpoint de alertas de stock', async () => {
    vi.mocked(inventarioService.fetchAlertasStock).mockRejectedValue(
      new Error('alertas no disponibles')
    );

    vi.mocked(inventarioService.fetchAllInventarioForExport).mockResolvedValue([
      buildInventarioItem({
        id: 'inv-3',
        productoId: 'prod-1',
        nombreProducto: 'Cebolla',
        cantidadActual: 1,
        cantidadMinima: 5,
      }),
      buildInventarioItem({
        id: 'inv-4',
        productoId: 'prod-2',
        nombreProducto: 'Zanahoria',
        cantidadActual: 10,
        cantidadMinima: 3,
      }),
    ]);

    const notifications = await fetchAppNotifications({
      includePendingUsers: false,
      includeInventoryAlerts: true,
      forceRefresh: true,
    });

    const lowStockNotification = notifications.find(
      (notification) => notification.id === 'low-stock-products'
    );

    expect(lowStockNotification).toBeDefined();
    expect(lowStockNotification?.count).toBe(1);
    expect(lowStockNotification?.description).toContain('1 producto');
  });

  it('mantiene simultaneamente alertas de bajo stock y caducidad vencida', async () => {
    vi.mocked(inventarioService.fetchAlertasStock).mockResolvedValue([
      {
        id: 'inv-5',
        cantidadActual: 1,
        cantidadMinima: 3,
        nombreProducto: 'Pimiento',
      },
    ]);

    vi.mocked(inventarioService.fetchAllInventarioForExport).mockResolvedValue([
      buildInventarioItem({
        id: 'inv-6',
        productoId: 'prod-3',
        nombreProducto: 'Pimiento',
        cantidadActual: 1,
        cantidadMinima: 3,
        fechaCaducidad: '2000-01-01T00:00:00.000Z',
      }),
    ]);

    const notifications = await fetchAppNotifications({
      includePendingUsers: false,
      includeInventoryAlerts: true,
      forceRefresh: true,
    });

    const ids = notifications.map((notification) => notification.id);

    expect(ids).toContain('low-stock-products');
    expect(ids).toContain('expired-products');
  });
});
