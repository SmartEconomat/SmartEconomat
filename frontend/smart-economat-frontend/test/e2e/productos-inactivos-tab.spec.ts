import { expect, test, type Page } from '@playwright/test';

import { bootstrapSession, installApiMocks } from './helpers/session';

type ApiEnvelope<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  data: T;
};

function okEnvelope<T>(data: T, message = 'ok') {
  const body: ApiEnvelope<T> = {
    statusCode: 200,
    success: true,
    message,
    data,
  };
  return {
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

type ProductoMock = {
  id: string;
  nombre: string;
  marca?: string;
  unidad: string;
  tipo: string;
  contenido: number;
  codigoBarras?: string;
  deletedAt?: string | null;
  activo?: boolean;
  createdAt: string;
  updatedAt: string;
};

function filterProductosListado(
  items: ProductoMock[],
  soloEliminados: boolean
): ProductoMock[] {
  if (soloEliminados) {
    return items.filter((p) => Boolean(p.deletedAt));
  }
  return items.filter((p) => !p.deletedAt && p.activo !== false);
}

function iso(d: string): string {
  return `${d}T12:00:00.000Z`;
}

async function markProductosNoTour(page: Page): Promise<void> {
  await page.addInitScript(() => {
    window.localStorage.setItem('sm_tutorial_completed', 'true');
    window.localStorage.setItem('has_seen_tour_/productos', 'true');
  });
}

async function installAuthMinimal(
  page: Page,
  permisos: string[]
): Promise<void> {
  await page.route('**/api/v1/usuarios/perfil**', async (route) => {
    await route.fulfill(
      okEnvelope({
        id: 'e2e-productos-inactivos',
        username: 'qa-inactivos',
        nombre: 'QA Inactivos',
        email: 'qa-inactivos@smarteconomat.local',
        rol: 'admin',
        permisos,
        preferences: {
          tutorialCompleted: true,
        },
      })
    );
  });
}

async function dismissTutorialIfVisible(page: Page): Promise<void> {
  const skip = page.getByRole('button', { name: /Saltar todo el tutorial/i });
  const omitirKey = page.getByRole('button', {
    name: /tutorial\.omitirTour/i,
  });
  for (const loc of [skip, omitirKey]) {
    if (
      await loc
        .first()
        .isVisible()
        .catch(() => false)
    ) {
      await loc.first().click({ force: true });
      return;
    }
  }
}

function isProductosListUrl(url: URL): boolean {
  const path = url.pathname.replace(/\/$/, '') || '/';
  return path === '/api/v1/productos';
}

/**
 * Espera la respuesta del listado /api/v1/productos (paginación) antes de asserts de UI,
 * para evitar carreras con el renderizado.
 */
function waitForProductosListGet(page: Page, soloEliminados?: boolean) {
  return page.waitForResponse(
    (response) => {
      try {
        const req = response.request();
        if (req.method() !== 'GET' || response.status() >= 400) {
          return false;
        }
        const url = new URL(req.url());
        if (url.pathname.replace(/\/$/, '') !== '/api/v1/productos') {
          return false;
        }
        if (soloEliminados === undefined) return true;
        const v = url.searchParams.get('soloEliminados') === 'true';
        return v === soloEliminados;
      } catch {
        return false;
      }
    },
    { timeout: 45_000 }
  );
}

test.describe('Productos — productos inactivos (soloEliminados)', () => {
  test.describe.configure({ timeout: 90_000 });

  test.beforeEach(async ({ page }) => {
    await bootstrapSession(page);
    await markProductosNoTour(page);
    await installApiMocks(page);
    await installAuthMinimal(page, ['productos:listar', 'ADMIN']);
  });

  test('las peticiones GET al listado usan soloEliminados=true sólo en pestaña Eliminados', async ({
    page,
  }) => {
    const ids = {
      activo: '00000007-5000-7000-8000-000000000001',
      inactivo: '00000007-5000-7000-8000-000000000002',
    };
    const productos: ProductoMock[] = [
      {
        id: ids.activo,
        nombre: 'SKU Activo pactado',
        unidad: 'KG',
        tipo: 'verdura',
        contenido: 1,
        codigoBarras: '1234000000024',
        createdAt: iso('2026-01-10'),
        updatedAt: iso('2026-01-10'),
      },
      {
        id: ids.inactivo,
        nombre: 'SKU Inactivo pactado',
        unidad: 'KG',
        tipo: 'fruta',
        contenido: 2,
        codigoBarras: '1234000000048',
        deletedAt: iso('2026-02-01'),
        createdAt: iso('2026-01-05'),
        updatedAt: iso('2026-02-01'),
      },
    ];

    const listRequests: string[] = [];

    await page.route(
      (url) => isProductosListUrl(url),
      async (route) => {
        if (route.request().method() !== 'GET') {
          await route.fallback();
          return;
        }
        listRequests.push(route.request().url());
        const soloEliminados =
          new URL(route.request().url()).searchParams.get('soloEliminados') ===
          'true';
        const filtered = filterProductosListado(productos, soloEliminados);
        await route.fulfill(
          okEnvelope({
            data: filtered,
            total: filtered.length,
            page: 1,
            limit: 20,
            totalPages: 1,
          })
        );
      }
    );

    const cargarActivos = waitForProductosListGet(page, false);
    await page.goto('/productos', { waitUntil: 'domcontentloaded' });
    await cargarActivos;

    await dismissTutorialIfVisible(page);

    const filaActivo = page.getByRole('button', {
      name: /SKU Activo pactado/i,
    });
    await expect(filaActivo).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole('button', { name: /SKU Inactivo pactado/i })
    ).toHaveCount(0);

    const afterActivos = listRequests.filter((u) =>
      u.includes('/api/v1/productos')
    );
    expect(afterActivos.length).toBeGreaterThanOrEqual(1);
    expect(
      afterActivos.every(
        (u) => new URL(u).searchParams.get('soloEliminados') !== 'true'
      )
    ).toBe(true);

    const cargarInactivos = waitForProductosListGet(page, true);
    await page.getByRole('tab', { name: /^Eliminados$/ }).click();
    await cargarInactivos;

    await expect(
      page.getByRole('button', { name: /SKU Inactivo pactado/i })
    ).toBeVisible({ timeout: 20_000 });
    await expect(
      page.getByRole('button', { name: /SKU Activo pactado/i })
    ).toHaveCount(0);

    expect(
      listRequests.some((u) => {
        const p = new URL(u).searchParams;
        return p.get('soloEliminados') === 'true';
      })
    ).toBe(true);

    await expect(
      page.getByRole('button', { name: /^Restaurar$/ }).first()
    ).toBeVisible();
  });

  test('restaurar quita deletedAt y el producto reaparece en Activos', async ({
    page,
  }) => {
    const ids = {
      activo: '00000007-6000-7000-8000-000000000011',
      inactivo: '00000007-6000-7000-8000-000000000022',
    };
    const productos: ProductoMock[] = [
      {
        id: ids.activo,
        nombre: 'Único activo',
        unidad: 'L',
        tipo: 'bebida',
        contenido: 1,
        createdAt: iso('2026-01-10'),
        updatedAt: iso('2026-01-10'),
      },
      {
        id: ids.inactivo,
        nombre: 'Reactivable QA',
        unidad: 'G',
        tipo: 'otro',
        contenido: 500,
        deletedAt: iso('2026-02-10'),
        createdAt: iso('2026-01-08'),
        updatedAt: iso('2026-02-10'),
      },
    ];

    await page.route(
      (url) =>
        url.pathname.includes('/api/v1/productos/') &&
        url.pathname.endsWith('/restore'),
      async (route) => {
        if (route.request().method() !== 'PATCH') {
          await route.fallback();
          return;
        }
        const m = /\/productos\/([^/]+)\/restore/.exec(route.request().url());
        const id = m?.[1];
        const p = productos.find((x) => x.id === id);
        if (!id || !p) {
          await route.fulfill({ status: 404, body: 'not found' });
          return;
        }
        p.deletedAt = null;
        p.updatedAt = iso('2026-03-15');
        await route.fulfill(okEnvelope({ ...p }, 'Restaurado'));
      }
    );

    await page.route(
      (url) => isProductosListUrl(url),
      async (route) => {
        if (route.request().method() !== 'GET') {
          await route.fallback();
          return;
        }
        const soloEliminados =
          new URL(route.request().url()).searchParams.get('soloEliminados') ===
          'true';
        const filtered = filterProductosListado(productos, soloEliminados);
        await route.fulfill(
          okEnvelope({
            data: filtered,
            total: filtered.length,
            page: 1,
            limit: 20,
            totalPages: 1,
          })
        );
      }
    );

    const r1 = waitForProductosListGet(page, false);
    await page.goto('/productos', { waitUntil: 'domcontentloaded' });
    await r1;

    await dismissTutorialIfVisible(page);

    const r2 = waitForProductosListGet(page, true);
    await page.getByRole('tab', { name: /^Eliminados$/ }).click();
    await r2;

    await expect(
      page.getByRole('button', { name: /Reactivable QA/i })
    ).toBeVisible({ timeout: 20_000 });

    await page
      .getByRole('button', { name: /^Restaurar$/ })
      .first()
      .click();

    await expect(
      page.getByRole('button', { name: /Reactivable QA/i })
    ).toHaveCount(0);

    const r3 = waitForProductosListGet(page, false);
    await page.getByRole('tab', { name: /^Activos$/ }).click();
    await r3;

    await expect(
      page.getByRole('button', { name: /Reactivable QA/i })
    ).toBeVisible({ timeout: 20_000 });
  });

  test.describe('visuales', () => {
    test('captura de tabla Activos vs Eliminados (Playwright snapshots)', async ({
      page,
    }) => {
      const ids = {
        activo: '00000007-7000-7000-8000-000000000031',
        inactivo: '00000007-7000-7000-8000-000000000032',
      };
      const productos: ProductoMock[] = [
        {
          id: ids.activo,
          nombre: 'Visual Activo QA',
          marca: 'Marca-A',
          unidad: 'KG',
          tipo: 'verdura',
          contenido: 5,
          codigoBarras: '8437008000014',
          createdAt: iso('2026-01-12'),
          updatedAt: iso('2026-01-12'),
        },
        {
          id: ids.inactivo,
          nombre: 'Visual Inactivo QA',
          marca: 'Marca-B',
          unidad: 'UNIDAD',
          tipo: 'otro',
          contenido: 12,
          codigoBarras: '8437008000021',
          deletedAt: iso('2026-02-02'),
          createdAt: iso('2026-01-06'),
          updatedAt: iso('2026-02-02'),
        },
      ];

      await page.route(
        (url) => isProductosListUrl(url),
        async (route) => {
          if (route.request().method() !== 'GET') {
            await route.fallback();
            return;
          }
          const soloEliminados =
            new URL(route.request().url()).searchParams.get(
              'soloEliminados'
            ) === 'true';
          const filtered = filterProductosListado(productos, soloEliminados);
          await route.fulfill(
            okEnvelope({
              data: filtered,
              total: filtered.length,
              page: 1,
              limit: 20,
              totalPages: 1,
            })
          );
        }
      );

      const wr = waitForProductosListGet(page, false);
      await page.goto('/productos', { waitUntil: 'domcontentloaded' });
      await wr;

      await dismissTutorialIfVisible(page);

      const papelListado = page.locator('.MuiPaper-root').filter({
        has: page.getByRole('tab', { name: /^Activos$/ }),
      });

      const filaVisualActivo = page.getByRole('button', {
        name: /Visual Activo QA/i,
      });
      await expect(filaVisualActivo).toBeVisible({ timeout: 25_000 });
      await expect(
        page.getByRole('button', { name: /Visual Inactivo QA/i })
      ).toHaveCount(0);

      // Solo la tabla (+ paginador en el mismo Paper) reduce variación de ancho del Paper respecto al snapshot.
      const areaTablaYAptas = papelListado
        .locator('.MuiTableContainer-root')
        .locator('..');
      await expect(areaTablaYAptas).toHaveScreenshot(
        'productos-tab-activos-sin-inactivos.png',
        { maxDiffPixels: 3400 }
      );

      const wrIn = waitForProductosListGet(page, true);
      await page.getByRole('tab', { name: /^Eliminados$/ }).click();
      await wrIn;

      await expect(
        page.getByRole('button', { name: /Visual Inactivo QA/i })
      ).toBeVisible();
      await expect(
        page.getByRole('button', { name: /Visual Activo QA/i })
      ).toHaveCount(0);

      await expect(areaTablaYAptas).toHaveScreenshot(
        'productos-tab-eliminados-solo-inactivos.png',
        { maxDiffPixels: 3400 }
      );
    });
  });
});
