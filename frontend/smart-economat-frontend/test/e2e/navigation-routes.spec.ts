import { expect, test } from '@playwright/test';

import { gotoProtected } from './helpers/session';

const routeChecks = [
  { path: '/', menuTitle: 'Inicio' },
  { path: '/productos', menuTitle: 'Productos' },
  { path: '/proveedores', menuTitle: 'Proveedores' },
  { path: '/recetas', menuTitle: 'Recetas' },
  { path: '/pedidos', menuTitle: 'Pedidos' },
  { path: '/recepciones', menuTitle: 'Recepción' },
  { path: '/distribucion', menuTitle: 'Distribución' },
  { path: '/preparaciones', menuTitle: 'Preparaciones' },
  { path: '/albaranes', menuTitle: 'Albaranes' },
  { path: '/inventario', menuTitle: 'Inventario' },
  { path: '/movimientos', menuTitle: 'Movimientos' },
  { path: '/mermas', menuTitle: 'Mermas' },
  { path: '/incidencias', menuTitle: 'Incidencias' },
  { path: '/administracion', menuTitle: 'Administración' },
];

test.describe('Frontend navegación protegida', () => {
  test('abre menú de usuario y navega a perfil', async ({ page }) => {
    await gotoProtected(page);
    await page.getByLabel('Abrir menú de usuario').click();
    await page.getByRole('menuitem', { name: 'Mi Perfil' }).click();
    await expect(page).toHaveURL(/\/perfil$/);
  });

  for (const routeCheck of routeChecks) {
    test(`ruta ${routeCheck.path} carga en contexto autenticado`, async ({
      page,
    }) => {
      await gotoProtected(page);
      await page.goto(routeCheck.path, { waitUntil: 'domcontentloaded' });
      await expect
        .poll(() => new URL(page.url()).pathname)
        .toMatch(
          new RegExp(`^(${routeCheck.path.replace('/', '\\/')}|\\/perfil)$`)
        );
      await expect(page.getByLabel('Contenido principal')).toBeVisible();
    });
  }
});
