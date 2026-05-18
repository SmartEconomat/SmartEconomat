import { contextBridge, ipcRenderer } from "electron";

import { createInstallerCaptureBridgeMock } from "@shared/installer-capture-bridge.mock";
import type {
  BackupMetadata,
  BackupPayload,
  DebugLogEntry,
  ExportVisibleLogsPayload,
  HealthUpdateEvent,
  InstallerBootState,
  InstallerFilePickerPayload,
  InstallerConfigPayload,
  InstallerProgressEvent,
  InstallerStateSnapshot,
  OperationResult,
  PortRepairPayload,
  PreflightReport,
  PrunePayload,
  RestorePayload,
  RuntimePaths,
  ServiceHealth,
  SupervisorSnapshot,
  TailLogsPayload,
  UninstallPayload,
} from "@shared/contracts";
import { IPCChannels } from "@shared/ipc-channels";

declare const __INSTALLER_CAPTURE_BRIDGE_MOCK__: boolean;

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
      return {
        name: value.name,
        message: value.message,
        stack: value.stack,
      };
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

function shouldTraceChannel(channel: string): boolean {
  return !channel.startsWith("debug:");
}

function sendRendererDebugLog(entry: DebugLogEntry): void {
  try {
    ipcRenderer.send(IPCChannels.debug.rendererLog, {
      ...entry,
      source: "renderer",
      timestamp: Number.isFinite(entry.timestamp)
        ? entry.timestamp
        : Date.now(),
      context: sanitizeContext(entry.context),
    });
  } catch {
    // Ignore debug stream failures to avoid affecting app flows.
  }
}

function traceIpc(
  message: string,
  context: unknown,
  type: DebugLogEntry["type"] = "ipc",
): void {
  sendRendererDebugLog({
    type,
    source: "renderer",
    message,
    timestamp: Date.now(),
    context,
  });
}

async function invokeWithTracing<TPayload, TResult>(
  channel: string,
  payload?: TPayload,
): Promise<TResult> {
  if (shouldTraceChannel(channel)) {
    traceIpc(`ipcRenderer.invoke request: ${channel}`, {
      direction: "renderer->main",
      channel,
      payload: sanitizeContext(payload),
    });
  }

  try {
    const result = await ipcRenderer.invoke(channel, payload);

    if (shouldTraceChannel(channel)) {
      traceIpc(`ipcRenderer.invoke response: ${channel}`, {
        direction: "main->renderer",
        channel,
        payload: sanitizeContext(result),
      });
    }

    return result as TResult;
  } catch (error) {
    if (shouldTraceChannel(channel)) {
      traceIpc(
        `ipcRenderer.invoke error: ${channel} (${formatUnknown(error)})`,
        {
          direction: "main->renderer",
          channel,
          error: sanitizeContext(error),
        },
        "error",
      );
    }

    throw error;
  }
}

function onChannelEvent<T>(
  channel: string,
  callback: (event: T) => void,
): () => void {
  const listener = (_event: Electron.IpcRendererEvent, payload: T) => {
    if (shouldTraceChannel(channel)) {
      traceIpc(`ipcRenderer.on event: ${channel}`, {
        direction: "main->renderer",
        channel,
        payload: sanitizeContext(payload),
      });
    }

    callback(payload);
  };
  ipcRenderer.on(channel, listener);

  return () => {
    ipcRenderer.removeListener(channel, listener);
  };
}

