import { expect, test } from '@playwright/test';

import { installApiMocks } from './helpers/session';

test.describe('Frontend auth E2E', () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
  });

  test('login renderiza y permite acceso con credenciales válidas', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await expect(page.getByLabel('Usuario o Email')).toBeVisible();

    await page.getByLabel('Usuario o Email').fill('admin');
    await page.locator('input[name="password"]').first().fill('Passw0rd!');
    await page.getByRole('button', { name: 'Acceder' }).click();

    await expect(page).toHaveURL(/\/($|perfil$)/, { timeout: 15000 });
    await expect(page.getByLabel('Cabecera superior')).toBeVisible();
  });

  test('flujo forgot password muestra estado success', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.getByRole('link', { name: '¿Olvidaste tu contraseña?' }).click();

    await page.getByLabel('Correo Electrónico').fill('qa@smarteconomat.local');
    await page.getByRole('button', { name: 'Restablecer Contraseña' }).click();

    await expect(page.getByRole('alert')).toBeVisible();
  });
});
