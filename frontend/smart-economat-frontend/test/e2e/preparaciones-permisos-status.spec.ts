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

function buildProduccionRow(status: 'disponible' | 'agotado') {
  return {
    id: status === 'disponible' ? 'lote-disponible-1' : 'lote-agotado-1',
    createdAt: '2026-01-01T10:00:00.000Z',
    recetaId: 'receta-prep-1',
    usuarioId: 'usuario-prep-1',
    cantidadProducida: 2,
    fechaProduccion: '2026-01-01T10:00:00.000Z',
    fechaAgotado: status === 'agotado' ? '2026-01-02T10:00:00.000Z' : null,
    costeTotalReal: 8,
    porcionesProducidas: 4,
    porcionesRestantes: status === 'agotado' ? 0 : 4,
    estado: status,
    receta: {
      id: 'receta-prep-1',
      nombre: 'Sopa de prueba',
      instrucciones: 'Mezclar y cocinar',
      tiempoEstimadoMinutos: 20,
      dificultad: 'facil',
      rendimiento: 2,
      raciones: 4,
      unidadResultado: 'kg',
    },
    usuario: {
      id: 'usuario-prep-1',
      nombre: 'QA Preparaciones',
    },
  };
}

async function setupPreparacionesPage(
  page: Page,
  permisos: string[],
  onProduccionRequest?: (status: string | null) => void
) {
  await bootstrapSession(page);
  await installApiMocks(page);

  await page.route('**/api/v1/usuarios/perfil**', async (route) => {
    await route.fulfill(
      okJson({
        id: 'e2e-preparaciones-user',
        username: 'qa-preparaciones',
        nombre: 'QA Preparaciones',
        rol: 'usuario',
        permisos,
      })
    );
  });

  await page.route('**/api/v1/produccion**', async (route) => {
    const req = route.request();
    const reqUrl = new URL(req.url());
    if (reqUrl.pathname !== '/api/v1/produccion') {
      await route.fulfill(okJson({}));
      return;
    }
    if (req.method() !== 'GET') {
      await route.fulfill(okJson({}));
      return;
    }

    const status = reqUrl.searchParams.get('status');
    onProduccionRequest?.(status);

    const row = buildProduccionRow(
      status === 'agotado' ? 'agotado' : 'disponible'
    );
    await route.fulfill(
      okJson({
        data: [row],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      })
    );
  });
}

test.describe('Preparaciones permisos y estado', () => {
  test('oculta acciones sensibles cuando faltan permisos de cocinar y merma', async ({
    page,
  }) => {
    await setupPreparacionesPage(page, ['recetas:listar']);

    await page.goto('/preparaciones', { waitUntil: 'networkidle' });

    await expect(page.getByText('Sopa de prueba')).toBeVisible();
    await expect(
      page.getByRole('button', { name: /consumir raciones o cantidad/i })
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: /reportar merma de ingrediente/i })
    ).toHaveCount(0);
  });

  test('consulta lotes por estado real: disponible y agotado', async ({
    page,
  }) => {
    const requestedStatuses: string[] = [];
    await setupPreparacionesPage(
      page,
      ['recetas:listar', 'recetas:cocinar', 'merma:crear'],
      (status) => {
        if (status) {
          requestedStatuses.push(status);
        }
      }
    );

    await page.goto('/preparaciones', { waitUntil: 'networkidle' });

    await expect
      .poll(() => requestedStatuses.includes('disponible'))
      .toBeTruthy();

    await page.getByRole('tab', { name: /agotadas/i }).click();
    await expect.poll(() => requestedStatuses.includes('agotado')).toBeTruthy();
  });
});
