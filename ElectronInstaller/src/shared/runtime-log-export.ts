import type { RuntimeLogEvent } from "./contracts";

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

function splitLogLine(line: string): string[] {
  return line.replace(/\r\n/g, "\n").split("\n");
}

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

export function buildRuntimeLogsExportFileName(date = new Date()): string {
  const stamp = [
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}`,
    `${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}`,
  ].join("-");

  return `smarteconomat-logs-${stamp}.txt`;
}
