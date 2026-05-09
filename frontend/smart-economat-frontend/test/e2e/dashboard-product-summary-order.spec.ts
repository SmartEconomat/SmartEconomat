import { expect, test } from '@playwright/test';

import { bootstrapSession, installApiMocks } from './helpers/session';

function okJson(data: unknown, message = 'ok') {
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      statusCode: 200,
      success: true,
      message,
      data,
    }),
  };
}

test.describe('Dashboard - resumen de productos', () => {
  test('solicita productos ordenados por fecha de creación descendente', async ({
    page,
  }) => {
    await bootstrapSession(page);
    await installApiMocks(page);

    await page.route('**/api/v1/usuarios/perfil', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-dashboard-productos-user-id',
          username: 'qa-dashboard-productos',
          nombre: 'QA Dashboard Productos',
          email: 'qa-dashboard-productos@smarteconomat.local',
          rol: 'admin',
          permisos: ['dashboard:ver_estadisticas', 'productos:listar'],
        })
      );
    });

    await page.route('**/api/v1/dashboard/stats', async (route) => {
      await route.fulfill(
        okJson({
          totalProductos: 0,
          productosEsteMes: 0,
          totalProveedores: 0,
          inventario: {
            valorTotal: 0,
            totalItems: 0,
            itemsBajoStock: 0,
          },
          pedidos: {
            pendientes: 0,
            completadosHoy: 0,
            incidencias: 0,
            costeTotalPendiente: 0,
          },
          alertas: {
            porCaducar: 0,
            caducados: 0,
          },
          movimientosRecientes: [],
        })
      );
    });

    let productosRequestUrl: string | null = null;
    await page.route('**/api/v1/productos**', async (route) => {
      productosRequestUrl = route.request().url();
      await route.fulfill(
        okJson({
          data: [],
          total: 0,
          totalPages: 1,
          page: 1,
          limit: 50,
        })
      );
    });

    await page.goto('/', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('banner', { name: 'Cabecera superior' })
    ).toBeVisible({ timeout: 15000 });

    const skipTutorialButton = page.getByRole('button', {
      name: 'Saltar todo el tutorial',
    });
    if (await skipTutorialButton.isVisible().catch(() => false)) {
      await skipTutorialButton.click();
    }

    const productosMetricCard = page
      .locator('#dashboard-stats [role="button"]')
      .filter({
        hasText: /total productos|dashboard\.metrics\.totalProductos/i,
      })
      .first();

    await expect(productosMetricCard).toBeVisible();
    await productosMetricCard.click();

    await expect(
      page.getByRole('dialog', { name: /productos/i })
    ).toBeVisible();

    await expect
      .poll(() => {
        if (!productosRequestUrl) {
          return null;
        }

        const url = new URL(productosRequestUrl);
        return {
          page: url.searchParams.get('page'),
          limit: url.searchParams.get('limit'),
          sortBy: url.searchParams.get('sortBy'),
          order: url.searchParams.get('order'),
        };
      })
      .toEqual({
        page: '1',
        limit: '50',
        sortBy: 'createdAt',
        order: 'DESC',
      });
  });
});
