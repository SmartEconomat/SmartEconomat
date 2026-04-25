import { app, dialog } from "electron";
import type { BrowserWindow } from "electron";
import electronLog from "electron-log/main.js";

import type { DebugLogEntry } from "@shared/contracts";
import { IPCChannels } from "@shared/ipc-channels";

interface DebugLogServiceOptions {
  enabled: boolean;
  maxEntries?: number;
}

const DEFAULT_MAX_ENTRIES = 1200;

function formatUnknown(input: unknown): string {
  if (typeof input === "string") {
    return input;
  }

  if (input instanceof Error) {
    return input.message;
  }

  try {
    return JSON.stringify(input);
  } catch {
    return String(input);
  }
}

function serializeError(error: Error): Record<string, string | undefined> {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
  };
}

function sanitizeContext(input: unknown): unknown {
  const seen = new WeakSet<object>();

  const walk = (value: unknown): unknown => {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value === "bigint") {
      return value.toString();
    }

    if (typeof value === "function") {
      const maybeNamed = value as { name?: string };
      return `[Function ${maybeNamed.name || "anonymous"}]`;
    }

    if (value instanceof Error) {
      return serializeError(value);
    }

    if (typeof value !== "object") {
      return value;
    }

    if (seen.has(value)) {
      return "[Circular]";
    }

    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((entry) => walk(entry));
    }

    const record = value as Record<string, unknown>;
    const output: Record<string, unknown> = {};
    for (const [key, currentValue] of Object.entries(record)) {
      output[key] = walk(currentValue);
    }
    return output;
  };

  try {
    return walk(input);
  } catch {
    return formatUnknown(input);
  }
}

function createMessageFromArgs(args: unknown[]): string {
  if (args.length === 0) {
    return "(empty)";
  }

  return args.map((arg) => formatUnknown(arg)).join(" ");
}

export function parseDebugFlag(value: string | undefined): boolean {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return (
    normalized === "1" ||
    normalized === "true" ||
    normalized === "yes" ||
    normalized === "on"
  );
}

export class DebugLogService {
  private readonly enabled: boolean;
  private readonly exitOnFatal: boolean;
  private readonly maxEntries: number;
  private readonly logs: DebugLogEntry[] = [];
  private debugWindow: BrowserWindow | null = null;
  private consoleCaptureInstalled = false;
  private processCaptureInstalled = false;

