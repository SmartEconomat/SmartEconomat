import { ipcMain } from "electron";
import type { IpcMainInvokeEvent } from "electron";

import type { DebugLogService } from "@main/services/debug-log.service";

function shouldTraceChannel(channel: string): boolean {
  return !channel.startsWith("debug:");
}

/**
 * Registra manejadores y canaliza IPC o integración con el proceso principal.
 * @param {DebugLogService} debugLogService - Entrada esperada por la función.
 * @param {string} channel - Entrada esperada por la función.
 * @param {(event: IpcMainInvokeEvent, payload: TPayload) => Promise<TResult> | TResult} handler - Entrada esperada por la función.
 * @returns {void} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function registerIpcHandleWithDebug<TPayload, TResult>(
  debugLogService: DebugLogService,
  channel: string,
  handler: (
    event: IpcMainInvokeEvent,
    payload: TPayload,
  ) => Promise<TResult> | TResult,
): void {
  ipcMain.handle(channel, async (event, payload: TPayload) => {
    if (debugLogService.isEnabled() && shouldTraceChannel(channel)) {
      debugLogService.logIpcRequest(channel, payload);
    }

    try {
      const result = await handler(event, payload);

      if (debugLogService.isEnabled() && shouldTraceChannel(channel)) {
        debugLogService.logIpcResponse(channel, result);
      }

      return result;
    } catch (error) {
      if (debugLogService.isEnabled() && shouldTraceChannel(channel)) {
        debugLogService.logIpcError(channel, error);
      }

      throw error;
    }
  });
}
