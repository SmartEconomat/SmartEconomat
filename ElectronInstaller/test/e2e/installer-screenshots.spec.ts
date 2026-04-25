import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { expect, test } from "@playwright/test";
import type { Locator } from "@playwright/test";
import type { ElectronApplication, Page } from "playwright";
import { _electron as electron } from "playwright";

import {
  SCREENSHOT_CAPTURE_MATRIX,
  type ScreenshotCategory,
} from "./screenshot-capture-matrix";

type CaptureResult = {
  filename: string;
  category: ScreenshotCategory;
  description: string;
  window: string;
  status: "ok" | "error";
  detail?: string;
};

type CaptureReport = {
  generatedAt: string;
  os: NodeJS.Platform;
  screenshotsRoot: string;
  screenshots: CaptureResult[];
  windowsDetected: string[];
  inaccessibleScreens: string[];
};

const THIS_FILE = fileURLToPath(import.meta.url);
const THIS_DIR = path.dirname(THIS_FILE);
const INSTALLER_ROOT = path.resolve(THIS_DIR, "../..");
const SCREENSHOTS_ROOT = path.join(INSTALLER_ROOT, "screenshots");
const REPORT_PATH = path.join(SCREENSHOTS_ROOT, "capture-report.json");

const MATRIX_BY_PATH = new Map(
  SCREENSHOT_CAPTURE_MATRIX.map((e) => [e.relativePath, e]),
);

function resolveCategory(relativePath: string): ScreenshotCategory {
  const prefix = relativePath.split("/")[0];
  if (prefix === "admin" || prefix === "wizard" || prefix === "debug") {
    return prefix;
  }
  return "wizard";
}

function resolveDescription(relativePath: string): string {
  return MATRIX_BY_PATH.get(relativePath)?.description ?? relativePath;
}

async function pause(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function settle(page: Page, extraMs = 400): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  await pause(extraMs);
}

async function waitEnabled(locator: Locator, timeoutMs = 20000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if ((await locator.count()) > 0 && (await locator.first().isEnabled())) {
      return;
    }
    await pause(250);
  }
  throw new Error("Elemento no habilitado dentro del timeout.");
}

async function clickSafe(locator: Locator): Promise<void> {
  if ((await locator.count()) === 0) {
    throw new Error("Elemento no encontrado para click.");
  }
  const target = locator.first();
  await target.scrollIntoViewIfNeeded();
  await target.click({ timeout: 10000, force: true });
}

async function scrollPageToTop(page: Page): Promise<void> {
  await page.evaluate(() => {
    const scrollTarget =
      document.querySelector<HTMLElement>('[style*="overflow-y: auto"]') ??
      document.scrollingElement ??
      document.documentElement;
    if (!scrollTarget) {
      return;
    }
    scrollTarget.scrollTop = 0;
  });
  await settle(page, 350);
}

