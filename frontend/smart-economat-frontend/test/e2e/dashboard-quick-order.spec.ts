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

test.describe('Dashboard - acción rápida nuevo pedido', () => {
  test.beforeEach(async ({ page }) => {
    await bootstrapSession(page);
    await installApiMocks(page);

    await page.route('**/api/v1/usuarios/perfil', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-dashboard-user-id',
          username: 'qa-dashboard',
          nombre: 'QA Dashboard',
          email: 'qa-dashboard@smarteconomat.local',
          rol: 'admin',
          permisos: ['dashboard:ver_estadisticas', 'pedidos:crear'],
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
  });

  test('permite buscar producto por identificador y editar precio unidad', async ({
    page,
  }) => {
    const searchedTerms: string[] = [];

    await page.route('**/api/v1/producto-proveedor/search**', async (route) => {
      const requestUrl = new URL(route.request().url());
      const q = (requestUrl.searchParams.get('q') ?? '').trim();
      if (q) {
        searchedTerms.push(q);
      }

      const data =
        q === '9876543210123'
          ? [
              {
                id: 'pp-tomate-1',
                productoId: 'prod-tomate-1',
                productoNombre: 'Tomate Triturado',
                unidad: 'unidad',
                contenido: 1,
                proveedorId: 'prov-centro',
                proveedorNombre: 'Proveedor Centro',
                marca: 'Marca QA',
                codigoBarras: '9876543210123',
                precioUnitario: 3.45,
              },
            ]
          : [
              {
                id: 'pp-base-1',
                productoId: 'prod-base-1',
                productoNombre: 'Harina de Trigo',
                unidad: 'kg',
                contenido: 1,
                proveedorId: 'prov-base',
                proveedorNombre: 'Proveedor Base',
                marca: 'Marca Base',
                codigoBarras: '1111111111111',
                precioUnitario: 0.95,
              },
            ];

      await route.fulfill(okJson(data));
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

    const quickActions = page.locator('#dashboard-quick-actions');
    await quickActions.getByRole('button', { name: /Nuevo Pedido/i }).click();

    const modal = page.getByRole('dialog', { name: 'Crear Nuevo Pedido' });
    await expect(modal).toBeVisible();

    await modal.getByRole('button', { name: 'Añadir producto' }).click();

    const productInput = modal.getByPlaceholder('Buscar producto...');
    await productInput.click();
    await productInput.fill('9876543210123');

    await expect
      .poll(() => searchedTerms.includes('9876543210123'))
      .toBeTruthy();

    const tomatoOption = page.getByRole('option', { name: 'Tomate Triturado' });
    await expect(tomatoOption).toBeVisible();
    await tomatoOption.click();

    const firstRow = modal.locator('table tbody tr').first();
    // Precio unitario: columna 4ª (índice 3); el TextField usa type="text" + inputMode decimal (no type="number")
    const unitPriceInput = firstRow.locator('td').nth(3).getByRole('textbox');

    await expect(unitPriceInput).toBeEditable();

    await unitPriceInput.fill('4.99');
    await expect(unitPriceInput).toHaveValue('4.99');
  });
});
