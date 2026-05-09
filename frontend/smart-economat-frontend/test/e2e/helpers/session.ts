import { expect, type Page } from '@playwright/test';
import { TUTORIAL_COMPLETED_STORAGE_KEY } from '../../../src/store/tutorial.persistence';

const allPermissions = [
  'dashboard:ver_estadisticas',
  'productos:listar',
  'productos:crear',
  'proveedores:listar',
  'proveedores:crear',
  'recetas:listar',
  'pedidos:listar',
  'recepciones:listar',
  'distribuciones:listar',
  'albaranes:listar',
  'inventario:listar',
  'inventario:ajustar_stock',
  'ubicaciones:listar',
  'movimientos:listar',
  'merma:listar',
  'incidencias:listar',
  'usuarios:listar',
  'profesor:gestionar_slots',
  'profesor:ver_alumnos',
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

export async function installApiMocks(page: Page): Promise<void> {
  await page.route('**/api/v1/usuarios/perfil**', async (route) => {
    await route.fulfill(
      okJson({
        id: 'e2e-user-id',
        username: 'admin',
        nombre: 'QA Admin',
        email: 'qa@smarteconomat.local',
        rol: 'admin',
        permisos: allPermissions,
      })
    );
  });

  await page.route('**/api/v1/auth/login', async (route) => {
    await route.fulfill(
      okJson({ access_token: 'e2e-token' }, 'Login correcto')
    );
  });

  await page.route('**/api/v1/auth/logout', async (route) => {
    await route.fulfill(okJson({}, 'Logout correcto'));
  });

  await page.route('**/api/v1/auth/forgot-password', async (route) => {
    await route.fulfill(okJson({}, 'Recuperación enviada'));
  });

  await page.route('**/api/v1/**', async (route) => {
    await route.fulfill(okJson([]));
  });
}

export async function bootstrapSession(page: Page): Promise<void> {
  await page.addInitScript((storageKey: string) => {
    window.localStorage.setItem('sm_has_session', 'true');
    window.localStorage.setItem(storageKey, 'true');
  }, TUTORIAL_COMPLETED_STORAGE_KEY);
}

export async function gotoProtected(page: Page, path = '/'): Promise<void> {
  await bootstrapSession(page);
  await installApiMocks(page);
  await page.goto(path, { waitUntil: 'domcontentloaded' });
  await expect(page.getByLabel('Cabecera superior')).toBeVisible();
  await expect(page.getByLabel('Navegación principal')).toBeVisible();
}