if (__INSTALLER_CAPTURE_BRIDGE_MOCK__) {
  contextBridge.exposeInMainWorld(
    "smartEconomat",
    createInstallerCaptureBridgeMock() as never,
  );
} else {
  contextBridge.exposeInMainWorld("smartEconomat", {
    runPreflight: (payload: RuntimePaths) =>
      invokeWithTracing<RuntimePaths, OperationResult<PreflightReport>>(
        IPCChannels.installer.runPreflight,
        payload,
      ),
    runPreflightAutoRepair: (payload: RuntimePaths) =>
      invokeWithTracing<RuntimePaths, OperationResult<PreflightReport>>(
        IPCChannels.installer.runAutoRepair,
        payload,
      ),
    trustWindowsRootCertificate: (payload: RuntimePaths) =>
      invokeWithTracing<RuntimePaths, OperationResult<PreflightReport>>(
        IPCChannels.installer.trustWindowsRootCertificate,
        payload,
      ),
    releaseBusyPort: (payload: PortRepairPayload) =>
      invokeWithTracing<PortRepairPayload, OperationResult<PreflightReport>>(
        IPCChannels.installer.releaseBusyPort,
        payload,
      ),
    startInstallation: (payload: InstallerConfigPayload) =>
      invokeWithTracing<
        InstallerConfigPayload,
        OperationResult<InstallerStateSnapshot>
      >(IPCChannels.installer.startInstall, payload),
    pickInstallerFile: (payload: InstallerFilePickerPayload) =>
      invokeWithTracing<InstallerFilePickerPayload, OperationResult<string>>(
        IPCChannels.installer.pickFile,
        payload,
      ),
    testSmtp: (config: Partial<InstallerConfigPayload>) =>
      invokeWithTracing<
        Partial<InstallerConfigPayload>,
        OperationResult<boolean>
      >(IPCChannels.installer.testSmtp, config),
    getInstallerState: () =>
      invokeWithTracing<undefined, OperationResult<InstallerStateSnapshot>>(
        IPCChannels.installer.getState,
      ),
    getInstallerBootState: () =>
      invokeWithTracing<undefined, OperationResult<InstallerBootState>>(
        IPCChannels.installer.getBootState,
      ),
    onInstallerProgress: (callback: (event: InstallerProgressEvent) => void) =>
      onChannelEvent(IPCChannels.installer.progressEvent, callback),

    startStack: (payload: RuntimePaths) =>
      invokeWithTracing<RuntimePaths, OperationResult>(
        IPCChannels.runtime.startStack,
        payload,
      ),
    stopStack: (payload: RuntimePaths) =>
      invokeWithTracing<RuntimePaths, OperationResult>(
        IPCChannels.runtime.stopStack,
        payload,
      ),
    restartStack: (payload: RuntimePaths) =>
      invokeWithTracing<RuntimePaths, OperationResult>(
        IPCChannels.runtime.restartStack,
        payload,
      ),
    getHealth: (payload: RuntimePaths) =>
      invokeWithTracing<RuntimePaths, OperationResult<ServiceHealth[]>>(
        IPCChannels.runtime.getHealth,
        payload,
      ),
    tailLogs: (payload: TailLogsPayload) =>
      invokeWithTracing<TailLogsPayload, OperationResult>(
        IPCChannels.runtime.tailLogs,
        payload,
      ),
    stopLogStream: () =>
      invokeWithTracing<undefined, OperationResult>(
        IPCChannels.runtime.stopLogStream,
      ),
    exportVisibleLogs: (payload: ExportVisibleLogsPayload) =>
      invokeWithTracing<ExportVisibleLogsPayload, OperationResult<string>>(
        IPCChannels.runtime.exportVisibleLogs,
        payload,
      ),
    onRuntimeLog: (
      callback: (event: {
        service: string;
        line: string;
        timestamp: string;
      }) => void,
    ) => onChannelEvent(IPCChannels.runtime.streamLogEvent, callback),
    pruneSafe: (payload: PrunePayload) =>
      invokeWithTracing<PrunePayload, OperationResult>(
        IPCChannels.runtime.pruneSafe,
        payload,
      ),
    uninstall: (payload: UninstallPayload) =>
      invokeWithTracing<UninstallPayload, OperationResult>(
        IPCChannels.runtime.uninstall,
        payload,
      ),
    backupNow: (payload: BackupPayload) =>
      invokeWithTracing<BackupPayload, OperationResult<BackupMetadata>>(
        IPCChannels.runtime.backupNow,
        payload,
      ),
    restoreFrom: (payload: RestorePayload) =>
      invokeWithTracing<RestorePayload, OperationResult>(
        IPCChannels.runtime.restoreFrom,
        payload,
      ),
    diagnostics: (payload: RuntimePaths) =>
      invokeWithTracing<RuntimePaths, OperationResult<string>>(
        IPCChannels.runtime.diagnostics,
        payload,
      ),

    getWatchdogStatus: () =>
      invokeWithTracing<undefined, OperationResult<HealthUpdateEvent>>(
        IPCChannels.runtime.getWatchdogStatus,
      ),
    getSupervisorSnapshot: () =>
      invokeWithTracing<undefined, OperationResult<SupervisorSnapshot>>(
        IPCChannels.runtime.getSupervisorSnapshot,
      ),
    restartDockerDesktop: () =>
      invokeWithTracing<undefined, OperationResult>(
        IPCChannels.runtime.restartDockerDesktop,
      ),
    runSupervisorRecovery: () =>
      invokeWithTracing<undefined, OperationResult>(
        IPCChannels.runtime.runSupervisorRecovery,
      ),
    onHealthUpdate: (callback: (event: HealthUpdateEvent) => void) =>
      onChannelEvent(IPCChannels.runtime.healthUpdate, callback),

    onDebugLog: (callback: (event: DebugLogEntry) => void) =>
      onChannelEvent(IPCChannels.debug.streamEvent, callback),
    getDebugLogs: () =>
      invokeWithTracing<undefined, OperationResult<DebugLogEntry[]>>(
        IPCChannels.debug.getLogs,
      ),
    clearDebugLogs: () =>
      invokeWithTracing<undefined, OperationResult>(
        IPCChannels.debug.clearLogs,
      ),
    isDebugModeEnabled: () =>
      invokeWithTracing<undefined, OperationResult<boolean>>(
        IPCChannels.debug.isEnabled,
      ),
    sendDebugLog: (entry: DebugLogEntry) => {
      sendRendererDebugLog(entry);
    },
  });
}
