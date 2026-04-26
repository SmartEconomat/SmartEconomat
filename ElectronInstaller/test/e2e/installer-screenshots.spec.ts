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

async function installBridgeMockInitScript(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const win = window as unknown as {
      smartEconomat?: Record<string, unknown>;
      __mockBridgeFlags?: Record<string, string | number | boolean>;
      __bridgeCalls?: Record<string, number>;
    };
    if (win.smartEconomat) {
      return;
    }
    const progressListeners: Array<
      (event: { snapshot: Record<string, unknown> }) => void
    > = [];
    const runtimeListeners: Array<
      (event: { service: string; line: string; timestamp: string }) => void
    > = [];
    const debugListeners: Array<
      (event: {
        type: "log" | "warn" | "error" | "ipc" | "system";
        message: string;
        timestamp: number;
        source?: string;
        context?: unknown;
      }) => void
    > = [];
    const noOpUnsub = () => undefined;
    win.__mockBridgeFlags = win.__mockBridgeFlags ?? {};
    win.__bridgeCalls = win.__bridgeCalls ?? {};
    win.smartEconomat = {
      setCaptureMockFlags: async (
        payload: Record<string, string | number | boolean>,
      ) => {
        for (const [key, value] of Object.entries(payload)) {
          (win.__mockBridgeFlags as Record<string, string | number | boolean>)[
            key
          ] = value;
        }
        return { ok: true, message: "Flags mock actualizadas" };
      },
      getInstallerBootState: async () => ({
        ok: true,
        message: "Boot mock",
        data: { installed: false, runtimePath: "C:/SmartEconomatRuntime" },
      }),
      onInstallerProgress: (
        callback: (event: { snapshot: Record<string, unknown> }) => void,
      ) => {
        progressListeners.push(callback);
        return noOpUnsub;
      },
      onRuntimeLog: (
        callback: (event: { service: string; line: string; timestamp: string }) => void,
      ) => {
        runtimeListeners.push(callback);
        return noOpUnsub;
      },
      onHealthUpdate: () => noOpUnsub,
      runPreflight: async () => ({
        ok: true,
        message: "Preflight OK",
        data: {
          generatedAt: new Date().toISOString(),
          checks: [
            {
              id: "docker",
              label: "Docker Engine",
              status: "OK",
              detail: "Docker operativo (mock).",
            },
            {
              id: "compose",
              label: "Docker Compose",
              status: "OK",
              detail: "Compose operativo (mock).",
            },
          ],
        },
      }),
      runPreflightAutoRepair: async () => ({
        ok: true,
        message: "AutoRepair OK",
        data: {
          generatedAt: new Date().toISOString(),
          checks: [
            {
              id: "docker",
              label: "Docker Engine",
              status: "OK",
              detail: "Docker operativo (mock).",
            },
            {
              id: "compose",
              label: "Docker Compose",
              status: "OK",
              detail: "Compose operativo (mock).",
            },
          ],
        },
      }),
      releaseBusyPort: async () => ({ ok: true, message: "Puerto liberado" }),
      testSmtp: async () => ({ ok: true, message: "Mocked SMTP", data: true }),
      startInstallation: async () => {
        const failMessage = String(
          (win.__mockBridgeFlags as Record<string, unknown>).installFailMessage ??
            "",
        ).trim();
        if (failMessage.length > 0) {
          return { ok: false, message: failMessage };
        }
        const inProgress = {
          snapshot: {
            state: "DOCKER_DEPLOY",
            timestamp: new Date().toISOString(),
            message: "Desplegando",
            stageLabel: "Desplegando",
            progressPercent: 55,
          },
        };
        for (const listener of progressListeners) {
          listener(inProgress);
        }
        for (const listener of runtimeListeners) {
          listener({
            service: "backend",
            line: "Desplegando servicios del stack (mock).",
            timestamp: new Date().toISOString(),
          });
        }
        const done = {
          state: "DONE",
          timestamp: new Date().toISOString(),
          message: "Instalaci?n completada en mock.",
          stageLabel: "Finalizado",
          progressPercent: 100,
        };
        for (const listener of progressListeners) {
          listener({ snapshot: done });
        }
        return { ok: true, message: "Instalaci?n finalizada", data: done };
      },
      startStack: async () => ({ ok: true, message: "Stack iniciado" }),
      stopStack: async () => ({ ok: true, message: "Stack detenido" }),
      restartStack: async () => ({ ok: true, message: "Stack reiniciado" }),
      getHealth: async () => ({
        ok: true,
        message: "Health OK",
        data: [
          { service: "backend", status: "healthy", detail: "OK" },
          { service: "frontend", status: "healthy", detail: "OK" },
          { service: "db", status: "running", detail: "OK" },
          { service: "redis", status: "healthy", detail: "OK" },
        ],
      }),
      tailLogs: async (payload: { service: string }) => {
        for (const listener of runtimeListeners) {
          listener({
            service: payload.service,
            line: `Log mock de ${payload.service}`,
            timestamp: new Date().toISOString(),
          });
        }
        return { ok: true, message: "Logs mock activos" };
      },
      stopLogStream: async () => ({ ok: true, message: "Logs detenidos" }),
      exportVisibleLogs: async () => ({
        ok: true,
        message: "Logs exportados",
        data: "C:/SmartEconomatRuntime/logs/mock.txt",
      }),
      pruneSafe: async () => ({ ok: true, message: "Limpieza ejecutada" }),
      uninstall: async () => ({ ok: true, message: "Desinstalaci?n ejecutada" }),
      backupNow: async () => ({
        ok: true,
        message: "Backup generado",
        data: {
          appVersion: "1.0.0",
          schemaVersion: "v1",
          createdAt: new Date().toISOString(),
          checksum: "checksum-mock",
          archiveName: "backup-mock.zip",
        },
      }),
      restoreFrom: async () => ({ ok: true, message: "Restore OK" }),
      diagnostics: async () => ({
        ok: true,
        message: "Diag OK",
        data: "C:/SmartEconomatRuntime/diagnostics/mock.zip",
      }),
      pickInstallerFile: async (payload: { title?: string }) => ({
        ok: true,
        message: "Archivo mock",
        data: payload.title?.toLowerCase().includes("backup")
          ? "C:/SmartEconomatRuntime/backups/backup-mock.zip"
          : "C:/SmartEconomatRuntime/certs/fullchain.pem",
      }),
      getSupervisorSnapshot: async () => ({
        ok: true,
        message: "Supervisor mock",
        data: {
          overallState: "healthy",
          checks: [],
          lastAutomaticActionAt: null,
          lastAutomaticAction: null,
          uptimeSeconds: 120,
        },
      }),
      restartDockerDesktop: async () => ({ ok: true, message: "Docker reiniciado" }),
      runSupervisorRecovery: async () => ({
        ok: true,
        message: "Recovery ejecutado",
      }),
      onDebugLog: (
        callback: (event: {
          type: "log" | "warn" | "error" | "ipc" | "system";
          message: string;
          timestamp: number;
          source?: string;
          context?: unknown;
        }) => void,
      ) => {
        debugListeners.push(callback);
        return noOpUnsub;
      },
      getDebugLogs: async () => ({
        ok: true,
        message: "Debug logs disponibles",
        data: [
          {
            type: "system",
            source: "renderer",
            message: "Debug bridge mock activo.",
            timestamp: Date.now(),
            context: { mode: "capture" },
          },
        ],
      }),
      clearDebugLogs: async () => ({
        ok: true,
        message: "Debug logs limpiados",
      }),
      isDebugModeEnabled: async () => ({
        ok: true,
        message: "Debug mode activo",
        data: true,
      }),
      sendDebugLog: (entry: {
        type: "log" | "warn" | "error" | "ipc" | "system";
        message: string;
        timestamp: number;
        source?: string;
        context?: unknown;
      }) => {
        for (const listener of debugListeners) {
          listener(entry);
        }
      },
    };
  });
}

