import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { app, BrowserWindow, Menu } from "electron";

import { registerDebugIpc } from "./ipc/debug.ipc";
import { registerInstallerIpc } from "./ipc/installer.ipc";
import { registerRuntimeIpc } from "./ipc/runtime.ipc";
import { DebugLogService, parseDebugFlag } from "./services/debug-log.service";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const debugModeEnabled = !app.isPackaged || parseDebugFlag(process.env.DEBUG);
const debugLogService = new DebugLogService({ enabled: debugModeEnabled });

let mainWindow: BrowserWindow | null = null;
let debugWindow: BrowserWindow | null = null;

let installerIpc: ReturnType<typeof registerInstallerIpc> | null = null;
let runtimeIpc: ReturnType<typeof registerRuntimeIpc> | null = null;

function resolveWindowsIconPath(baseDir: string): string | undefined {
  const candidates = [
    path.resolve(baseDir, "../../resources/icons/win/icon.ico"),
    path.resolve(process.cwd(), "resources/icons/win/icon.ico"),
    path.resolve(
      process.cwd(),
      "ElectronInstaller/resources/icons/win/icon.ico",
    ),
    path.resolve(app.getAppPath(), "resources/icons/win/icon.ico"),
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function resolvePreloadPath(baseDir: string): string {
  const fileNames = ["index.mjs", "index.js", "index.cjs"];
  const candidateDirs = [
    path.resolve(baseDir, "../preload"),
    path.resolve(baseDir, "../../out/preload"),
    path.resolve(process.cwd(), "out/preload"),
    path.resolve(process.cwd(), "ElectronInstaller/out/preload"),
    path.resolve(app.getAppPath(), "out/preload"),
    path.resolve(app.getAppPath(), "preload"),
    path.resolve(process.resourcesPath, "app.asar.unpacked/out/preload"),
  ];

  for (const dir of candidateDirs) {
    for (const fileName of fileNames) {
      const candidate = path.join(dir, fileName);
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }
  }

  throw new Error(
    `No se encontró el preload de Electron. Revisa build en out/preload (baseDir: ${baseDir}).`,
  );
}

function loadRenderer(window: BrowserWindow, hash?: string): void {
  const rendererUrl = process.env.ELECTRON_RENDERER_URL;
  if (rendererUrl) {
    const parsed = new URL(rendererUrl);
    if (hash) {
      parsed.hash = hash;
    }

    window.loadURL(parsed.toString()).catch((error: unknown) => {
      console.error("Failed to load renderer URL", error);
    });
    return;
  }

  const rendererFile = path.join(__dirname, "../renderer/index.html");
  window
    .loadFile(rendererFile, hash ? { hash } : undefined)
    .catch((error: unknown) => {
      console.error("Failed to load renderer file", error);
    });
}

function createMainWindow(): void {
  const preloadPath = resolvePreloadPath(__dirname);
  const winIconPath = resolveWindowsIconPath(__dirname);
  if (!app.isPackaged) {
    console.info(`[main] preload path resolved: ${preloadPath}`);
  }

  mainWindow = new BrowserWindow({
    width: 1320,
    height: 860,
    minWidth: 1120,
    minHeight: 700,
    autoHideMenuBar: true,
    icon: winIconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      devTools: true,
    },
  });

  mainWindow.removeMenu();
  mainWindow.setMenuBarVisibility(false);

  if (!installerIpc) {
    installerIpc = registerInstallerIpc(mainWindow, debugLogService);
  } else {
    installerIpc.setWindow(mainWindow);
  }

  if (!runtimeIpc) {
    runtimeIpc = registerRuntimeIpc(mainWindow, debugLogService);
  } else {
    runtimeIpc.setWindow(mainWindow);
  }

  mainWindow.webContents.on("did-finish-load", () => {
    if (app.isPackaged || !mainWindow) {
      return;
    }

    void mainWindow.webContents
      .executeJavaScript("typeof window.smartEconomat", true)
      .then((bridgeType) => {
        console.info(`[main] bridge type in renderer: ${String(bridgeType)}`);
      })
      .catch((error: unknown) => {
        console.error("[main] failed to inspect renderer bridge", error);
      });
  });

  loadRenderer(mainWindow);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });

  debugLogService.publish({
    type: "system",
    source: "main",
    message: "Main window ready.",
    timestamp: Date.now(),
  });
}

function createDebugWindow(): void {
  if (!debugLogService.isEnabled()) {
    return;
  }

  if (debugWindow && !debugWindow.isDestroyed()) {
    debugWindow.focus();
    return;
  }

  const preloadPath = resolvePreloadPath(__dirname);
  const winIconPath = resolveWindowsIconPath(__dirname);
  debugWindow = new BrowserWindow({
    width: 1120,
    height: 760,
    minWidth: 800,
    minHeight: 600,
    title: "SmartEconomat Debug Console",
    show: false,
    autoHideMenuBar: true,
    icon: winIconPath,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      webSecurity: true,
      devTools: true,
    },
  });

  debugWindow.removeMenu();
  debugWindow.setMenuBarVisibility(false);

  debugLogService.attachDebugWindow(debugWindow);

  debugWindow.once("ready-to-show", () => {
    debugWindow?.show();
  });

  debugWindow.on("closed", () => {
    debugLogService.attachDebugWindow(null);
    debugWindow = null;
  });

  loadRenderer(debugWindow, "/debug");

  debugLogService.publish({
    type: "system",
    source: "main",
    message: "Debug window ready.",
    timestamp: Date.now(),
  });
}

app.whenReady().then(() => {
  if (process.platform === "win32") {
    app.setAppUserModelId("com.smarteconomat.installer");
  }

  Menu.setApplicationMenu(null);

  registerDebugIpc(debugLogService);
  debugLogService.installMainConsoleCapture();
  debugLogService.installProcessErrorCapture();

  createMainWindow();

  if (debugLogService.isEnabled()) {
    debugLogService.publish({
      type: "system",
      source: "main",
      message: "Debug mode enabled.",
      timestamp: Date.now(),
      context: {
        appPackaged: app.isPackaged,
        debugEnv: process.env.DEBUG ?? "",
      },
    });
    createDebugWindow();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();

      if (debugLogService.isEnabled()) {
        createDebugWindow();
      }
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