  constructor(options: DebugLogServiceOptions) {
    this.enabled = options.enabled;
    this.exitOnFatal = parseDebugFlag(process.env.INSTALLER_EXIT_ON_FATAL);
    this.maxEntries = options.maxEntries ?? DEFAULT_MAX_ENTRIES;

    electronLog.initialize();
    electronLog.transports.console.level = this.enabled ? "debug" : false;
    electronLog.transports.file.level = this.enabled ? "debug" : "info";
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  attachDebugWindow(window: BrowserWindow | null): void {
    this.debugWindow = window;

    if (!this.enabled || !window || window.isDestroyed()) {
      return;
    }

    for (const entry of this.logs) {
      this.sendToDebugWindow(entry);
    }
  }

  installMainConsoleCapture(): void {
    if (!this.enabled || this.consoleCaptureInstalled) {
      return;
    }

    this.consoleCaptureInstalled = true;

    const originalLog = console.log.bind(console);
    const originalWarn = console.warn.bind(console);
    const originalError = console.error.bind(console);

    console.log = (...args: unknown[]) => {
      originalLog(...args);
      this.publish({
        type: "log",
        source: "main",
        message: createMessageFromArgs(args),
        timestamp: Date.now(),
        context: { args: sanitizeContext(args) },
      });
    };

    console.warn = (...args: unknown[]) => {
      originalWarn(...args);
      this.publish({
        type: "warn",
        source: "main",
        message: createMessageFromArgs(args),
        timestamp: Date.now(),
        context: { args: sanitizeContext(args) },
      });
    };

    console.error = (...args: unknown[]) => {
      originalError(...args);
      this.publish({
        type: "error",
        source: "main",
        message: createMessageFromArgs(args),
        timestamp: Date.now(),
        context: { args: sanitizeContext(args) },
      });
    };

    this.publish({
      type: "system",
      source: "main",
      message: "Main process console capture enabled.",
      timestamp: Date.now(),
    });
  }

  installProcessErrorCapture(): void {
    if (this.processCaptureInstalled) {
      return;
    }

    this.processCaptureInstalled = true;

    process.on("uncaughtException", (error: Error) => {
      electronLog.error("FATAL ERROR (uncaughtException):", error);

      this.publish({
        type: "error",
        source: "main",
        message: error.message,
        timestamp: Date.now(),
        context: serializeError(error),
      });

      try {
        dialog.showErrorBox(
          "Error Crítico Inesperado",
          `El instalador ha encontrado un error crítico.\n\nError: ${error.message}\n\nPara más detalles, revisa el archivo principal de logs de la aplicación.`,
        );
      } catch {
        // Ignorar fallo de renderizado de UI
      }

      if (this.exitOnFatal) {
        app.exit(1);
      } else {
        this.publish({
          type: "system",
          source: "main",
          message:
            "UncaughtException capturada. Continúa en modo tolerante (sin cierre automático).",
          timestamp: Date.now(),
        });
      }
    });

    process.on("unhandledRejection", (reason: unknown) => {
      const message =
        reason instanceof Error
          ? reason.message
          : `Unhandled rejection: ${formatUnknown(reason)}`;

      electronLog.error("FATAL ERROR (unhandledRejection):", reason);

      this.publish({
        type: "error",
        source: "main",
        message,
        timestamp: Date.now(),
        context:
          reason instanceof Error
            ? serializeError(reason)
            : sanitizeContext(reason),
      });

      try {
        dialog.showErrorBox(
          "Error Inesperado (Asíncrono)",
          `Se ha producido un fallo no controlado durante una operación en segundo plano.\n\nDetalle: ${message}`,
        );
      } catch {
        // Ignorar fallo de UI
      }

      if (this.exitOnFatal) {
        app.exit(1);
      } else {
        this.publish({
          type: "system",
          source: "main",
          message:
            "UnhandledRejection capturada. Continúa en modo tolerante (sin cierre automático).",
          timestamp: Date.now(),
        });
      }
    });

    this.publish({
      type: "system",
      source: "main",
      message: "Main process global error capture enabled.",
      timestamp: Date.now(),
    });
  }

  logIpcRequest(channel: string, payload: unknown): void {
    this.publish({
      type: "ipc",
      source: "main",
      message: `ipcMain.handle request: ${channel}`,
      timestamp: Date.now(),
      context: {
        direction: "renderer->main",
        channel,
        payload: sanitizeContext(payload),
      },
    });
  }

  logIpcResponse(channel: string, payload: unknown): void {
    this.publish({
      type: "ipc",
      source: "main",
      message: `ipcMain.handle response: ${channel}`,
      timestamp: Date.now(),
      context: {
        direction: "main->renderer",
        channel,
        payload: sanitizeContext(payload),
      },
    });
  }

  logIpcPush(channel: string, payload: unknown): void {
    this.publish({
      type: "ipc",
      source: "main",
      message: `ipcMain.push event: ${channel}`,
      timestamp: Date.now(),
      context: {
        direction: "main->renderer",
        channel,
        payload: sanitizeContext(payload),
      },
    });
  }

  logIpcError(channel: string, error: unknown): void {
    const message =
      error instanceof Error
        ? error.message
        : `IPC handler failed: ${formatUnknown(error)}`;

    this.publish({
      type: "error",
      source: "main",
      message: `ipcMain.handle error (${channel}): ${message}`,
      timestamp: Date.now(),
      context: sanitizeContext(error),
    });
  }

  publish(entry: DebugLogEntry): void {
    if (!this.enabled) {
      return;
    }

    const normalized: DebugLogEntry = {
      type: entry.type,
      source: entry.source ?? "main",
      message: entry.message,
      timestamp: Number.isFinite(entry.timestamp)
        ? entry.timestamp
        : Date.now(),
      context: sanitizeContext(entry.context),
    };

    this.logs.push(normalized);
    if (this.logs.length > this.maxEntries) {
      this.logs.shift();
    }

    this.persist(normalized);
    this.sendToDebugWindow(normalized);
  }

  clear(): void {
    this.logs.length = 0;
    this.publish({
      type: "system",
      source: "main",
      message: "Debug logs buffer cleared.",
      timestamp: Date.now(),
      context: { action: "clear" },
    });
  }

  getLogs(): DebugLogEntry[] {
    return [...this.logs];
  }

  private persist(entry: DebugLogEntry): void {
    if (entry.type === "error") {
      electronLog.error(
        `[${entry.source}] ${entry.message}`,
        entry.context ?? "",
      );
      return;
    }

    if (entry.type === "warn") {
      electronLog.warn(
        `[${entry.source}] ${entry.message}`,
        entry.context ?? "",
      );
    }
  }

  private sendToDebugWindow(entry: DebugLogEntry): void {
    if (!this.debugWindow || this.debugWindow.isDestroyed()) {
      return;
    }

    try {
      this.debugWindow.webContents.send(IPCChannels.debug.streamEvent, entry);
    } catch {
      // Ignore stream send failures to keep app flow untouched.
    }
  }
}
