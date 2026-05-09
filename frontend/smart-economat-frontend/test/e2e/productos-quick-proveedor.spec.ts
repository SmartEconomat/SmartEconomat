import { expect, test, type Page } from '@playwright/test';

import { bootstrapSession, installApiMocks } from './helpers/session';

const INVENTORY_CONFIRMATION_MESSAGE =
  '¿Estás seguro de que deseas añadir este nuevo producto al inventario?';

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

test.describe('Productos - creación rápida de proveedor', () => {
  test.describe.configure({ timeout: 90000 });

  test.beforeEach(async ({ page }) => {
    await bootstrapSession(page);
    await installApiMocks(page);

    const proveedores = [
      {
        id: 'prov-base-1',
        nombre: 'Proveedor Base',
        nif: 'B00000001',
      },
    ];

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
        await route.fulfill(okJson({ id: 'prod-qa-1', nombre: 'Producto QA' }));
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
          data: proveedores,
          total: proveedores.length,
          page: 1,
          limit: 50,
          totalPages: 1,
        })
      );
    });

    await page.route('**/api/v1/proveedor', async (route) => {
      if (route.request().method() !== 'POST') {
        await route.fallback();
        return;
      }

      const body = JSON.parse(route.request().postData() ?? '{}') as {
        nombre?: string;
        nif?: string;
      };

      const newProveedor = {
        id: `prov-quick-${proveedores.length + 1}`,
        nombre: body.nombre ?? 'Proveedor rápido QA',
        nif: body.nif ?? 'B00000002',
      };

      proveedores.push(newProveedor);

      await route.fulfill(okJson(newProveedor, 'Proveedor creado'));
    });
  });

  test('crear proveedor rápido desde el formulario de producto no dispara confirmación de inventario', async ({
    page,
  }) => {
    await page.goto('/productos', { waitUntil: 'domcontentloaded' });

    const newProductButton = page.locator('#btn-nuevo-producto');
    await expect(newProductButton).toBeVisible({ timeout: 15000 });
    await dismissTutorialIfVisible(page);
    await newProductButton.click();

    const productoDialog = page.getByRole('dialog', {
      name: 'Crear Nuevo Producto',
    });
    await expect(productoDialog).toBeVisible();

    await productoDialog
      .getByRole('button', { name: 'Crear nuevo proveedor' })
      .click();

    const quickProveedorDialog = page.getByRole('dialog').filter({
      has: page.getByRole('heading', { name: 'Crear Nuevo Proveedor' }),
    });
    await expect(quickProveedorDialog).toBeVisible();

    await quickProveedorDialog.locator('input[name="nif"]').fill('B12345678');
    await quickProveedorDialog
      .locator('input[name="nombre"]')
      .fill('Proveedor rápido E2E');

    await quickProveedorDialog.getByRole('button', { name: 'Aceptar' }).click();

    await expect(quickProveedorDialog).not.toBeVisible();
    await expect(productoDialog).toBeVisible();
    await expect(
      productoDialog.getByText('Proveedor rápido E2E')
    ).toBeVisible();
    await expect(page.getByText(INVENTORY_CONFIRMATION_MESSAGE)).toHaveCount(0);
  });

  test('la confirmación de inventario sigue apareciendo al enviar el formulario principal', async ({
    page,
  }) => {
    await page.goto('/productos', { waitUntil: 'domcontentloaded' });

    const newProductButton = page.locator('#btn-nuevo-producto');
    await expect(newProductButton).toBeVisible({ timeout: 15000 });
    await dismissTutorialIfVisible(page);
    await newProductButton.click();

    const productoDialog = page.getByRole('dialog', {
      name: 'Crear Nuevo Producto',
    });
    await expect(productoDialog).toBeVisible();

    await productoDialog.getByLabel('Nombre Comercial').fill('Producto QA E2E');
    await productoDialog
      .getByRole('button', { name: 'Crear Producto' })
      .click();

    await expect(page.getByText(INVENTORY_CONFIRMATION_MESSAGE)).toBeVisible();
  });
});
