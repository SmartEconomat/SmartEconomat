import { expect, test } from '@playwright/test';
import { bootstrapSession } from './helpers/session';
import {
  okJsonBody,
  setupApiCatchAllEmpty,
  setupCoreAuthenticatedApiMocks,
} from './helpers/api-mock';

const profileInventarioAdmin = {
  id: 'e2e-inv-ui',
  username: 'qa-inv',
  nombre: 'QA Inventario E2E',
  email: 'qa-inv@smarteconomat.e2e',
  rol: 'admin',
  permisos: [
    'inventario:listar',
    'inventario:crear',
    'inventario:ajustar_stock',
    'ubicaciones:listar',
    'ubicaciones:editar',
    'productos:crear',
  ],
  idioma: 'es',
};

async function setupAuthenticatedWithCatchAll(
  page: import('@playwright/test').Page
): Promise<void> {
  await bootstrapSession(page);
  // Catch-all primero: si va al final, Playwright lo ejecuta primero y devuelve [] al perfil.
  await setupApiCatchAllEmpty(page);
  await setupCoreAuthenticatedApiMocks(page, profileInventarioAdmin);
}

test.describe('Inventario ubicación y modal', () => {
  test('no hay filtro de almacén; ubicaciones visibles para filtro', async ({
    page,
  }) => {
    await setupAuthenticatedWithCatchAll(page);

    await page.route('**/api/v1/ubicaciones**', async (route) =>
      route.fulfill(
        okJsonBody([
          { id: 'ubi-e2e-1', nombre: 'Laboratorio gastronómico' },
          { id: 'ubi-e2e-2', nombre: 'Despensa fría' },
        ])
      )
    );

    await page.route('**/api/v1/inventario**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fulfill(okJsonBody({}, 405));
        return;
      }
      await route.fulfill(
        okJsonBody({
          data: [
            {
              id: 'lote-e2e-1',
              cantidadActual: 5,
              cantidadMinima: 2,
              ubicacionId: 'ubi-e2e-1',
              ubicacion: {
                id: 'ubi-e2e-1',
                nombre: 'Laboratorio gastronómico',
              },
              productoProveedor: {
                id: 'pp-e2e',
                proveedor: { id: 'pr-e2e', nombre: 'Proveedor E2E' },
                producto: {
                  id: 'prod-e2e',
                  nombre: 'Harina integral',
                  tipo: 'cereal',
                  codigoBarras: '8410000000123',
                },
              },
            },
          ],
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        })
      );
    });

    await page.goto('/inventario', { waitUntil: 'networkidle' });

    await expect(
      page.getByRole('combobox', { name: /Ubicación/i })
    ).toBeVisible();
    await expect(
      page.getByRole('combobox', { name: 'Ubicación...' })
    ).toBeVisible();
    await expect(
      page.locator(':text-matches("Filtrar almac[eé]n","i")')
    ).toHaveCount(0);
  });

  test('modal de auditoría no muestra claves i18n crudas', async ({ page }) => {
    test.setTimeout(60_000);

    await setupAuthenticatedWithCatchAll(page);

    await page.route('**/api/v1/ubicaciones**', async (route) =>
      route.fulfill(
        okJsonBody([{ id: 'ubi-modal', nombre: 'Cocina docente e2e' }])
      )
    );

    let stockCantidad = 8;

    await page.route('**/api/v1/inventario**', async (route) => {
      const req = route.request();

      if (req.method() === 'POST' && req.url().includes('ajustes-manuales')) {
        stockCantidad += 3;
        await route.fulfill(
          okJsonBody(
            {
              id: 'lote-modal-e2e',
              cantidadActual: stockCantidad,
              cantidadMinima: 1,
              ubicacionId: 'ubi-modal',
              ubicacion: { id: 'ubi-modal', nombre: 'Cocina docente e2e' },
              productoProveedor: {
                id: 'pp-modal-e2e',
                proveedor: { id: 'pr-e2e', nombre: 'Distribuidora Norte' },
                producto: {
                  id: 'prod-modal-e2e',
                  nombre: 'Arroz vaporizado QA',
                  tipo: 'cereal',
                },
              },
            },
            201
          )
        );
        return;
      }

      if (req.method() === 'GET') {
        await route.fulfill(
          okJsonBody({
            data: [
              {
                id: 'lote-modal-e2e',
                cantidadActual: stockCantidad,
                cantidadMinima: 1,
                ubicacionId: 'ubi-modal',
                ubicacion: { id: 'ubi-modal', nombre: 'Cocina docente e2e' },
                productoProveedor: {
                  id: 'pp-modal-e2e',
                  proveedor: { id: 'pr-e2e', nombre: 'Distribuidora Norte' },
                  producto: {
                    id: 'prod-modal-e2e',
                    nombre: 'Arroz vaporizado QA',
                    tipo: 'cereal',
                  },
                },
              },
            ],
            total: 1,
            page: 1,
            limit: 50,
            totalPages: 1,
          })
        );
        return;
      }

      await route.fulfill(okJsonBody({}, 405));
    });

    await page.goto('/inventario', { waitUntil: 'networkidle' });

    await expect(page.getByText('Arroz vaporizado QA')).toBeVisible({
      timeout: 15_000,
    });

    await page.getByTestId('inventario-auditar-stock-prod-modal-e2e').click();

    const modal = page.getByTestId('inventario-detalle-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByRole('heading', { level: 2 })).not.toContainText(
      'inventario.detalle.'
    );

    const saveResponse = page.waitForResponse(
      (r) =>
        r.url().includes('/api/v1/inventario/ajustes-manuales') &&
        r.request().method() === 'POST'
    );

    await modal.getByPlaceholder('+2 / -1').first().fill('3');
    await modal.getByLabel('Guardar ajuste de stock del lote').click();
    await saveResponse;

    expect(stockCantidad).toBe(11);

    await page.reload({ waitUntil: 'networkidle' });
    await expect(
      page
        .getByRole('button', { name: /inventario\.aria\.filaProducto/i })
        .first()
    ).toContainText(/11([.,]0+)?/);
  });
});
