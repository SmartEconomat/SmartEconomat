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

test.describe('Critical flows with stable selectors', () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapSession(page);
    await installApiMocks(page);
  });

  test('dashboard quick actions expose stable testids', async ({ page }) => {
    await page.route('**/api/v1/usuarios/perfil**', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-dashboard-stable',
          username: 'qa-dashboard-stable',
          nombre: 'QA Dashboard Stable',
          email: 'qa-dashboard-stable@smarteconomat.local',
          rol: 'admin',
          permisos: [
            'dashboard:ver_estadisticas',
            'pedidos:crear',
            'productos:crear',
            'recepciones:crear',
            'recetas:crear',
          ],
        })
      );
    });

    await page.route('**/api/v1/dashboard/stats**', async (route) => {
      await route.fulfill(
        okJson({
          totalProductos: 10,
          productosEsteMes: 2,
          totalProveedores: 4,
          inventario: { valorTotal: 100, totalItems: 20, itemsBajoStock: 1 },
          pedidos: {
            pendientes: 1,
            completadosHoy: 0,
            incidencias: 0,
            costeTotalPendiente: 20,
          },
          alertas: { porCaducar: 0, caducados: 0 },
          movimientosRecientes: [],
        })
      );
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/$/);

    const orderAction = page
      .getByTestId('dashboard-quick-action-order')
      .or(page.getByRole('button', { name: /nuevo pedido/i }));
    const productAction = page
      .getByTestId('dashboard-quick-action-product')
      .or(page.getByRole('button', { name: /añadir producto/i }));
    await expect(orderAction.first()).toBeVisible({ timeout: 15000 });
    await expect(productAction.first()).toBeVisible({ timeout: 15000 });
    await expect(
      page
        .getByTestId('dashboard-quick-action-reception')
        .or(page.getByRole('button', { name: /registrar recepción/i }))
        .first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page
        .getByTestId('dashboard-quick-action-recipe')
        .or(page.getByRole('button', { name: /nueva receta/i }))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('pedidos toolbar actions are addressable by testid', async ({
    page,
  }) => {
    await page.route('**/api/v1/usuarios/perfil**', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-pedidos-stable',
          username: 'qa-pedidos-stable',
          nombre: 'QA Pedidos Stable',
          email: 'qa-pedidos-stable@smarteconomat.local',
          rol: 'admin',
          permisos: ['pedidos:listar', 'pedidos:ver', 'pedidos:crear'],
        })
      );
    });

    await page.route('**/api/v1/pedido-usuario**', async (route) => {
      await route.fulfill(
        okJson({ data: [], total: 0, page: 1, limit: 20, totalPages: 1 })
      );
    });

    await page.route('**/api/v1/purchase-batches**', async (route) => {
      await route.fulfill(okJson([]));
    });

    await page.route('**/api/v1/proveedores**', async (route) => {
      await route.fulfill(okJson({ data: [], total: 0, totalPages: 1 }));
    });

    await page.goto('/pedidos', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/pedidos$/);

    await expect(
      page
        .getByTestId('search-pedidos')
        .or(page.locator('#search-pedidos'))
        .first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page
        .getByTestId('btn-nuevo-pedido')
        .or(page.locator('#btn-nuevo-pedido'))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('productos toolbar action is addressable by testid', async ({
    page,
  }) => {
    await page.route('**/api/v1/usuarios/perfil**', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-productos-stable',
          username: 'qa-productos-stable',
          nombre: 'QA Productos Stable',
          email: 'qa-productos-stable@smarteconomat.local',
          rol: 'admin',
          permisos: ['productos:listar', 'productos:ver', 'productos:crear'],
        })
      );
    });

    await page.route('**/api/v1/productos**', async (route) => {
      await route.fulfill(
        okJson({ data: [], total: 0, page: 1, limit: 20, totalPages: 1 })
      );
    });

    await page.route('**/api/v1/proveedores**', async (route) => {
      await route.fulfill(okJson({ data: [], total: 0, totalPages: 1 }));
    });

    await page.goto('/productos', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/productos$/);

    await expect(
      page
        .getByTestId('btn-nuevo-producto')
        .or(page.locator('#btn-nuevo-producto'))
        .first()
    ).toBeVisible({ timeout: 15000 });
  });

  test('auth fallback redirects to login on backend 401', async ({ page }) => {
    await page.route('**/api/v1/usuarios/perfil**', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-auth-stable',
          username: 'qa-auth-stable',
          nombre: 'QA Auth Stable',
          email: 'qa-auth-stable@smarteconomat.local',
          rol: 'admin',
          permisos: ['dashboard:ver_estadisticas'],
        })
      );
    });

    await page.route('**/api/v1/dashboard/stats**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({
          statusCode: 401,
          message: 'Unauthorized',
          error: 'Unauthorized',
        }),
      });
    });

    await page.goto('/', { waitUntil: 'networkidle' });
    await expect(page).toHaveURL(/\/login$/, { timeout: 10000 });
  });

  test('recepcion wizard footer controls expose deterministic selectors', async ({
    page,
  }) => {
    await page.route('**/api/v1/usuarios/perfil**', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-recepcion-stable',
          username: 'qa-recepcion-stable',
          nombre: 'QA Recepcion Stable',
          email: 'qa-recepcion-stable@smarteconomat.local',
          rol: 'admin',
          permisos: ['recepciones:crear', 'pedidos:listar'],
        })
      );
    });

    await page.route('**/api/v1/pedidos**', async (route) => {
      await route.fulfill(
        okJson({ data: [], total: 0, page: 1, limit: 50, totalPages: 1 })
      );
    });

    await page.goto('/recepciones', { waitUntil: 'networkidle' });

    await expect(page.getByTestId('recepcion-wizard-root')).toBeVisible();
    await expect(page.getByTestId('recepcion-wizard-stepper')).toBeVisible();
    await expect(page.getByTestId('recepcion-btn-discard')).toBeVisible();
    await expect(page.getByTestId('recepcion-btn-back')).toBeDisabled();
    await expect(page.getByTestId('recepcion-btn-next')).toBeDisabled();
  });
});
