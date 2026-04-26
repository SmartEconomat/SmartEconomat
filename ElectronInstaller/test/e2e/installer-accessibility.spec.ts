import { expect, test } from '@playwright/test';

import {
  gotoInstallerWithMock,
  navigateToConfigStep,
  goToControlPanel,
  readBridgeCalls,
} from './helpers/installer-app';

test.describe('Installer UX/a11y regression', () => {
  test.beforeEach(async ({ page }) => {
    await gotoInstallerWithMock(page);
  });

  test('wizard permite navegación por teclado y mantiene CTA visible', async ({
    page,
  }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('heading', { name: 'Preflight' })).toBeVisible();

    await page.getByRole('button', { name: 'Ejecutar preflight' }).click();
    await expect(page.getByRole('button', { name: /^Continuar$/ })).toBeEnabled();
  });

  test('SMTP no ejecuta test con datos vacíos y respeta validación', async ({
    page,
  }) => {
    await navigateToConfigStep(page);
    await page.getByRole('button', { name: /^Continuar$/ }).click();
    await expect(page.getByRole('button', { name: 'Probar conexión' })).toBeDisabled();
  });

  test('modal de limpieza agresiva se puede cancelar sin side effects', async ({
    page,
  }) => {
    await goToControlPanel(page);
    await page.getByRole('button', { name: 'Limpieza Agresiva' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await expect(dialog).not.toBeVisible();

    const calls = await readBridgeCalls(page);
    expect(calls?.pruneSafe).toBe(0);
  });
});
