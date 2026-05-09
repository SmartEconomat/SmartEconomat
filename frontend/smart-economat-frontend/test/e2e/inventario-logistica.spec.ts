import { expect, test } from '@playwright/test';
import { bootstrapSession } from './helpers/session';
import {
  okJsonBody,
  setupApiCatchAllEmpty,
  setupCoreAuthenticatedApiMocks,
} from './helpers/api-mock';
import { dismissTutorialIfVisible } from './helpers/dismiss-tutorial';

import { TipoMovimiento } from '../../src/services/movimiento.types';

const profileInventarioCompleto = {
  id: 'e2e-logistica',
  username: 'qa-logistica',
  nombre: 'QA Logística',
  email: 'qa-logistica@smarteconomat.e2e',
  rol: 'ADMIN',
  permisos: [
    'inventario:listar',
    'inventario:crear',
    'inventario:ajustar_stock',
    'inventario:transferir',
    'ubicaciones:listar',
    'ubicaciones:editar',
    'movimientos:listar',
    'productos:listar',
  ],
  idioma: 'es',
};

const inventarioListEnvelope = {
  data: [
    {
      id: 'lote-log-1',
      cantidadActual: 12,
      cantidadMinima: 4,
      ubicacionId: 'ubi-log-1',
      ubicacion: {
        id: 'ubi-log-1',
        nombre: 'Almacén QA Visual',
      },
      productoProveedor: {
        id: 'pp-log-1',
        proveedor: { id: 'pr-log', nombre: 'Distribuidora QA' },
        producto: {
          id: 'prod-log-1',
          nombre: 'Aceite oliva E2E',
          tipo: 'aceite',
          unidad: 'L',
          contenido: 1,
          codigoBarras: '8410000000999',
        },
      },
    },
    {
      id: 'lote-log-2',
      cantidadActual: 3,
      cantidadMinima: 20,
      ubicacionId: 'ubi-log-2',
      ubicacion: {
        id: 'ubi-log-2',
        nombre: 'Despensa QA',
      },
      productoProveedor: {
        id: 'pp-log-2',
        proveedor: { id: 'pr-log', nombre: 'Distribuidora QA' },
        producto: {
          id: 'prod-log-2',
          nombre: 'Yogur natural E2E',
          tipo: 'lacteo',
          unidad: 'UNIDAD',
          contenido: 1,
        },
      },
    },
  ],
  total: 2,
  page: 1,
  limit: 50,
  totalPages: 1,
};

/**
 * Mock de `/inventario`: lista paginada en GET y transferencia en POST.
 */
async function fulfillInventarioApiRoute(
  route: import('@playwright/test').Route
): Promise<void> {
  const method = route.request().method();
  const url = route.request().url();
  if (method === 'POST' && url.includes('/inventario/transferencias')) {
    await route.fulfill(
      okJsonBody(
        { id: 'tr-e2e-1', estado: 'completada' },
        201,
        'Transferencia completada'
      )
    );
    return;
  }
  if (method !== 'GET') {
    await route.fulfill(okJsonBody({}, 405));
    return;
  }
  await route.fulfill(okJsonBody(inventarioListEnvelope));
}

async function setupAuthenticatedWithCatchAll(
  page: import('@playwright/test').Page
): Promise<void> {
  await bootstrapSession(page);
  await setupApiCatchAllEmpty(page);
  await setupCoreAuthenticatedApiMocks(page, profileInventarioCompleto);
}

