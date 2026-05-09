import { expect, test, type Page } from '@playwright/test';
import { bootstrapSession, installApiMocks } from './helpers/session';

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

test.describe('Productos - Herencia de Código de Barras', () => {
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
          username: 'qa-admin',
          rol: 'admin',
          permisos: [
            'productos:listar',
            'productos:crear',
            'proveedores:listar',
          ],
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
  });

  test('debe mostrar el código heredado como placeholder y permitir override', async ({
    page,
  }) => {
    await page.goto('/productos', { waitUntil: 'domcontentloaded' });
    await dismissTutorialIfVisible(page);

    const createButton = page.locator('#btn-nuevo-producto');
    await expect(createButton).toBeVisible({ timeout: 15000 });
    await expect(createButton).toBeEnabled();
    await createButton.click();

    const dialog = page.getByRole('dialog', { name: 'Crear Nuevo Producto' });
    await expect(dialog).toBeVisible();

    const masterBarcode = '8412345678901';
    await dialog.getByLabel('EAN Maestro / Global').fill(masterBarcode);

    await dialog.getByLabel('Añadir proveedor').click();
    await page.getByRole('option', { name: 'Proveedor Test' }).click();

    const providerBarcodeInput = dialog.getByPlaceholder(
      `Ej: ${masterBarcode}`
    );
    await expect(providerBarcodeInput).toBeVisible();

    const inheritedIcon = dialog.locator(
      'svg[data-testid="AutoFixHighOutlinedIcon"][data-mui-internal-clone-element="true"]'
    );
    await expect(inheritedIcon).toBeVisible();

    await providerBarcodeInput.fill('9999999999999');

    await expect(inheritedIcon).toHaveCount(0);
    const revertButton = dialog.locator(
      'button:has(svg[data-testid="HistoryIcon"])'
    );
    await expect(revertButton).toBeVisible();

    await revertButton.first().click();

    await expect(providerBarcodeInput).toBeVisible();
    await expect(inheritedIcon).toBeVisible();
  });
});
