import { expect, test } from '@playwright/test';
import { bootstrapSession } from './helpers/session';
import {
  okJsonBody,
  setupApiCatchAllEmpty,
  setupCoreAuthenticatedApiMocks,
} from './helpers/api-mock';

const adminUbicacionesProfile = {
  id: 'e2e-admin-ubi',
  username: 'admin_ubi',
  nombre: 'Admin Ubicaciones E2E',
  email: 'admin-ubi@smarteconomat.e2e',
  rol: 'ADMIN',
  permisos: [
    'usuarios:listar',
    'ubicaciones:listar',
    'ubicaciones:crear',
    'ubicaciones:editar',
    'ubicaciones:eliminar',
  ],
  idioma: 'es',
};

test.describe('Administración — ubicaciones', () => {
  test('CRUD básico: listado, crear y reflejo en tabla', async ({ page }) => {
    test.setTimeout(60_000);
    await bootstrapSession(page);
    await setupApiCatchAllEmpty(page);
    await setupCoreAuthenticatedApiMocks(page, adminUbicacionesProfile);

    const ubicaciones: Array<{
      id: string;
      nombre: string;
      descripcion?: string;
    }> = [{ id: 'ubi-seed', nombre: 'Cocina central', descripcion: '' }];

    await page.route('**/api/v1/ubicacion**', async (route) => {
      const req = route.request();
      const method = req.method();
      const url = new URL(req.url());
      const path = url.pathname.replace(/\/$/, '');

      if (method === 'GET' && path.endsWith('/ubicacion')) {
        await route.fulfill(okJsonBody(ubicaciones));
        return;
      }

      if (method === 'POST' && path.endsWith('/ubicacion')) {
        const body = req.postDataJSON() as {
          nombre: string;
          descripcion?: string;
        };
        const created = {
          id: `ubi-${Date.now()}`,
          nombre: body.nombre,
          descripcion: body.descripcion ?? '',
        };
        ubicaciones.push(created);
        await route.fulfill(okJsonBody(created, 201));
        return;
      }

      await route.fulfill(okJsonBody([], 405));
    });

    await page.goto('/administracion?tab=ubicaciones', {
      waitUntil: 'domcontentloaded',
    });

    const panel = page.getByRole('tabpanel', { name: 'Ubicaciones' });
    await expect(panel).toBeVisible({ timeout: 20_000 });
    await expect(
      panel.getByRole('heading', {
        level: 2,
        name: /Gestión de ubicaciones/i,
      })
    ).toBeVisible({ timeout: 20_000 });

    await expect(page.getByText('Cocina central')).toBeVisible();

    await page.getByRole('button', { name: /Nueva ubicación/i }).click();
    await page
      .getByRole('dialog')
      .getByRole('textbox', { name: 'Nombre de la ubicación' })
      .fill('Cámara fría 2');
    await page
      .getByRole('dialog')
      .getByRole('button', { name: /^Guardar$/ })
      .click();

    await expect(page.getByText('Cámara fría 2')).toBeVisible();
  });
});
