import { describe, expect, it } from "vitest";

import {
  buildRuntimeLogsExportFileName,
  formatRuntimeLogTimestamp,
  serializeVisibleRuntimeLogs,
} from "../src/shared/runtime-log-export";

describe("runtime log export helpers", () => {
  it("serializa el buffer visible en texto plano con timestamp y servicio", () => {
    const output = serializeVisibleRuntimeLogs([
      {
        timestamp: "2026-04-13T12:42:10.000Z",
        service: "backend",
        line: "API lista en puerto 3000.",
      },
      {
        timestamp: "2026-04-13T12:42:13.000Z",
        service: "frontend",
        line: "HTTPS listener activo en :443.",
      },
    ]);

    expect(output).toBe([
      "[2026-04-13 12:42:10] [backend] API lista en puerto 3000.",
      "[2026-04-13 12:42:13] [frontend] HTTPS listener activo en :443.",
    ].join("\n"));
  });

  it("expande líneas múltiples y conserva timestamps inválidos", () => {
    const output = serializeVisibleRuntimeLogs([
      {
        timestamp: "invalid-date",
        service: "installer",
        line: "Primera línea\nSegunda línea",
      },
    ]);

    expect(output).toBe([
      "[invalid-date] [installer] Primera línea",
      "[invalid-date] [installer] Segunda línea",
    ].join("\n"));
  });

  it("genera un nombre de archivo determinista para la exportación", () => {
    const fileName = buildRuntimeLogsExportFileName(
      new Date("2026-04-13T12:42:10.000Z"),
    );

    expect(fileName).toBe("smarteconomat-logs-20260413-124210.txt");
    expect(formatRuntimeLogTimestamp("invalid-date")).toBe("invalid-date");
  });
});