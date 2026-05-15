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

async function setupRecetasI18n(page: Page) {
  await bootstrapSession(page);
  await installApiMocks(page);

  await page.route('**/api/v1/usuarios/perfil**', async (route) => {
    await route.fulfill(
      okJson({
        id: 'e2e-recetas-i18n-user-id',
        username: 'qa-recetas-i18n',
        rol: 'admin',
        permisos: ['recetas:listar', 'recetas:ver'],
      })
    );
  });

  await page.route('**/api/v1/recetas**', async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fulfill(okJson({}));
      return;
    }

    await route.fulfill(
      okJson({
        data: [
          {
            id: 'receta-i18n-1',
            nombre: 'Crema de Verduras',
            instrucciones: 'Mezclar ingredientes.',
            tiempoEstimadoMinutos: 30,
            dificultad: 'pdf.receta.dificultad',
            ingredientes: [{ id: 'ing-1', cantidad: 1, unidad: 'kg' }],
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      })
    );
  });
}

test.describe('Recetas i18n enums', () => {
  test('no renderiza keys i18n crudas en listado de recetas', async ({
    page,
  }) => {
    await setupRecetasI18n(page);
    await page.goto('/recetas', { waitUntil: 'networkidle' });

    const skipTutorial = page.getByRole('button', {
      name: 'Saltar todo el tutorial',
    });
    if (await skipTutorial.isVisible().catch(() => false)) {
      await skipTutorial.click();
    }

    await expect(page.getByText('pdf.receta.dificultad')).toHaveCount(0);
    await expect(
      page.getByRole('columnheader', { name: /dificultad/i })
    ).toBeVisible();
    // Carrusel y tabla pueden repetir el nombre; comprobamos presencia sin strict mode.
    await expect(page.getByText('Crema de Verduras').first()).toBeVisible();
  });

  test('exportación PDF dispara endpoint sin exponer keys en UI', async ({
    page,
  }) => {
    await setupRecetasI18n(page);
    let pdfRequested = false;

    await page.route('**/api/v1/recetas/export/pdf**', async (route) => {
      pdfRequested = true;
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: '%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF',
      });
    });

    await page.goto('/recetas', { waitUntil: 'networkidle' });

    const skipTutorial = page.getByRole('button', {
      name: 'Saltar todo el tutorial',
    });
    if (await skipTutorial.isVisible().catch(() => false)) {
      await skipTutorial.click();
    }

    await page.locator('tbody input[type="checkbox"]').first().check();
    await page.locator('#btn-exportar-pdf-recetas').click();
    await page
      .getByRole('button', { name: /exportar/i })
      .last()
      .click();

    await expect.poll(() => pdfRequested).toBeTruthy();
    await expect(page.getByText('pdf.receta.')).toHaveCount(0);
  });
});
