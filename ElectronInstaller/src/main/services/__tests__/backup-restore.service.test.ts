import { describe, expect, it } from "vitest";

import { parseBackupMetadata } from "../backup-restore.service";

describe("parseBackupMetadata", () => {
  it("parsea metadata válida", () => {
    const metadata = parseBackupMetadata(
      JSON.stringify({
        appVersion: "1.0.0",
        schemaVersion: "v1",
        createdAt: "2026-04-13T00:00:00.000Z",
        checksum: "abc123",
        archiveName: "backup.tar.gz",
      }),
    );

    expect(metadata).not.toBeNull();
    expect(metadata?.archiveName).toBe("backup.tar.gz");
  });

  it("retorna null con JSON inválido", () => {
    expect(parseBackupMetadata("{")).toBeNull();
  });
});
