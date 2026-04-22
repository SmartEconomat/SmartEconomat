import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { app, BrowserWindow, Menu, Tray, nativeImage, powerMonitor } from "electron";
import type { MenuItemConstructorOptions } from "electron";

import { registerDebugIpc } from "./ipc/debug.ipc";
import { registerInstallerIpc } from "./ipc/installer.ipc";
import { registerRuntimeIpc } from "./ipc/runtime.ipc";
import { BootGuardianService } from "./services/boot-guardian.service";
import { DebugLogService, parseDebugFlag } from "./services/debug-log.service";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const debugModeEnabled = !app.isPackaged || parseDebugFlag(process.env.DEBUG);
const debugLogService = new DebugLogService({ enabled: debugModeEnabled });

let mainWindow: BrowserWindow | null = null;
let debugWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

let installerIpc: ReturnType<typeof registerInstallerIpc> | null = null;
let runtimeIpc: ReturnType<typeof registerRuntimeIpc> | null = null;
let bootGuardian: BootGuardianService | null = null;
const hasSingleInstanceLock = app.requestSingleInstanceLock();
const launchedInBackground = process.argv.some(
  (argument) => argument === "--background" || argument === "--control-panel",
);

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

function resolveTrayIconPath(baseDir: string): string | undefined {
  const candidates =
    process.platform === "win32"
      ? [
          path.resolve(baseDir, "../../resources/icons/win/icon.ico"),
          path.resolve(process.cwd(), "resources/icons/win/icon.ico"),
          path.resolve(
            process.cwd(),
            "ElectronInstaller/resources/icons/win/icon.ico",
          ),
          path.resolve(app.getAppPath(), "resources/icons/win/icon.ico"),
        ]
      : [
          path.resolve(baseDir, "../../resources/icons/icon.png"),
          path.resolve(process.cwd(), "resources/icons/icon.png"),
          path.resolve(
            process.cwd(),
            "ElectronInstaller/resources/icons/icon.png",
          ),
          path.resolve(app.getAppPath(), "resources/icons/icon.png"),
        ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return undefined;
}

function showMainWindow(hash?: string): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createMainWindow({ initialHash: hash, showOnCreate: true });
    return;
  }

  if (hash) {
    loadRenderer(mainWindow, hash);
  }

  if (mainWindow.isMinimized()) {
    mainWindow.restore();
  }

  if (!mainWindow.isVisible()) {
    mainWindow.show();
  }

  mainWindow.focus();
}

function createTray(): void {
  if (tray) {
    return;
  }

  const iconPath = resolveTrayIconPath(__dirname);
  const trayIcon = iconPath ? nativeImage.createFromPath(iconPath) : undefined;

  if (!trayIcon || trayIcon.isEmpty()) {
    return;
  }

  tray = new Tray(trayIcon);
  tray.setToolTip("SmartEconomat Control Panel");

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "Abrir panel de control",
      click: () => {
        showMainWindow("/control");
      },
    },
    {
      label: "Abrir asistente",
      click: () => {
        showMainWindow();
      },
    },
    { type: "separator" },
    {
      label: "Salir",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ] as MenuItemConstructorOptions[]);

  tray.setContextMenu(contextMenu);
  tray.on("double-click", () => {
    showMainWindow("/control");
  });
}

function createMainWindow(options?: {
  initialHash?: string;
  showOnCreate?: boolean;
}): void {
  const preloadPath = resolvePreloadPath(__dirname);
  const winIconPath = resolveWindowsIconPath(__dirname);
  if (!app.isPackaged) {
    console.info(`[main] preload path resolved: ${preloadPath}`);
  }

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1000,
    minHeight: 600,
    show: options?.showOnCreate ?? true,
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

  // Mantener sincronizada la referencia de ventana en el boot guardian
  bootGuardian?.setMainWindow(mainWindow);

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

  loadRenderer(mainWindow, options?.initialHash);

  mainWindow.on("close", (event) => {
    if (isQuitting || process.platform === "darwin") {
      return;
    }

    event.preventDefault();
    mainWindow?.hide();
  });

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

if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, commandLine) => {
    const wantsControlPanel = commandLine.some(
      (argument) => argument === "--control-panel",
    );
    showMainWindow(wantsControlPanel ? "/control" : undefined);
  });

  app.whenReady().then(() => {
    if (process.platform === "win32") {
      app.setAppUserModelId("com.smarteconomat.installer");
    }

    if (app.isPackaged) {
      app.setLoginItemSettings({
        openAtLogin: true,
        args: ["--background", "--control-panel"],
      });
    }

    Menu.setApplicationMenu(null);

    registerDebugIpc(debugLogService);
    debugLogService.installMainConsoleCapture();
    debugLogService.installProcessErrorCapture();

    createTray();

    const shouldStartHiddenToTray =
      app.isPackaged && launchedInBackground;

    createMainWindow({
      initialHash: shouldStartHiddenToTray ? "/control" : undefined,
      showOnCreate: !shouldStartHiddenToTray,
    });

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

    if (launchedInBackground) {
      bootGuardian = new BootGuardianService({
        onLog: (message) => {
          debugLogService.publish({
            type: "system",
            source: "main",
            message,
            timestamp: Date.now(),
          });
        },
      });

      // Inyectar la ventana principal al boot guardian para health push
      if (mainWindow) {
        bootGuardian.setMainWindow(mainWindow);
      }

      // Inyectar boot guardian en el IPC runtime para getWatchdogStatus
      if (runtimeIpc) {
        runtimeIpc.setBootGuardian(bootGuardian);
      }

      void bootGuardian.bootstrap();
    }

    // Eventos de power management (multi-OS)
    powerMonitor.on("resume", () => {
      debugLogService.publish({
        type: "system",
        source: "main",
        message: "[POWER] Sistema reanudado desde suspensión.",
        timestamp: Date.now(),
      });
      void bootGuardian?.onSystemResume();
    });

    powerMonitor.on("suspend", () => {
      debugLogService.publish({
        type: "system",
        source: "main",
        message: "[POWER] Sistema entrando en suspensión.",
        timestamp: Date.now(),
      });
      bootGuardian?.onSystemSuspend();
    });

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainWindow({ initialHash: "/control", showOnCreate: true });

        if (debugLogService.isEnabled()) {
          createDebugWindow();
        }
      }
    });
  });
}

app.on("before-quit", () => {
  isQuitting = true;
  bootGuardian?.stop();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin" && !tray) {
    app.quit();
  }
});
