import { expect, test, type Page } from '@playwright/test';
import { bootstrapSession, installApiMocks } from './helpers/session';

const qaPermissions = [
  'productos:listar',
  'productos:crear',
  'proveedores:listar',
  'proveedores:crear',
];

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

async function dismissTutorialIfVisible(page: Page): Promise<void> {
  const skipTutorialButton = page.getByRole('button', {
    name: 'Saltar todo el tutorial',
  });

  if (!(await skipTutorialButton.isVisible().catch(() => false))) {
    return;
  }

  await skipTutorialButton.click();
  await expect(skipTutorialButton).toHaveCount(0);
}

async function setScannerMock(
  page: Page,
  config: { mode?: string; codes?: string[]; delayMs?: number }
): Promise<void> {
  await page.addInitScript((runtimeConfig) => {
    (
      window as typeof window & {
        __SMART_ECONOMAT_BARCODE_SCANNER_E2E__?: {
          mode?: string;
          codes?: string[];
          delayMs?: number;
        };
      }
    ).__SMART_ECONOMAT_BARCODE_SCANNER_E2E__ = runtimeConfig;
  }, config);
}

async function clickScanButton(page: Page): Promise<void> {
  const searchInput = page.locator('#search-productos');
  await expect(searchInput).toBeVisible({ timeout: 30000 });

  const scanButton = page.getByRole('button', {
    name: /escanear c[oó]digo|scan code/i,
  });

  await expect(scanButton.first()).toBeVisible({ timeout: 30000 });
  await scanButton.first().click();
}

test.describe('BarcodeScanner - cámara simulada', () => {
  test.describe.configure({ timeout: 90000 });

  test.beforeEach(async ({ page }) => {
    await bootstrapSession(page);
    await page.addInitScript(() => {
      window.localStorage.setItem('has_seen_tour_/productos', 'true');
    });
    await installApiMocks(page);

    await page.route('**/api/v1/usuarios/perfil**', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-user-id',
          username: 'qa-productos',
          nombre: 'QA Productos',
          email: 'qa-productos@smarteconomat.local',
          rol: 'admin',
          permisos: qaPermissions,
        })
      );
    });

    await page.route('**/api/v1/productos**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fulfill(
          okJson({ id: 'prod-e2e-1', nombre: 'Producto QA' })
        );
        return;
      }

      await route.fulfill(
        okJson({
          data: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 1,
        })
      );
    });

    await page.route('**/api/v1/proveedor?**', async (route) => {
      await route.fulfill(
        okJson({
          data: [{ id: 'prov-1', nombre: 'Proveedor Test' }],
          total: 1,
          page: 1,
          limit: 50,
          totalPages: 1,
        })
      );
    });
  });

  test('simula lectura y propaga el código al buscador de productos', async ({
    page,
  }) => {
    await setScannerMock(page, {
      mode: 'success',
      codes: ['8412345678901'],
      delayMs: 15,
    });

    await page.goto('/productos');
    await expect(page).toHaveURL(/\/productos(?:\?.*)?$/);
    await dismissTutorialIfVisible(page);

    await clickScanButton(page);

    const searchInput = page.locator('#search-productos');
    await expect(searchInput).toHaveValue('8412345678901');
  });

  test('simula error de permisos de cámara y muestra feedback de error', async ({
    page,
  }) => {
    await setScannerMock(page, {
      mode: 'error_permission',
    });

    await page.goto('/productos');
    await expect(page).toHaveURL(/\/productos(?:\?.*)?$/);
    await dismissTutorialIfVisible(page);

    await clickScanButton(page);

    await expect(page.getByText('Permiso de cámara denegado')).toBeVisible();
  });
});
