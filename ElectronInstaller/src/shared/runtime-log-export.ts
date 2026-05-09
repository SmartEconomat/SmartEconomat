import type { RuntimeLogEvent } from "./contracts";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function splitLogLine(line: string): string[] {
  return line.replace(/\r\n/g, "\n").split("\n");
}

/**
 * Expone la operación "formatRuntimeLogTimestamp" del instalador SmartEconomat.
 * @param {string} value - Entrada esperada por la función.
 * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function formatRuntimeLogTimestamp(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return [
    `${parsed.getUTCFullYear()}-${pad(parsed.getUTCMonth() + 1)}-${pad(parsed.getUTCDate())}`,
    `${pad(parsed.getUTCHours())}:${pad(parsed.getUTCMinutes())}:${pad(parsed.getUTCSeconds())}`,
  ].join(" ");
}

/**
 * Expone la operación "serializeVisibleRuntimeLogs" del instalador SmartEconomat.
 * @param {RuntimeLogEvent[]} logs - Entrada esperada por la función.
 * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function serializeVisibleRuntimeLogs(logs: RuntimeLogEvent[]): string {
  return logs
    .flatMap((log) => {
      const service = log.service.trim().length > 0 ? log.service : "runtime";
      const timestamp = formatRuntimeLogTimestamp(log.timestamp);

      return splitLogLine(log.line).map(
        (segment) => `[${timestamp}] [${service}] ${segment}`,
      );
    })
    .join("\n");
}

/**
 * Expone la operación "buildRuntimeLogsExportFileName" del instalador SmartEconomat.
 * @param {Date} date - Entrada esperada por la función.
 * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function buildRuntimeLogsExportFileName(date = new Date()): string {
  const stamp = [
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`,
  ].join("-");

  return `smarteconomat-logs-${stamp}.txt`;
}
