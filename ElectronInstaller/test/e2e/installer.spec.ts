import { expect, test } from "@playwright/test";

import {
  goToControlPanel,
  gotoInstallerWithMock,
  readBridgeCalls,
} from "./helpers/installer-app";

test.describe("SmartEconomat Installer E2E", () => {
  test.beforeEach(async ({ page }) => {
    await gotoInstallerWithMock(page);
    await expect(
      page.getByRole("button", { name: "Iniciar instalación guiada" }),
    ).toBeVisible();
  });

  test("recorre wizard completo por clics hasta panel de control", async ({
    page,
  }) => {
    await goToControlPanel(page);

    const calls = await readBridgeCalls(page);

    expect(calls?.runPreflight).toBe(1);
    expect(calls?.startInstallation).toBe(1);
  });

  test("ejecuta operaciones principales del panel y actualiza logs", async ({
    page,
  }) => {
    await goToControlPanel(page);

    await page.getByRole("button", { name: "Iniciar Stack", exact: true }).click();
    await page.getByRole("button", { name: "Detener Stack", exact: true }).click();
    await page
      .getByRole("button", { name: "Reiniciar Stack", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Verificar Salud", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Logs Backend", exact: true })
      .click();
    await page.getByRole("button", { name: "Detener Logs", exact: true }).click();
    await page
      .getByRole("button", {
        name: "Generar Diagnóstico Completo",
        exact: true,
      })
      .click();

    await expect(page.getByText("Logs de la Aplicación")).toBeVisible();

    const calls = await readBridgeCalls(page);

    expect(calls?.startStack).toBe(1);
    expect(calls?.stopStack).toBe(1);
    expect(calls?.restartStack).toBe(1);
    expect(calls?.tailLogs).toBeGreaterThanOrEqual(1);
    expect(calls?.stopLogStream).toBe(1);
    expect(calls?.diagnostics).toBe(1);
  });

  test("valida salvaguardas de limpieza agresiva", async ({ page }) => {
    await goToControlPanel(page);

    await page.getByRole("button", { name: "Limpieza Agresiva" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    const confirmButton = dialog.getByRole("button", {
      name: "Ejecutar limpieza agresiva",
    });
    await expect(confirmButton).toBeDisabled();

    await dialog.getByRole("textbox").fill("CONFIRMAR");
    await expect(confirmButton).toBeEnabled();
    await confirmButton.click();
    await expect(dialog).not.toBeVisible();

    const calls = await readBridgeCalls(page);

    expect(calls?.pruneSafe).toBe(1);
  });

  test("cubre backup, selección de artefacto y restauración con confirmación", async ({
    page,
  }) => {
    await goToControlPanel(page);

    await page.getByRole("button", { name: "Crear Backup Ahora" }).click();
    const backupDialog = page.getByRole("dialog", {
      name: "Destino del backup manual",
    });
    await expect(backupDialog).toBeVisible();
    await backupDialog.getByRole("button", { name: "Iniciar backup" }).click();
    await expect(backupDialog).not.toBeVisible();

    await page.getByRole("button", { name: "Seleccionar archivo..." }).click();
    await expect(
      page.locator(
        'input[value="C:/SmartEconomatRuntime/backups/backup-e2e.tar.gz"]',
      ),
    ).toBeVisible();

    const restoreButton = page.getByRole("button", {
      name: "Restaurar Backup Seleccionado",
    });
    await expect(restoreButton).toBeDisabled();

    await page
      .getByRole("checkbox", {
        name: "Entiendo que esta restauración sobrescribirá el estado actual de SmartEconomat.",
      })
      .check();
    await expect(restoreButton).toBeEnabled();
    await restoreButton.click();

    const calls = await readBridgeCalls(page);

    expect(calls?.backupNow).toBe(1);
    expect(calls?.pickInstallerFile).toBeGreaterThanOrEqual(1);
    expect(calls?.restoreFrom).toBe(1);
  });
});
