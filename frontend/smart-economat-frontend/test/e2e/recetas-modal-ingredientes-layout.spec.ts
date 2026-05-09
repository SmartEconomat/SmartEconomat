import { expect, test, type Page } from '@playwright/test';

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

test.describe('Recetas - modal ingredientes', () => {
  test('mantiene el layout estable al añadir varias filas de ingredientes', async ({
    page,
  }) => {
    await bootstrapSession(page);
    await installApiMocks(page);

    const productoTomate = {
      id: 'prod-tomate-1',
      nombre: 'Tomate Triturado',
      unidad: 'g',
      contenido: 1000,
      proveedores: [
        {
          id: 'pp-tomate-1',
          proveedorId: 'prov-centro',
          precioUnitario: 0.95,
          proveedor: {
            id: 'prov-centro',
            nombre: 'Proveedor Centro',
          },
        },
      ],
    };

    await page.route('**/api/v1/usuarios/perfil**', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-recetas-user-id',
          username: 'qa-recetas',
          nombre: 'QA Recetas',
          email: 'qa-recetas@smarteconomat.local',
          rol: 'admin',
          permisos: ['recetas:listar', 'recetas:crear'],
        })
      );
    });

    await page.route('**/api/v1/recetas**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fulfill(okJson({ id: 'receta-qa-1', nombre: 'Receta QA' }));
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

    await page.route('**/api/v1/ubicacion**', async (route) => {
      await route.fulfill(okJson([]));
    });

    await page.route('**/api/v1/productos**', async (route) => {
      const url = new URL(route.request().url());
      const productByIdMatch = url.pathname.match(
        /\/api\/v1\/productos\/([^/]+)$/
      );

      if (productByIdMatch) {
        await route.fulfill(okJson(productoTomate));
        return;
      }

      const searchTerm = (url.searchParams.get('searchTerm') ?? '').trim();
      if (searchTerm.length > 0) {
        await route.fulfill(
          okJson({
            data: [productoTomate],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          })
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

    await page.goto('/recetas', { waitUntil: 'networkidle' });

    const newRecetaButton = page.locator('#btn-nueva-receta');
    await expect(newRecetaButton).toBeVisible({ timeout: 15000 });
    await dismissTutorialIfVisible(page);
    await newRecetaButton.click();

    const modal = page.getByRole('dialog', { name: /Nueva Receta/i });
    await expect(modal).toBeVisible();

    const addIngredienteButton = modal.getByRole('button', {
      name: 'Añadir Ingrediente',
    });

    await addIngredienteButton.click();
    await addIngredienteButton.click();
    await addIngredienteButton.click();

    await expect(
      modal.getByText('Escribe al menos 2 letras para buscar productos.')
    ).toHaveCount(1);
    await expect(modal.getByPlaceholder('Buscar producto...')).toHaveCount(3);

    const firstProductInput = modal
      .getByPlaceholder('Buscar producto...')
      .first();
    await firstProductInput.click();
    await firstProductInput.fill('tomate');

    const tomateOption = page.getByRole('option', { name: 'Tomate Triturado' });
    await expect(tomateOption).toBeVisible();
    await tomateOption.click();

    const firstRow = modal.locator('table tbody tr').first();
    await expect(firstRow).toContainText('Proveedor Centro');
    await expect(firstRow).toContainText('Auto');
  });
});
