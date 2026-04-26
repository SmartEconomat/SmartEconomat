import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, type Page } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const INSTALLER_BRIDGE_MOCK_PATH = path.join(
  __dirname,
  "..",
  "fixtures",
  "installer-bridge.mock.js",
);

/**
 * Documentación en español.
 */
export type InstallerBridgeCallCounts = {
  runPreflight: number;
  startInstallation: number;
  startStack: number;
  stopStack: number;
  restartStack: number;
  getHealth: number;
  tailLogs: number;
  stopLogStream: number;
  exportVisibleLogs: number;
  pruneSafe: number;
  backupNow: number;
  restoreFrom: number;
  diagnostics: number;
  pickInstallerFile: number;
  testSmtp: number;
  uninstall: number;
  restartDockerDesktop: number;
  runSupervisorRecovery: number;
};

export async function gotoInstallerWithMock(page: Page): Promise<void> {
  await page.addInitScript({ path: INSTALLER_BRIDGE_MOCK_PATH });
  await page.goto("/");
}

export async function readBridgeCalls(
  page: Page,
): Promise<InstallerBridgeCallCounts | undefined> {
  return page.evaluate(() => {
    return (
      window as Window & { __bridgeCalls?: InstallerBridgeCallCounts }
    ).__bridgeCalls;
  });
}

/**
 * Documentación en español.
 */
export async function navigateToConfigStep(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Iniciar instalación guiada" }).click();
  await page.getByRole("button", { name: "Ejecutar preflight" }).click();
  await expect(page.getByText("Docker Engine")).toBeVisible();
  await page.getByRole("button", { name: /^Continuar$/ }).click();

  const confirmNewInstallCheckbox = page.getByRole("checkbox", {
    name: /Entiendo las implicaciones y deseo continuar con la instalación nueva/i,
  });
  if (await confirmNewInstallCheckbox.isVisible()) {
    await confirmNewInstallCheckbox.check();
  }

  const scheduleTimeInput = page.getByLabel("Hora programada");
  if (await scheduleTimeInput.isVisible()) {
    await scheduleTimeInput.fill("02:00");
  }

  await expect(
    page.getByRole("heading", { name: "Configuración inicial" }),
  ).toBeVisible();
}

/**
 * Documentación en español.
 */
export async function goToControlPanel(page: Page): Promise<void> {
  await expect(
    page.getByRole("button", { name: "Iniciar instalación guiada" }),
  ).toBeVisible();
  await navigateToConfigStep(page);

  await page.getByRole("button", { name: /^Continuar$/ }).click();

  const smtpStepHeading = page.getByRole("heading", {
    name: "Configuración de Email (SMTP)",
  });
  if (await smtpStepHeading.isVisible()) {
    await page.getByRole("button", { name: /^Continuar$/ }).click();
  }

  await page.getByRole("button", { name: "Iniciar instalación" }).click();
  await expect(page.getByText("Instalación finalizada")).toBeVisible();
  await page.getByRole("button", { name: "Abrir panel de control local" }).click();
  await expect(
    page.getByRole("heading", { name: "Panel de Control" }),
  ).toBeVisible();
}
