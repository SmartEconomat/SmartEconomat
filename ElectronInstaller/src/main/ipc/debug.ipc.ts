import { ipcMain } from "electron";

import type { DebugLogEntry, OperationResult } from "@shared/contracts";
import { IPCChannels } from "@shared/ipc-channels";

import type { DebugLogService } from "@main/services/debug-log.service";

function isDebugLogType(value: unknown): value is DebugLogEntry["type"] {
  return (
    value === "log" ||
    value === "warn" ||
    value === "error" ||
    value === "ipc" ||
    value === "system"
  );
}

function parseRendererLog(payload: unknown): DebugLogEntry | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const raw = payload as Partial<DebugLogEntry>;
  if (!isDebugLogType(raw.type)) {
    return null;
  }

  if (typeof raw.message !== "string" || raw.message.trim().length === 0) {
    return null;
  }

  return {
    type: raw.type,
    message: raw.message,
    timestamp:
      typeof raw.timestamp === "number" && Number.isFinite(raw.timestamp)
        ? raw.timestamp
        : Date.now(),
    context: raw.context,
    source: "renderer",
  };
}

export function registerDebugIpc(debugLogService: DebugLogService): void {
  ipcMain.on(IPCChannels.debug.rendererLog, (_event, payload: unknown) => {
    if (!debugLogService.isEnabled()) {
      return;
    }

    const parsed = parseRendererLog(payload);
    if (!parsed) {
      return;
    }

    debugLogService.publish(parsed);
  });

  ipcMain.handle(
    IPCChannels.debug.getLogs,
    async (): Promise<OperationResult<DebugLogEntry[]>> => ({
      ok: true,
      message: "Debug log snapshot",
      data: debugLogService.getLogs(),
    }),
  );

  ipcMain.handle(
    IPCChannels.debug.clearLogs,
    async (): Promise<OperationResult> => {
      debugLogService.clear();
      return {
        ok: true,
        message: "Debug logs cleared",
      };
    },
  );

  ipcMain.handle(
    IPCChannels.debug.isEnabled,
    async (): Promise<OperationResult<boolean>> => ({
      ok: true,
      message: debugLogService.isEnabled()
        ? "Debug mode enabled"
        : "Debug mode disabled",
      data: debugLogService.isEnabled(),
    }),
  );
}
