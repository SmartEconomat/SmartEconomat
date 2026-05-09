import { expect, test, type Page } from '@playwright/test';

import { installApiMocks } from './helpers/session';

async function openForgotPassword(page: Page) {
  const forgotPasswordLink = page
    .getByRole('link')
    .filter({ hasText: /contrase|password|forgot/i })
    .first();

  await expect(forgotPasswordLink).toBeVisible();
  await forgotPasswordLink.click();
}

test.describe('Frontend auth E2E', () => {
  test.beforeEach(async ({ page }) => {
    await installApiMocks(page);
  });

  test('login renderiza y permite acceso con credenciales válidas', async ({
    page,
  }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    const emailInput = page.locator('input[name="email"]').first();
    await expect(emailInput).toBeVisible();

    await emailInput.fill('admin');
    await page.locator('input[name="password"]').first().fill('Passw0rd!');
    const submitButton = page.locator('form button[type="submit"]').first();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page).toHaveURL(/\/($|perfil$)/, { timeout: 15000 });
  });

  test('flujo forgot password muestra estado success', async ({ page }) => {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await openForgotPassword(page);

    const emailInput = page.locator('input[name="email"]').first();
    await expect(emailInput).toBeVisible();
    await emailInput.fill('qa@smarteconomat.local');

    const submitButton = page.locator('form button[type="submit"]').first();
    await expect(submitButton).toBeEnabled();
    await submitButton.click();

    await expect(page.getByRole('alert')).toBeVisible();
  });
});
