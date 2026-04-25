import { expect, test } from "@playwright/test";

import {
  goToControlPanel,
  gotoInstallerWithMock,
  navigateToConfigStep,
  readBridgeCalls,
} from "./helpers/installer-app";

test.describe("Instalador — cobertura ampliada UI / flujos", () => {
  test.beforeEach(async ({ page }) => {
    await gotoInstallerWithMock(page);
  });

  test("pantalla de bienvenida muestra título y CTA principal", async ({
    page,
  }) => {
    await expect(
      page.getByRole("heading", { name: "Installer Plug-and-Play" }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Bienvenida" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Iniciar instalación guiada" }),
    ).toBeVisible();
  });

  test("preflight: Continuar deshabilitado hasta ejecutar comprobaciones", async ({
    page,
  }) => {
    await page.getByRole("button", { name: "Iniciar instalación guiada" }).click();
    await expect(page.getByRole("heading", { name: "Preflight" })).toBeVisible();

    const continueBtn = page.getByRole("button", { name: /^Continuar$/ });
    await expect(continueBtn).toBeDisabled();

    await page.getByRole("button", { name: "Ejecutar preflight" }).click();
    await expect(page.getByText("Docker Engine")).toBeVisible();
    await expect(continueBtn).toBeEnabled();
  });

  test("preflight: Atrás vuelve a bienvenida", async ({ page }) => {
    await page.getByRole("button", { name: "Iniciar instalación guiada" }).click();
    await page.getByRole("button", { name: "Atrás" }).click();
    await expect(page.getByRole("heading", { name: "Bienvenida" })).toBeVisible();
  });

  test("config: edita Host local y avanza a SMTP", async ({ page }) => {
    await navigateToConfigStep(page);

    const hostInput = page.locator('[aria-label="Host local"]');
    await hostInput.fill("instalador.e2e.local");
    await expect(hostInput).toHaveValue("instalador.e2e.local");

    await page.getByRole("button", { name: /^Continuar$/ }).click();
    await expect(
      page.getByRole("heading", { name: "Configuración de Email (SMTP)" }),
    ).toBeVisible();
  });

  test("SMTP: Probar conexión invoca bridge.testSmtp", async ({ page }) => {
    await navigateToConfigStep(page);
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    await page.locator('[aria-label="Host SMTP"]').fill("smtp.mock.test");
    await page.locator('[aria-label="Puerto SMTP"]').fill("587");

    const testBtn = page.getByRole("button", { name: "Probar conexión" });
    await expect(testBtn).toBeEnabled();
    await testBtn.click();
    await expect(page.getByText("Mocked SMTP")).toBeVisible();

    const calls = await readBridgeCalls(page);
    expect(calls?.testSmtp).toBe(1);
  });

  test("SMTP: Atrás regresa a configuración y Continuar conserva datos", async ({
    page,
  }) => {
    await navigateToConfigStep(page);
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    await page.locator('[aria-label="Host SMTP"]').fill("smtp.retain.test");
    await page.locator('[aria-label="Puerto SMTP"]').fill("465");

    await page.getByRole("button", { name: "Atrás" }).click();
    await expect(
      page.getByRole("heading", { name: "Configuración inicial" }),
    ).toBeVisible();

    const reconfirmNew = page.getByRole("checkbox", {
      name: /Entiendo las implicaciones y deseo continuar con la instalación nueva/i,
    });
    if (await reconfirmNew.isVisible()) {
      await reconfirmNew.check();
    }

    await page.getByRole("button", { name: /^Continuar$/ }).click();
    await expect(page.locator('[aria-label="Host SMTP"]')).toHaveValue(
      "smtp.retain.test",
    );
  });

  test("deploy: vista de despliegue con acción principal", async ({ page }) => {
    await navigateToConfigStep(page);
    await page.getByRole("button", { name: /^Continuar$/ }).click();
    await page.getByRole("button", { name: /^Continuar$/ }).click();

    await expect(
      page.getByRole("button", { name: "Iniciar instalación" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Atrás" }).click();
    await expect(
      page.getByRole("heading", { name: "Configuración de Email (SMTP)" }),
    ).toBeVisible();
  });

  test("finalizar: Reintentar instalación vuelve al paso de despliegue", async ({
    page,
  }) => {
    await navigateToConfigStep(page);
    await page.getByRole("button", { name: /^Continuar$/ }).click();
    await page.getByRole("button", { name: /^Continuar$/ }).click();
    await page.getByRole("button", { name: "Iniciar instalación" }).click();
    await expect(page.getByText("Instalación finalizada")).toBeVisible();
    await page.getByRole("button", { name: "Reintentar instalación" }).click();
    await expect(
      page.getByRole("button", { name: "Iniciar instalación" }),
    ).toBeVisible();
  });

  test("panel: logs frontend, exportar logs y acciones avanzadas", async ({
    page,
  }) => {
    await goToControlPanel(page);

    const exportBtn = page.getByRole("button", { name: "Exportar Logs" });
    await expect(exportBtn).toBeDisabled();

    await page.getByRole("button", { name: "Logs Frontend", exact: true }).click();
    await expect(exportBtn).toBeEnabled();
    await exportBtn.click();

    await page.getByRole("button", { name: "Logs DB", exact: true }).click();
    await page.getByRole("button", { name: "Reparar ahora", exact: true }).click();
    await page
      .getByRole("button", { name: "Reiniciar Docker", exact: true })
      .click();

    const calls = await readBridgeCalls(page);
    expect(calls?.exportVisibleLogs).toBe(1);
    expect(calls?.tailLogs).toBeGreaterThanOrEqual(2);
    expect(calls?.runSupervisorRecovery).toBe(1);
    expect(calls?.restartDockerDesktop).toBe(1);
  });

  test("panel: desinstalación requiere frase de confirmación", async ({
    page,
  }) => {
    await goToControlPanel(page);

    await page
      .getByRole("button", { name: "Desinstalar SmartEconomat" })
      .click();
    const dialog = page.getByRole("dialog", {
      name: "Confirmar desinstalación completa",
    });
    await expect(dialog).toBeVisible();

    const confirmBtn = dialog.getByRole("button", {
      name: "Desinstalar SmartEconomat",
    });
    await expect(confirmBtn).toBeDisabled();
    await dialog.getByRole("textbox").fill("CONFIRMAR");
    await expect(confirmBtn).toBeEnabled();
    await confirmBtn.click();
    await expect(dialog).not.toBeVisible();

    const calls = await readBridgeCalls(page);
    expect(calls?.uninstall).toBe(1);
  });

  test("viewport móvil: bienvenida sigue mostrando CTA", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await expect(
      page.getByRole("button", { name: "Iniciar instalación guiada" }),
    ).toBeVisible();
  });
});