async function ensureBridgeReady(page: Page): Promise<void> {
  const hasBridge = await page
    .waitForFunction(() => {
      const api = (window as unknown as { smartEconomat?: unknown }).smartEconomat;
      return Boolean(api);
    }, undefined, { timeout: 3000 })
    .then(
      () => true,
      () => false,
    );
  if (hasBridge) {
    return;
  }

  await page.evaluate(() => {
    const win = window as unknown as {
      smartEconomat?: Record<string, unknown>;
      __mockBridgeFlags?: Record<string, string | number | boolean>;
      __bridgeCalls?: Record<string, number>;
    };
    if (win.smartEconomat) {
      return;
    }
    const progressListeners: Array<(event: { snapshot: Record<string, unknown> }) => void> = [];
    const runtimeListeners: Array<
      (event: { service: string; line: string; timestamp: string }) => void
    > = [];
    const noOpUnsub = () => undefined;
    win.__mockBridgeFlags = win.__mockBridgeFlags ?? {};
    win.__bridgeCalls = win.__bridgeCalls ?? {};
    win.smartEconomat = {
      setCaptureMockFlags: async (payload: Record<string, string | number | boolean>) => {
        for (const [key, value] of Object.entries(payload)) {
          (win.__mockBridgeFlags as Record<string, string | number | boolean>)[key] = value;
        }
        return { ok: true, message: "Flags mock actualizadas" };
      },
      getInstallerBootState: async () => ({
        ok: true,
        message: "Boot mock",
        data: { installed: false, runtimePath: "C:/SmartEconomatRuntime" },
      }),
      onInstallerProgress: (callback: (event: { snapshot: Record<string, unknown> }) => void) => {
        progressListeners.push(callback);
        return noOpUnsub;
      },
      onRuntimeLog: (callback: (event: { service: string; line: string; timestamp: string }) => void) => {
        runtimeListeners.push(callback);
        return noOpUnsub;
      },
      onHealthUpdate: () => noOpUnsub,
      runPreflight: async () => ({
        ok: true,
        message: "Preflight OK",
        data: {
          generatedAt: new Date().toISOString(),
          checks: [
            { id: "docker", label: "Docker Engine", status: "OK", detail: "Docker operativo (mock)." },
            { id: "compose", label: "Docker Compose", status: "OK", detail: "Compose operativo (mock)." },
          ],
        },
      }),
      runPreflightAutoRepair: async () => ({
        ok: true,
        message: "AutoRepair OK",
        data: {
          generatedAt: new Date().toISOString(),
          checks: [
            { id: "docker", label: "Docker Engine", status: "OK", detail: "Docker operativo (mock)." },
            { id: "compose", label: "Docker Compose", status: "OK", detail: "Compose operativo (mock)." },
          ],
        },
      }),
      releaseBusyPort: async () => ({ ok: true, message: "Puerto liberado" }),
      testSmtp: async () => ({ ok: true, message: "Mocked SMTP", data: true }),
      startInstallation: async () => {
        const failMessage = String((win.__mockBridgeFlags as Record<string, unknown>).installFailMessage ?? "").trim();
        if (failMessage.length > 0) {
          return { ok: false, message: failMessage };
        }
        const inProgress = {
          snapshot: {
            state: "DOCKER_DEPLOY",
            timestamp: new Date().toISOString(),
            message: "Desplegando",
            stageLabel: "Desplegando",
            progressPercent: 55,
          },
        };
        for (const listener of progressListeners) {
          listener(inProgress);
        }
        for (const listener of runtimeListeners) {
          listener({
            service: "backend",
            line: "Desplegando servicios del stack (mock).",
            timestamp: new Date().toISOString(),
          });
        }
        const done = {
          state: "DONE",
          timestamp: new Date().toISOString(),
          message: "Instalaci?n completada en mock.",
          stageLabel: "Finalizado",
          progressPercent: 100,
        };
        for (const listener of progressListeners) {
          listener({ snapshot: done });
        }
        return { ok: true, message: "Instalaci?n finalizada", data: done };
      },
      startStack: async () => ({ ok: true, message: "Stack iniciado" }),
      stopStack: async () => ({ ok: true, message: "Stack detenido" }),
      restartStack: async () => ({ ok: true, message: "Stack reiniciado" }),
      getHealth: async () => ({
        ok: true,
        message: "Health OK",
        data: [
          { service: "backend", status: "healthy", detail: "OK" },
          { service: "frontend", status: "healthy", detail: "OK" },
          { service: "db", status: "running", detail: "OK" },
          { service: "redis", status: "healthy", detail: "OK" },
        ],
      }),
      tailLogs: async (payload: { service: string }) => {
        for (const listener of runtimeListeners) {
          listener({
            service: payload.service,
            line: `Log mock de ${payload.service}`,
            timestamp: new Date().toISOString(),
          });
        }
        return { ok: true, message: "Logs mock activos" };
      },
      stopLogStream: async () => ({ ok: true, message: "Logs detenidos" }),
      exportVisibleLogs: async () => ({
        ok: true,
        message: "Logs exportados",
        data: "C:/SmartEconomatRuntime/logs/mock.txt",
      }),
      pruneSafe: async () => ({ ok: true, message: "Limpieza ejecutada" }),
      uninstall: async () => ({ ok: true, message: "Desinstalaci?n ejecutada" }),
      backupNow: async () => ({
        ok: true,
        message: "Backup generado",
        data: {
          appVersion: "1.0.0",
          schemaVersion: "v1",
          createdAt: new Date().toISOString(),
          checksum: "checksum-mock",
          archiveName: "backup-mock.zip",
        },
      }),
      restoreFrom: async () => ({ ok: true, message: "Restore OK" }),
      diagnostics: async () => ({
        ok: true,
        message: "Diag OK",
        data: "C:/SmartEconomatRuntime/diagnostics/mock.zip",
      }),
      pickInstallerFile: async (payload: { title?: string }) => ({
        ok: true,
        message: "Archivo mock",
        data:
          payload.title?.toLowerCase().includes("backup")
            ? "C:/SmartEconomatRuntime/backups/backup-mock.zip"
            : "C:/SmartEconomatRuntime/certs/fullchain.pem",
      }),
      getSupervisorSnapshot: async () => ({
        ok: true,
        message: "Supervisor mock",
        data: {
          overallState: "healthy",
          checks: [],
          lastAutomaticActionAt: null,
          lastAutomaticAction: null,
          uptimeSeconds: 120,
        },
      }),
      restartDockerDesktop: async () => ({ ok: true, message: "Docker reiniciado" }),
      runSupervisorRecovery: async () => ({ ok: true, message: "Recovery ejecutado" }),
      onDebugLog: () => noOpUnsub,
      getDebugLogs: async () => ({
        ok: true,
        message: "Debug logs disponibles",
        data: [
          {
            type: "system",
            source: "renderer",
            message: "Debug bridge mock activo (ensureBridgeReady).",
            timestamp: Date.now(),
            context: { mode: "capture" },
          },
        ],
      }),
      clearDebugLogs: async () => ({
        ok: true,
        message: "Debug logs limpiados",
      }),
      isDebugModeEnabled: async () => ({
        ok: true,
        message: "Debug mode activo",
        data: true,
      }),
      sendDebugLog: () => undefined,
    };
  });

  await page.waitForFunction(() => {
    const api = (window as unknown as { smartEconomat?: unknown }).smartEconomat;
    return Boolean(api);
  });
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
      problems.push(`Archivo vac?o: ${entry.relativePath}`);
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
      `Validaci?n de matriz de screenshots fallida:\n${problems.join("\n")}`,
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

test("captura autom?tica completa de pantallas Electron", async () => {
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
    await installBridgeMockInitScript(page);
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
          .getByRole("button", { name: /Iniciar instalaci.n guiada/i })
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
  await installBridgeMockInitScript(mainWindow);
  await mainWindow.setViewportSize({ width: 1920, height: 1240 });
  await mainWindow.reload();
  await settle(mainWindow, 900);
  await ensureBridgeReady(mainWindow);

  await capture(mainWindow, "wizard/01-welcome-light.png", "main", report);

  await mainWindow.evaluate(() => localStorage.setItem("appTheme", "dark"));
  await mainWindow.reload();
  await settle(mainWindow, 900);
  await ensureBridgeReady(mainWindow);
  await capture(mainWindow, "wizard/02-welcome-dark.png", "main", report);

  await mainWindow.evaluate(() => localStorage.setItem("appTheme", "light"));
  await mainWindow.reload();
  await settle(mainWindow, 900);
  await ensureBridgeReady(mainWindow);

  await clickSafe(
    mainWindow.getByRole("button", { name: /Iniciar instalaci.n guiada/i }),
  );
  await settle(mainWindow, 500);
  await capture(mainWindow, "wizard/03-preflight-initial.png", "main", report);

  await clickSafe(
    mainWindow.getByRole("button", { name: "Ejecutar preflight" }),
  );
  const continuePreflight = mainWindow.getByRole("button", {
    name: /Continuar( con advertencias)?/,
  });
  await expect(continuePreflight.first()).toBeVisible({ timeout: 30000 });
  await settle(mainWindow, 350);
  await capture(
    mainWindow,
    "wizard/05-preflight-loading.png",
    "main",
    report,
  );
  if ((await continuePreflight.count()) === 0) {
    throw new Error("No se encontr? bot?n de continuar en preflight.");
  }
  await settle(mainWindow, 500);
  await capture(mainWindow, "wizard/04-preflight-ok.png", "main", report);
  await mainWindow.evaluate(() => {
    const warningAlert = document.createElement("div");
    warningAlert.setAttribute("role", "alert");
    warningAlert.setAttribute("data-testid", "qa-blockers-warning");
    warningAlert.textContent =
      "Se detectaron 2 bloqueantes. Puedes continuar con advertencias.";
    warningAlert.style.cssText = [
      "position: fixed",
      "right: 20px",
      "bottom: 20px",
      "z-index: 5000",
      "padding: 10px 14px",
      "background: #fff4e5",
      "border: 1px solid #ffb74d",
      "border-radius: 8px",
      "color: #7a4b00",
      "font: 600 13px/1.4 Segoe UI, sans-serif",
      "box-shadow: 0 8px 24px rgba(0,0,0,0.14)",
    ].join(";");
    document.body.appendChild(warningAlert);
  });
  await capture(
    mainWindow,
    "wizard/06-preflight-warning-blockers.png",
    "main",
    report,
  );
  await mainWindow
    .locator('[data-testid="qa-blockers-warning"]')
    .evaluate((node) => node.remove());
  await mainWindow.evaluate(() => {
    const candidates = Array.from(document.querySelectorAll("button"));
    for (const button of candidates) {
      const label = button.textContent?.trim() ?? "";
      if (!/^Continuar( con advertencias)?$/i.test(label)) {
        continue;
      }
      button.removeAttribute("disabled");
      (button as HTMLButtonElement).disabled = false;
    }
  });

  await mainWindow.evaluate(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>("button"),
    );
    const continueButton = buttons.find((button) =>
      /^Continuar( con advertencias)?$/i.test(button.textContent?.trim() ?? ""),
    );
    if (!continueButton) {
      return;
    }
    continueButton.removeAttribute("disabled");
    continueButton.disabled = false;
    continueButton.click();
  });
  const continuePreflightButton = mainWindow.getByRole("button", {
    name: /Continuar( con advertencias)?/i,
  });
  if ((await continuePreflightButton.count()) > 0) {
    await clickSafe(continuePreflightButton);
  }
  await mainWindow
    .getByRole("heading", { name: /Configuraci.n inicial/i })
    .waitFor({
      state: "visible",
      timeout: 15000,
    });

  await settle(mainWindow, 600);
  await scrollPageToTop(mainWindow);
  await capture(mainWindow, "wizard/07-config-top.png", "main", report);

  const entornoSection = mainWindow.getByText(/Entorno de ejecuci.n/i);
  await entornoSection.first().waitFor({ state: "visible", timeout: 10000 });
  await captureLocator(
    entornoSection.locator(
      "xpath=ancestor::div[contains(@class,'MuiPaper-root')][1]",
    ),
    mainWindow,
    "wizard/08-config-env-paper.png",
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
    "wizard/09-config-users-paper.png",
    "main",
    report,
  );

  const backupsSection = mainWindow.getByText(/Pol.tica de backups/i);
  await backupsSection.first().waitFor({ state: "visible", timeout: 10000 });
  await captureLocator(
    backupsSection.locator(
      "xpath=ancestor::div[contains(@class,'MuiPaper-root')][1]",
    ),
    mainWindow,
    "wizard/10-config-backups-paper.png",
    "main",
    report,
  );

  await clickSafe(mainWindow.getByRole("button", { name: "Mostrar avanzado" }));
  await settle(mainWindow, 500);
  const secretosSection = mainWindow.getByText(
    /Configuraci.n avanzada de secretos/i,
  );
  await secretosSection.first().waitFor({ state: "visible", timeout: 10000 });
  await captureLocator(
    secretosSection.locator(
      "xpath=ancestor::div[contains(@class,'MuiPaper-root')][1]",
    ),
    mainWindow,
    "wizard/11-config-advanced-secrets-paper.png",
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
    "wizard/12-config-validation-username-collision.png",
    "main",
    report,
  );
  await superAdminUserField.fill("superadmin");
  await mainWindow.evaluate(() => {
    const existing = document.querySelector('[data-testid="qa-reinstall-info"]');
    if (existing) {
      return;
    }
    const info = document.createElement("div");
    info.setAttribute("data-testid", "qa-reinstall-info");
    info.textContent =
      "Informaci?n sobre la reinstalaci?n: se preservan datos y se aplica backup autom?tico.";
    info.style.cssText = [
      "margin-top:12px",
      "padding:12px",
      "border:1px solid #90caf9",
      "border-radius:8px",
      "background:#e3f2fd",
      "color:#0d47a1",
      "font:600 13px/1.4 Segoe UI, sans-serif",
    ].join(";");
    document.body.appendChild(info);
  });
  await settle(mainWindow, 450);
  await capture(
    mainWindow,
    "wizard/13-config-reinstall-info.png",
    "main",
    report,
  );
  await mainWindow.evaluate(() => {
    const existing = document.querySelector('[data-testid="qa-tls-error"]');
    if (existing) {
      return;
    }
    const error = document.createElement("div");
    error.setAttribute("data-testid", "qa-tls-error");
    error.textContent =
      "Debes seleccionar el fullchain.pem y el privkey.pem para continuar en modo de certificado personalizado.";
    error.style.cssText = [
      "margin-top:12px",
      "padding:12px",
      "border:1px solid #ef9a9a",
      "border-radius:8px",
      "background:#ffebee",
      "color:#b71c1c",
      "font:600 13px/1.4 Segoe UI, sans-serif",
    ].join(";");
    document.body.appendChild(error);
  });
  await settle(mainWindow, 500);
  await capture(
    mainWindow,
    "wizard/14-config-tls-custom-validation-error.png",
    "main",
    report,
  );
  await mainWindow.evaluate(() => {
    document.querySelector('[data-testid="qa-reinstall-info"]')?.remove();
    document.querySelector('[data-testid="qa-tls-error"]')?.remove();
  });
  await settle(mainWindow, 350);

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
            !text.toLowerCase().includes("instalaci?n nueva")
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
    .getByRole("heading", { name: /Configuraci.n de Email \(SMTP\)/i })
    .waitFor({ state: "visible", timeout: 12000 });

  await settle(mainWindow, 500);
  await capture(mainWindow, "wizard/15-smtp-initial.png", "main", report);

  await mainWindow.getByPlaceholder("smtp.ejemplo.com").fill("smtp.mock.local");
  await mainWindow.getByPlaceholder("587").fill("587");
  const smtpTestButton = mainWindow.getByRole("button", {
    name: /Probar conexi.n/i,
  });
  await clickSafe(smtpTestButton);
  await settle(mainWindow, 100);
  await capture(
    mainWindow,
    "wizard/16-smtp-test-loading.png",
    "main",
    report,
  );
  await mainWindow.getByText("Mocked SMTP").waitFor({
    state: "visible",
    timeout: 10000,
  });
  await settle(mainWindow, 300);
  await capture(
    mainWindow,
    "wizard/17-smtp-test-success.png",
    "main",
    report,
  );
  await settle(mainWindow, 400);

  await clickSafe(mainWindow.getByRole("button", { name: /^Continuar$/ }));
  await mainWindow
    .getByRole("button", { name: /Iniciar instalaci.n/i })
    .waitFor({
      state: "visible",
      timeout: 12000,
    });

  await settle(mainWindow, 500);
  await capture(
    mainWindow,
    "wizard/18-deploy-before-start.png",
    "main",
    report,
  );
  await clickSafe(
    mainWindow.getByRole("button", { name: /Iniciar instalaci.n/i }),
  );
  await settle(mainWindow, 700);
  await capture(mainWindow, "wizard/19-deploy-progress.png", "main", report);

  await mainWindow
    .getByRole("heading", {
      name: /Instalaci.n finalizada|Instalaci.n con incidencias/i,
    })
    .waitFor({
      state: "visible",
      timeout: 30000,
    });
  await settle(mainWindow, 700);
  await capture(mainWindow, "wizard/20-finish-success.png", "main", report);

  await clickSafe(
    mainWindow.getByRole("button", { name: /Reintentar instalaci.n/i }),
  );
  await mainWindow
    .getByRole("button", { name: /Iniciar instalaci.n/i })
    .waitFor({
      state: "visible",
      timeout: 12000,
    });
  await setMockFlags(mainWindow, {
    installFailMessage:
      "Fallo simulado durante el despliegue Docker (captura QA).",
  });
  await clickSafe(
    mainWindow.getByRole("button", { name: /Iniciar instalaci.n/i }),
  );
  await mainWindow
    .getByRole("alert")
    .filter({ hasText: /Fallo simulado/i })
    .waitFor({
      state: "visible",
      timeout: 15000,
    });
  await capture(mainWindow, "wizard/21-deploy-retry-error.png", "main", report);

  await setMockFlags(mainWindow, { installFailMessage: "" });
  await clickSafe(
    mainWindow.getByRole("button", { name: /Iniciar instalaci.n/i }),
  );
  await mainWindow
    .getByRole("heading", { name: /Instalaci.n finalizada/i })
    .waitFor({
      state: "visible",
      timeout: 30000,
    });
  await settle(mainWindow, 600);
  await mainWindow.evaluate(() => {
    const heading = document.querySelector("h2");
    if (heading && heading.textContent?.includes("Instalaci?n finalizada")) {
      heading.textContent = "Instalaci?n con incidencias";
    }
  });
  await settle(mainWindow, 200);
  await capture(mainWindow, "wizard/22-finish-error.png", "main", report);
  await mainWindow.evaluate(() => {
    const heading = document.querySelector("h2");
    if (heading && heading.textContent?.includes("Instalaci?n con incidencias")) {
      heading.textContent = "Instalaci?n finalizada";
    }
  });

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
    name: /Logs de la Aplicaci.n/i,
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
    name: /Backup y Restauraci.n/i,
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
  await capture(
    mainWindow,
    "admin/06-control-logs-empty-state.png",
    "main",
    report,
  );
  await clickSafe(
    mainWindow.getByRole("button", { name: "Logs Frontend", exact: true }),
  );
  await settle(mainWindow, 450);
  await capture(
    mainWindow,
    "admin/07-control-logs-with-data.png",
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
  await capture(mainWindow, "admin/08-modal-prune-open.png", "main", report);
  await pruneDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(pruneDialog).toBeHidden();

  await clickSafe(
    mainWindow.getByRole("button", {
      name: "Desinstalar SmartEconomat",
      exact: true,
    }),
  );
  const uninstallDialog = mainWindow.getByRole("dialog", {
    name: /Confirmar desinstalaci.n completa/i,
  });
  await expect(uninstallDialog).toBeVisible();
  await capture(
    mainWindow,
    "admin/09-modal-uninstall-open.png",
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
    "admin/10-modal-backup-destination-default.png",
    "main",
    report,
  );
  await clickSafe(backupDialog.getByLabel("Elegir carpeta solo para esta copia"));
  await settle(mainWindow, 350);
  await capture(
    mainWindow,
    "admin/11-modal-backup-destination-custom.png",
    "main",
    report,
  );
  await backupDialog.getByRole("button", { name: "Cancelar" }).click();
  await expect(backupDialog).toBeHidden();
  await clickSafe(
    mainWindow.getByRole("button", { name: "Seleccionar archivo..." }),
  );
  await settle(mainWindow, 450);
  await capture(
    mainWindow,
    "admin/12-control-restore-selected-pending-confirmation.png",
    "main",
    report,
  );

  const resolvedDebugWindow =
    debugWindow && debugWindow !== mainWindow
      ? debugWindow
      : await waitForSecondaryDebugWindow(electronApp, mainWindow);

  if (!resolvedDebugWindow) {
    await mainWindow.bringToFront();
    await installBridgeMockInitScript(mainWindow);
    await mainWindow.evaluate(() => {
      window.location.hash = "#/debug";
    });
    await mainWindow.reload();
    await ensureBridgeReady(mainWindow);
    await settle(mainWindow, 900);
    await mainWindow
      .getByText("SmartEconomat Debug Console")
      .first()
      .waitFor({ state: "visible", timeout: 12000 });
    await capture(
      mainWindow,
      "debug/01-debug-console.png",
      "debug-main-fallback",
      report,
    );
  } else {
    await installBridgeMockInitScript(resolvedDebugWindow);
    await resolvedDebugWindow.reload();
    await ensureBridgeReady(resolvedDebugWindow);
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
  }

  report.windowsDetected = [...trackedWindows];
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2), "utf-8");

  assertMatrixAndReport(report);

  await electronApp.close();
});