test.describe('Inventario — flujo logístico y regresión visual', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('sm_tutorial_completed', 'true');
      window.localStorage.setItem('has_seen_tour_/inventario', 'true');
    });
  });

  test('tabla consolidada muestra productos y estados de stock (bajo vs ok)', async ({
    page,
  }) => {
    await setupAuthenticatedWithCatchAll(page);

    await page.route('**/api/v1/ubicacion**', async (route) =>
      route.fulfill(
        okJsonBody([
          { id: 'ubi-log-1', nombre: 'Almacén QA Visual' },
          { id: 'ubi-log-2', nombre: 'Despensa QA' },
        ])
      )
    );

    await page.route('**/api/v1/inventario**', fulfillInventarioApiRoute);

    await page.goto('/inventario', { waitUntil: 'networkidle' });
    await dismissTutorialIfVisible(page);

    await expect(page.getByText('Aceite oliva E2E')).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText('Yogur natural E2E')).toBeVisible();
    await expect(page.getByText('Bajo stock').first()).toBeVisible();
  });

  test('modal de detalle desde auditoría y cierre', async ({ page }) => {
    await setupAuthenticatedWithCatchAll(page);

    await page.route('**/api/v1/ubicacion**', async (route) =>
      route.fulfill(
        okJsonBody([
          { id: 'ubi-log-1', nombre: 'Almacén QA Visual' },
          { id: 'ubi-log-2', nombre: 'Despensa QA' },
        ])
      )
    );

    await page.route('**/api/v1/inventario**', fulfillInventarioApiRoute);

    await page.goto('/inventario', { waitUntil: 'networkidle' });
    await dismissTutorialIfVisible(page);

    await page
      .getByTestId('inventario-auditar-stock-prod-log-2')
      .click({ timeout: 20_000 });

    const modal = page.getByTestId('inventario-detalle-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Yogur natural E2E')).toBeVisible();

    await modal.getByRole('button', { name: 'Cerrar' }).click();
    await expect(modal).toBeHidden();
  });

  test('modal auditoría — traslado parcial entre ubicaciones (mock)', async ({
    page,
  }) => {
    await setupAuthenticatedWithCatchAll(page);

    await page.route('**/api/v1/ubicacion**', async (route) =>
      route.fulfill(
        okJsonBody([
          { id: 'ubi-log-1', nombre: 'Almacén QA Visual' },
          { id: 'ubi-log-2', nombre: 'Despensa QA' },
        ])
      )
    );

    await page.route('**/api/v1/inventario**', fulfillInventarioApiRoute);

    await page.goto('/inventario', { waitUntil: 'networkidle' });
    await dismissTutorialIfVisible(page);

    await page
      .getByTestId('inventario-auditar-stock-prod-log-1')
      .click({ timeout: 20_000 });

    const modal = page.getByTestId('inventario-detalle-modal');
    await expect(modal).toBeVisible();
    await expect(modal.getByText('Traslado de stock')).toBeVisible();

    await modal.getByRole('combobox').first().click();
    await page.getByRole('option', { name: 'Despensa QA' }).click();

    await modal.getByRole('textbox', { name: /Cantidad a mover/i }).fill('2');

    await modal.getByTestId('inventario-traslado-submit-lote-log-1').click();

    await expect(
      page.getByText(/Traslado completado correctamente/i).first()
    ).toBeVisible({ timeout: 10_000 });
  });

  test.describe('visuales', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('capturas deterministas: panel inventario y modal auditoría', async ({
      page,
    }) => {
      await setupAuthenticatedWithCatchAll(page);

      await page.route('**/api/v1/ubicacion**', async (route) =>
        route.fulfill(
          okJsonBody([
            { id: 'ubi-log-1', nombre: 'Almacén QA Visual' },
            { id: 'ubi-log-2', nombre: 'Despensa QA' },
          ])
        )
      );

      await page.route('**/api/v1/inventario**', fulfillInventarioApiRoute);

      await page.goto('/inventario', { waitUntil: 'networkidle' });
      await dismissTutorialIfVisible(page);

      const panel = page.getByTestId('inventario-panel-principal');
      await expect(panel.getByText('Aceite oliva E2E')).toBeVisible({
        timeout: 20_000,
      });

      await expect(panel).toHaveScreenshot('inventario-panel-stock.png', {
        maxDiffPixels: 4500,
        animations: 'disabled',
      });

      await page.getByTestId('inventario-auditar-stock-prod-log-1').click();
      const modal = page.getByTestId('inventario-detalle-modal');
      await expect(modal).toBeVisible();

      await expect(modal).toHaveScreenshot('inventario-modal-auditoria.png', {
        maxDiffPixels: 12000,
        animations: 'disabled',
      });
    });
  });
});

test.describe('Movimientos — trazabilidad (tabla + snapshot)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('sm_tutorial_completed', 'true');
      window.localStorage.setItem('has_seen_tour_/movimientos', 'true');
    });
  });

  test('lista movimientos con tipo y producto (mock)', async ({ page }) => {
    await setupAuthenticatedWithCatchAll(page);

    const movimientoRow = {
      id: 'mov-e2e-1',
      tipo: TipoMovimiento.ENTRADA,
      cantidad: 5,
      entidad: 'Inventario',
      entidadId: 'lote-log-1',
      createdAt: '2026-05-10T10:00:00.000Z',
      descripcion: 'Entrada QA e2e',
      usuario: {
        id: 'u-e2e',
        nombre: 'Usuario QA',
      },
      productoProveedor: {
        id: 'pp-log-1',
        producto: { nombre: 'Aceite oliva E2E' },
      },
    };

    await page.route('**/api/v1/movimientos**', async (route) => {
      if (route.request().method() !== 'GET') {
        await route.fulfill(okJsonBody({}, 405));
        return;
      }
      await route.fulfill(
        okJsonBody({
          data: [movimientoRow],
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        })
      );
    });

    await page.goto('/movimientos', { waitUntil: 'networkidle' });
    await dismissTutorialIfVisible(page);

    await expect(
      page.getByRole('heading', { name: /Historial de Movimientos/i }).first()
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText('Aceite oliva E2E')).toBeVisible();
  });

  test.describe('visuales', () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('captura tabla de movimientos', async ({ page }) => {
      await setupAuthenticatedWithCatchAll(page);

      await page.route('**/api/v1/movimientos**', async (route) => {
        if (route.request().method() !== 'GET') {
          await route.fulfill(okJsonBody({}, 405));
          return;
        }
        await route.fulfill(
          okJsonBody({
            data: [
              {
                id: 'mov-snap-1',
                tipo: TipoMovimiento.AJUSTE,
                cantidad: 2,
                entidad: 'Inventario',
                entidadId: 'inv-snap',
                createdAt: '2026-05-10T12:00:00.000Z',
                descripcion: 'Ajuste inventario QA',
                usuario: { id: 'u1', nombre: 'Operador QA' },
                productoProveedor: {
                  id: 'pp-snap',
                  producto: { nombre: 'Producto snapshot' },
                },
              },
            ],
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1,
          })
        );
      });

      await page.goto('/movimientos', { waitUntil: 'networkidle' });
      await dismissTutorialIfVisible(page);

      const vista = page.getByTestId('movimientos-vista-principal');
      await expect(page.getByText('Producto snapshot').first()).toBeVisible({
        timeout: 20_000,
      });

      await expect(vista).toHaveScreenshot(
        'movimientos-tabla-trazabilidad.png',
        {
          maxDiffPixels: 5000,
          animations: 'disabled',
        }
      );
    });
  });
});
