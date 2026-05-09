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

test.describe('Creación de Receta y Auditoría', () => {
  test('debería crear una receta y registrar el movimiento de auditoría', async ({
    page,
  }) => {
    test.setTimeout(60_000);

    const recetaNombre = `Receta Test Auditoria ${Date.now()}`;
    const recetas: Array<Record<string, unknown>> = [];
    const movimientos: Array<Record<string, unknown>> = [];

    const nowIso = new Date().toISOString();
    const productoTomate = {
      id: 'producto-tomate-1',
      nombre: 'Tomate Triturado',
      unidad: 'kg',
      tipo: 'ingrediente',
      contenido: 1,
      createdAt: nowIso,
      updatedAt: nowIso,
      proveedores: [
        {
          id: 'pp-tomate-1',
          precioUnitario: 1.75,
          proveedor: {
            id: 'proveedor-centro',
            nombre: 'Proveedor Centro',
          },
        },
      ],
    };

    await bootstrapSession(page);
    await page.addInitScript(() => {
      // navigator.language en CI suele ser en-* → UI en inglés y selectores ES fallan.
      window.localStorage.setItem('sm_language', 'es');
      window.localStorage.setItem('has_seen_tour_/recetas', 'true');
      window.localStorage.setItem('has_seen_tour_/movimientos', 'true');
    });
    await installApiMocks(page);

    await page.route('**/api/v1/usuarios/perfil**', async (route) => {
      await route.fulfill(
        okJson({
          id: 'e2e-recetas-user-id',
          username: 'qa-recetas',
          nombre: 'QA Recetas',
          email: 'qa-recetas@smarteconomat.local',
          rol: 'admin',
          permisos: ['recetas:listar', 'recetas:crear', 'movimientos:listar'],
        })
      );
    });

    await page.route('**/api/v1/recetas**', async (route) => {
      const requestMethod = route.request().method();

      if (requestMethod === 'GET') {
        await route.fulfill(
          okJson({
            data: recetas,
            total: recetas.length,
            page: 1,
            limit: 20,
            totalPages: 1,
          })
        );
        return;
      }

      if (requestMethod === 'POST') {
        const payload = JSON.parse(route.request().postData() ?? '{}') as {
          nombre?: string;
          instrucciones?: string;
          tiempoEstimadoMinutos?: number;
          rendimiento?: number;
          dificultad?: string;
        };

        const recetaCreada = {
          id: 'receta-auditoria-e2e',
          nombre: payload.nombre ?? recetaNombre,
          instrucciones: payload.instrucciones ?? 'Instrucciones QA',
          tiempoEstimadoMinutos: payload.tiempoEstimadoMinutos ?? 45,
          dificultad: payload.dificultad ?? 'Media',
          rendimiento: payload.rendimiento ?? 10,
          unidadResultado: 'unidad',
          ingredientes: [],
        };

        recetas.unshift(recetaCreada);
        movimientos.unshift({
          id: `mov-receta-${Date.now()}`,
          tipo: 'ajuste',
          cantidad: 1,
          entidad: 'receta',
          entidadId: recetaCreada.id,
          descripcion: `Creación de receta (${recetaCreada.nombre})`,
          createdAt: new Date().toISOString(),
          usuario: {
            id: 'e2e-recetas-user-id',
            username: 'qa-recetas',
          },
        });

        await route.fulfill(
          okJson(recetaCreada, 'Receta creada correctamente')
        );
        return;
      }

      await route.fallback();
    });

    await page.route('**/api/v1/movimientos**', async (route) => {
      await route.fulfill(
        okJson({
          data: movimientos,
          total: movimientos.length,
          page: 1,
          limit: 20,
          totalPages: 1,
        })
      );
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

    // Solo la URL de preview (el predicado recibe `URL`, no `Route`).
    await page.route(
      (url) => url.pathname.includes('/recetas/calculate-preview'),
      async (route) => {
        await route.fulfill(
          okJson({
            recetaId: 'preview',
            recetaNombre: '',
            costoTotal: 0,
            costoUnitarioEstimado: 0,
            desglosePorIngrediente: [],
          })
        );
      }
    );

    await page.goto('/recetas', { waitUntil: 'networkidle' });
    await dismissTutorialIfVisible(page);

    const createRecipeButton = page.locator('#btn-nueva-receta');
    await expect(createRecipeButton).toBeVisible({ timeout: 15000 });
    await createRecipeButton.click();

    const dialog = page.getByRole('dialog', { name: /nueva receta/i });
    await expect(dialog).toBeVisible();

    await dialog.locator('input[name="nombre"]').fill(recetaNombre);
    await dialog.locator('input[name="tiempoEstimadoMinutos"]').fill('45');
    await dialog
      .locator('textarea[name="instrucciones"]')
      .fill('Instrucciones QA para auditoria');

    const addIngredienteButton = dialog.getByRole('button', {
      name: 'Añadir Ingrediente',
    });
    await addIngredienteButton.click();

    const ingredienteInput = dialog
      .getByPlaceholder('Buscar producto...')
      .first();
    await ingredienteInput.click();
    await ingredienteInput.fill('tomate');
    await page.getByRole('option', { name: 'Tomate Triturado' }).click();

    const dificultadSelect = dialog.getByLabel(/dificultad/i);
    await dificultadSelect.click();
    await page.getByRole('option', { name: /media|medium/i }).click();

    await dialog.getByRole('button', { name: /^aceptar$/i }).click();

    // El Modal de confirmación no expone `aria-labelledby` con "Confirmar acción" como nombre
    // del diálogo (nombre accesible distinto); filtramos por el h2 del título.
    await page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: /confirmar acción/i }) })
      .getByRole('button', { name: /^guardar$/i })
      .click();

    await expect
      .poll(() => recetas.length, { timeout: 15_000 })
      .toBeGreaterThan(0);

    await page.goto('/movimientos', { waitUntil: 'networkidle' });
    await dismissTutorialIfVisible(page);

    await expect(
      page.getByText(`Creación de receta (${recetaNombre})`).first()
    ).toBeVisible({ timeout: 15_000 });
  });
});