async function capture(
  page: Page,
  relativePath: string,
  windowName: string,
  report: CaptureReport,
  fullPage = true,
): Promise<void> {
  const category = resolveCategory(relativePath);
  const description = resolveDescription(relativePath);
  const abs = path.join(SCREENSHOTS_ROOT, relativePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  try {
    await settle(page, 650);
    await page.screenshot({
      path: abs,
      fullPage,
      animations: "disabled",
      caret: "hide",
      scale: "device",
    });
    report.screenshots.push({
      filename: relativePath,
      category,
      description,
      window: windowName,
      status: "ok",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    report.screenshots.push({
      filename: relativePath,
      category,
      description,
      window: windowName,
      status: "error",
      detail,
    });
    report.inaccessibleScreens.push(`${relativePath}: ${detail}`);
  }
}

async function captureLocator(
  locator: Locator,
  page: Page,
  relativePath: string,
  windowName: string,
  report: CaptureReport,
): Promise<void> {
  const category = resolveCategory(relativePath);
  const description = resolveDescription(relativePath);
  const abs = path.join(SCREENSHOTS_ROOT, relativePath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  try {
    await locator.first().scrollIntoViewIfNeeded();
    await settle(page, 450);
    await locator.first().screenshot({
      path: abs,
      animations: "disabled",
      caret: "hide",
      scale: "device",
    });
    report.screenshots.push({
      filename: relativePath,
      category,
      description,
      window: windowName,
      status: "ok",
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    report.screenshots.push({
      filename: relativePath,
      category,
      description,
      window: windowName,
      status: "error",
      detail,
    });
    report.inaccessibleScreens.push(`${relativePath}: ${detail}`);
  }
}

async function setMockFlags(
  page: Page,
  flags: Record<string, string | number | boolean>,
): Promise<void> {
  await page.evaluate(async (payload) => {
    const api = (
      window as unknown as {
        smartEconomat?: {
          setCaptureMockFlags?: (
            p: Record<string, string | number | boolean>,
          ) => Promise<unknown>;
        };
      }
    ).smartEconomat;
    if (api?.setCaptureMockFlags) {
      await api.setCaptureMockFlags(payload);
      return;
    }
    const win = window as unknown as {
      __mockBridgeFlags?: Record<string, string | number | boolean>;
    };
    if (!win.__mockBridgeFlags) {
      win.__mockBridgeFlags = {};
    }
    for (const [key, value] of Object.entries(payload)) {
      win.__mockBridgeFlags[key] = value;
    }
  }, flags);
}

function assertMatrixAndReport(report: CaptureReport): void {
  const byFilename = new Map(
    report.screenshots.map((entry) => [entry.filename, entry]),
  );
  const problems: string[] = [];

  for (const entry of SCREENSHOT_CAPTURE_MATRIX) {
    const abs = path.join(SCREENSHOTS_ROOT, entry.relativePath);
    if (!fs.existsSync(abs)) {
      problems.push(`Falta archivo: ${entry.relativePath}`);
      continue;
    }
    if (fs.statSync(abs).size === 0) {
      problems.push(`Archivo vacío: ${entry.relativePath}`);
    }
    const shot = byFilename.get(entry.relativePath);
    if (!shot || shot.status !== "ok") {
      problems.push(
        `Captura no OK: ${entry.relativePath}${shot?.detail ? ` (${shot.detail})` : ""}`,
      );
    }
  }

  if (report.inaccessibleScreens.length > 0) {
    problems.push(
      `inaccessibleScreens: ${report.inaccessibleScreens.join(" | ")}`,
    );
  }

  if (problems.length > 0) {
    throw new Error(
      `Validación de matriz de screenshots fallida:\n${problems.join("\n")}`,
    );
  }
}

async function waitForSecondaryDebugWindow(
  electronApp: ElectronApplication,
  mainWindow: Page,
  timeoutMs = 25000,
): Promise<Page | null> {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const windows = electronApp
      .windows()
      .filter((windowPage) => windowPage !== mainWindow);

    for (const windowPage of windows) {
      const url = windowPage.url();
      if (url.includes("#/debug")) {
        return windowPage;
      }
      const debugHeadingCount = await windowPage
        .getByText("SmartEconomat Debug Console")
        .count();
      if (debugHeadingCount > 0) {
        return windowPage;
      }
    }

    await pause(300);
  }

  return null;
}

test("captura automática completa de pantallas Electron", async () => {
  test.setTimeout(6 * 60 * 1000);

  fs.rmSync(SCREENSHOTS_ROOT, { recursive: true, force: true });
  for (const sub of ["wizard", "admin", "debug"] as const) {
    fs.mkdirSync(path.join(SCREENSHOTS_ROOT, sub), { recursive: true });
  }

  const report: CaptureReport = {
    generatedAt: new Date().toISOString(),
    os: process.platform,
    screenshotsRoot: SCREENSHOTS_ROOT,
    screenshots: [],
    windowsDetected: [],
    inaccessibleScreens: [],
  };

  const appPath = path.resolve(THIS_DIR, "../../out/main/index.js");
  if (!fs.existsSync(appPath)) {
    throw new Error(
      "No existe build de Electron en out/main/index.js. Ejecuta npm run build:app:capture antes de capturar.",
    );
  }

  const electronApp: ElectronApplication = await electron.launch({
    args: [appPath],
    env: {
      ...process.env,
      NODE_ENV: "test",
      DEBUG: "1",
    },
  });

  const trackedWindows = new Set<string>();

  electronApp.on("window", async (page) => {
    await settle(page, 400);
    const name = await page.title();
    trackedWindows.add(name || "window-sin-titulo");
  });

  const firstWindow = await electronApp.firstWindow();
  let mainWindow = firstWindow;
  let debugWindow: Page | null = null;

  for (let attempt = 0; attempt < 40; attempt += 1) {
    const windows = electronApp.windows();
    for (const page of windows) {
      const hasDebugHeading =
        (await page.getByText("SmartEconomat Debug Console").count()) > 0;
      const hasWizardEntry =
        (await page
          .getByRole("button", { name: "Iniciar instalación guiada" })
          .count()) > 0 ||
        (await page.getByText("Installer Plug-and-Play").count()) > 0;

      if (hasDebugHeading) {
        debugWindow = page;
      } else if (hasWizardEntry) {
        mainWindow = page;
      }
    }
    if (mainWindow && debugWindow) {
      break;
    }
    await pause(250);
  }

  await mainWindow.evaluate(() => {
    if (window.location.hash.startsWith("#/debug")) {
      window.location.hash = "#/";
    }
  });
  await mainWindow.setViewportSize({ width: 1920, height: 1240 });
  await mainWindow.reload();
  await settle(mainWindow, 900);

  await capture(mainWindow, "wizard/01-welcome-light.png", "main", report);

  await mainWindow.evaluate(() => localStorage.setItem("appTheme", "dark"));
  await mainWindow.reload();
  await settle(mainWindow, 900);
  await capture(mainWindow, "wizard/02-welcome-dark.png", "main", report);

  await mainWindow.evaluate(() => localStorage.setItem("appTheme", "light"));
  await mainWindow.reload();
  await settle(mainWindow, 900);

  await clickSafe(
    mainWindow.getByRole("button", { name: "Iniciar instalación guiada" }),
  );
  await settle(mainWindow, 500);
  await capture(mainWindow, "wizard/03-preflight-initial.png", "main", report);

  await clickSafe(
    mainWindow.getByRole("button", { name: "Ejecutar preflight" }),
  );
  await mainWindow.getByText("Docker Engine").waitFor({
    state: "visible",
    timeout: 15000,
  });
  await settle(mainWindow, 500);
  await capture(mainWindow, "wizard/04-preflight-ok.png", "main", report);

  const continuePreflight = mainWindow.getByRole("button", {
    name: /Continuar( con advertencias)?/,
  });
  await waitEnabled(continuePreflight);
  await clickSafe(continuePreflight);
  await mainWindow
    .getByRole("heading", { name: "Configuración inicial" })
    .waitFor({
      state: "visible",
      timeout: 15000,
    });

  await settle(mainWindow, 600);
  await scrollPageToTop(mainWindow);
  await capture(mainWindow, "wizard/05-config-top.png", "main", report);

  const entornoSection = mainWindow.getByText("Entorno de ejecución");
  await entornoSection.first().waitFor({ state: "visible", timeout: 10000 });
  await captureLocator(
    entornoSection.locator(
      "xpath=ancestor::div[contains(@class,'MuiPaper-root')][1]",
    ),
    mainWindow,
    "wizard/06-config-env-paper.png",
    "main",
    report,
  );

  const usuariosSection = mainWindow.getByText("Usuarios por defecto");
  await usuariosSection.first().waitFor({ state: "visible", timeout: 10000 });
  await captureLocator(
    usuariosSection.locator(
      "xpath=ancestor::div[contains(@class,'MuiPaper-root')][1]",
    ),
    mainWindow,
    "wizard/07-config-users-paper.png",
    "main",
    report,
  );

  const backupsSection = mainWindow.getByText("Política de backups");
  await backupsSection.first().waitFor({ state: "visible", timeout: 10000 });
  await captureLocator(
    backupsSection.locator(
      "xpath=ancestor::div[contains(@class,'MuiPaper-root')][1]",
    ),
    mainWindow,
    "wizard/08-config-backups-paper.png",
    "main",
    report,
  );

  await clickSafe(mainWindow.getByRole("button", { name: "Mostrar avanzado" }));
  await settle(mainWindow, 500);
  const secretosSection = mainWindow.getByText(
    "Configuración avanzada de secretos",
  );
  await secretosSection.first().waitFor({ state: "visible", timeout: 10000 });
  await captureLocator(
    secretosSection.locator(
      "xpath=ancestor::div[contains(@class,'MuiPaper-root')][1]",
    ),
    mainWindow,
    "wizard/09-config-advanced-secrets-paper.png",
    "main",
    report,
  );

  const superAdminPaper = mainWindow
    .locator(".MuiPaper-root")
    .filter({ hasText: "Usuario superadmin" })
    .first();
  const superAdminUserField = superAdminPaper.getByRole("textbox").first();
  await superAdminUserField.fill("admin");
  await settle(mainWindow, 400);
  await capture(
    mainWindow,
    "wizard/10-config-validation-username-collision.png",
    "main",
    report,
  );
  await superAdminUserField.fill("superadmin");

  const checkboxNew = mainWindow.getByRole("checkbox", {
    name: /Entiendo las implicaciones/i,
  });
  if ((await checkboxNew.count()) > 0) {
    try {
      await checkboxNew.first().check({ force: true });
    } catch {
      await mainWindow.evaluate(() => {
        const labels = Array.from(document.querySelectorAll("label"));
        for (const label of labels) {
          const text = label.textContent ?? "";
          if (
            !text.includes("Entiendo las implicaciones") ||
            !text.toLowerCase().includes("instalación nueva")
          ) {
            continue;
          }
          const input = label.querySelector(
            "input[type='checkbox']",
          ) as HTMLInputElement | null;
          if (!input) {
            continue;
          }
          label.click();
          input.checked = true;
          input.dispatchEvent(new Event("click", { bubbles: true }));
          input.dispatchEvent(new Event("input", { bubbles: true }));
          input.dispatchEvent(new Event("change", { bubbles: true }));
          break;
        }
      });
    }
  }

  const continueConfig = mainWindow.getByRole("button", {
    name: /^Continuar$/,
  });
  await waitEnabled(continueConfig, 15000);
  await clickSafe(continueConfig);
  await mainWindow
    .getByRole("heading", { name: "Configuración de Email (SMTP)" })
    .waitFor({ state: "visible", timeout: 12000 });

  await settle(mainWindow, 500);
  await capture(mainWindow, "wizard/11-smtp-initial.png", "main", report);

  await mainWindow.getByPlaceholder("smtp.ejemplo.com").fill("smtp.mock.local");
  await mainWindow.getByPlaceholder("587").fill("587");
  await settle(mainWindow, 400);

  await clickSafe(mainWindow.getByRole("button", { name: /^Continuar$/ }));
  await mainWindow
    .getByRole("button", { name: "Iniciar instalación" })
    .waitFor({
      state: "visible",
      timeout: 12000,
    });

  await settle(mainWindow, 500);
  await capture(
    mainWindow,
    "wizard/12-deploy-before-start.png",
    "main",
    report,
  );
  await clickSafe(
    mainWindow.getByRole("button", { name: "Iniciar instalación" }),
  );
  await mainWindow
    .locator(".MuiLinearProgress-root, .MuiCircularProgress-root")
    .first()
    .waitFor({ state: "visible", timeout: 8000 })
    .catch(async () => {
      await mainWindow
        .getByText(/Preflight|Comprobaciones|Desplegando/i)
        .first()
        .waitFor({
          state: "visible",
          timeout: 8000,
        });
    });
  await settle(mainWindow, 1500);
  await capture(mainWindow, "wizard/13-deploy-progress.png", "main", report);

  await mainWindow
    .getByRole("heading", {
      name: /Instalación finalizada|Instalación con incidencias/i,
    })
    .waitFor({
      state: "visible",
      timeout: 30000,
    });
  await settle(mainWindow, 700);
  await capture(mainWindow, "wizard/14-finish-success.png", "main", report);

  await clickSafe(
    mainWindow.getByRole("button", { name: "Reintentar instalación" }),
  );
  await mainWindow
    .getByRole("button", { name: "Iniciar instalación" })
    .waitFor({
      state: "visible",
      timeout: 12000,
    });
  await setMockFlags(mainWindow, {
    installFailMessage:
      "Fallo simulado durante el despliegue Docker (captura QA).",
  });
  await clickSafe(
    mainWindow.getByRole("button", { name: "Iniciar instalación" }),
  );
  await mainWindow
    .getByRole("alert")
    .filter({ hasText: /Fallo simulado/i })
    .waitFor({
      state: "visible",
      timeout: 15000,
    });
  await capture(mainWindow, "wizard/15-deploy-retry-error.png", "main", report);

  await setMockFlags(mainWindow, { installFailMessage: "" });
  await clickSafe(
    mainWindow.getByRole("button", { name: "Iniciar instalación" }),
  );
  await mainWindow
    .getByRole("heading", { name: /Instalación finalizada/i })
    .waitFor({
      state: "visible",
      timeout: 30000,
    });
  await settle(mainWindow, 600);

  await clickSafe(
    mainWindow.getByRole("button", { name: "Abrir panel de control local" }),
  );
  await mainWindow.getByRole("heading", { name: "Panel de Control" }).waitFor({
    state: "visible",
    timeout: 20000,
  });
  await settle(mainWindow, 800);
  await scrollPageToTop(mainWindow);
  await capture(mainWindow, "admin/01-control-top.png", "main", report);

  await mainWindow.mouse.wheel(0, 420);
  await settle(mainWindow, 450);
  await capture(
    mainWindow,
    "admin/02-control-actions-band.png",
    "main",
    report,
  );

  await mainWindow.mouse.wheel(0, 520);
  await settle(mainWindow, 450);
  await capture(
    mainWindow,
    "admin/03-control-services-band.png",
    "main",
    report,
  );

  await clickSafe(
    mainWindow.getByRole("button", { name: "Logs Backend", exact: true }),
  );
  await settle(mainWindow, 600);
  const logsHeading = mainWindow.getByRole("heading", {
    name: "Logs de la Aplicación",
  });
  await logsHeading.waitFor({ state: "visible", timeout: 12000 });
  await captureLocator(
    logsHeading.locator(
      "xpath=ancestor::div[contains(@class,'MuiPaper-root')][1]",
    ),
    mainWindow,
    "admin/04-control-logs-paper.png",
    "main",
    report,
  );

  const backupHeading = mainWindow.getByRole("heading", {
    name: "Backup y Restauración",
  });
  await backupHeading.waitFor({ state: "visible", timeout: 12000 });
  await captureLocator(
    backupHeading.locator(
      "xpath=ancestor::div[contains(@class,'MuiPaper-root')][1]",
    ),
    mainWindow,
    "admin/05-control-backup-paper.png",
    "main",
    report,
  );

  await clickSafe(
    mainWindow.getByRole("button", { name: "Limpieza Agresiva", exact: true }),
  );
  const pruneDialog = mainWindow.getByRole("dialog", {
    name: "Confirmar limpieza agresiva",
  });
  await expect(pruneDialog).toBeVisible();
  await capture(mainWindow, "admin/06-modal-prune-open.png", "main", report);
  await pruneDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(pruneDialog).toBeHidden();

  await clickSafe(
    mainWindow.getByRole("button", {
      name: "Desinstalar SmartEconomat",
      exact: true,
    }),
  );
  const uninstallDialog = mainWindow.getByRole("dialog", {
    name: "Confirmar desinstalación completa",
  });
  await expect(uninstallDialog).toBeVisible();
  await capture(
    mainWindow,
    "admin/07-modal-uninstall-open.png",
    "main",
    report,
  );
  await uninstallDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(uninstallDialog).toBeHidden();

  await clickSafe(
    mainWindow.getByRole("button", { name: "Crear Backup Ahora", exact: true }),
  );
  const backupDialog = mainWindow.getByRole("dialog", {
    name: "Destino del backup manual",
  });
  await expect(backupDialog).toBeVisible();
  await capture(
    mainWindow,
    "admin/08-modal-backup-destination.png",
    "main",
    report,
  );
  await backupDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(backupDialog).toBeHidden();

  const resolvedDebugWindow =
    debugWindow && debugWindow !== mainWindow
      ? debugWindow
      : await waitForSecondaryDebugWindow(electronApp, mainWindow);

  if (!resolvedDebugWindow) {
    throw new Error(
      "No se detectó ventana secundaria de debug. Verifica ejecución equivalente a npm run start.",
    );
  }

  await resolvedDebugWindow.bringToFront();
  await resolvedDebugWindow.setViewportSize({ width: 1720, height: 1080 });
  await settle(resolvedDebugWindow, 800);
  await resolvedDebugWindow
    .getByText("SmartEconomat Debug Console")
    .first()
    .waitFor({ state: "visible", timeout: 12000 });
  await capture(
    resolvedDebugWindow,
    "debug/01-debug-console.png",
    "debug-secondary",
    report,
  );

  report.windowsDetected = [...trackedWindows];
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");

  assertMatrixAndReport(report);

  await electronApp.close();
});
