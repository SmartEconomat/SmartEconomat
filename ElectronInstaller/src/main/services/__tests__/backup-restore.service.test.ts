import fs from "node:fs/promises";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { CommandResult, InstallerConfigPayload } from "@shared/contracts";

import {
  BackupRestoreService,
  parseBackupMetadata,
} from "../backup-restore.service";
import type { PathResolverService } from "../path-resolver.service";
import type { ProcessRunnerService } from "../process-runner.service";

/* ── helpers ────────────────────────────────────────────────────── */

const OK_RESULT: CommandResult = {
  ok: true,
  code: 0,
  stdout: "",
  stderr: "",
  message: "Command executed successfully",
};

const failResult = (stderr: string): CommandResult => ({
  ok: false,
  code: 1,
  stdout: "",
  stderr,
  message: "Command failed",
});

function buildConfig(
  overrides: Partial<
    Pick<
      InstallerConfigPayload,
      | "runtimePath"
      | "instanceName"
      | "backupFrequency"
      | "backupScheduleTime"
      | "backupDefaultDirectory"
    >
  > = {},
): Pick<
  InstallerConfigPayload,
  | "runtimePath"
  | "instanceName"
  | "backupFrequency"
  | "backupScheduleTime"
  | "backupDefaultDirectory"
> {
  return {
    runtimePath: "C:\\SmartEconomatRuntime",
    instanceName: "test-instance",
    backupFrequency: "daily",
    backupScheduleTime: "03:00",
    backupDefaultDirectory: "C:\\Backups",
    ...overrides,
  };
}

function createStubs(): {
  pathResolver: PathResolverService;
  processRunner: ProcessRunnerService;
  runSpy: ReturnType<typeof vi.fn>;
} {
  const runSpy = vi.fn<(options: unknown) => Promise<CommandResult>>();

  const pathResolver = {
    getProjectRoot: () => "C:\\SmartEconomat",
    getInstallerScriptsRoot: () =>
      "C:\\SmartEconomat\\ElectronInstaller\\scripts",
    getInstallerRoot: () => "C:\\SmartEconomat\\ElectronInstaller",
    getTemplatesRoot: () =>
      "C:\\SmartEconomat\\ElectronInstaller\\resources\\templates",
    getRuntimeFile: (runtimePath: string, fileName: string) =>
      path.join(runtimePath, fileName),
  } as PathResolverService;

  const processRunner = { run: runSpy } as unknown as ProcessRunnerService;

  return { pathResolver, processRunner, runSpy };
}

/* ── tests ──────────────────────────────────────────────────────── */

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

describe("BackupRestoreService.configureScheduledBackup", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    Object.defineProperty(process, "platform", { value: "win32" });
    vi.spyOn(fs, "mkdir").mockResolvedValue(undefined);
    vi.spyOn(fs, "writeFile").mockResolvedValue(undefined);
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    vi.restoreAllMocks();
  });

  it("retorna ok cuando Register-ScheduledTask con SYSTEM tiene éxito (Nivel 1)", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    // Nivel 1 (Register-ScheduledTask SYSTEM): ok
    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(true);
    expect(result.message).toContain("SYSTEM");
    expect(runSpy).toHaveBeenCalledTimes(1);

    // Verifica que usa powershell -Command con Register-ScheduledTask
    const firstCall = runSpy.mock.calls[0]?.[0] as {
      command: string;
      args: string[];
    };
    expect(firstCall.command).toBe("powershell");
    expect(firstCall.args).toContain("-Command");
    const psScript = firstCall.args[firstCall.args.indexOf("-Command") + 1];
    expect(psScript).toContain("Register-ScheduledTask");
    expect(psScript).toContain("SYSTEM");
  });

  it("hace fallback a usuario cuando SYSTEM falla con acceso denegado (Nivel 2)", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    // Nivel 1 (SYSTEM): access denied
    runSpy.mockResolvedValueOnce(failResult("Acceso denegado"));
    // Nivel 2 (usuario): ok
    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(true);
    expect(result.message).toContain("contexto de usuario");
    expect(runSpy).toHaveBeenCalledTimes(2);
  });

  it("hace fallback a schtasks cuando PowerShell falla con acceso denegado (Nivel 3)", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    // Nivel 1 (SYSTEM): access denied
    runSpy.mockResolvedValueOnce(failResult("Acceso denegado"));
    // Nivel 2 (usuario): también falla
    runSpy.mockResolvedValueOnce(failResult("Error genérico PowerShell"));
    // Nivel 3 (schtasks): ok
    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(true);
    expect(result.message).toContain("schtasks fallback");
    expect(runSpy).toHaveBeenCalledTimes(3);

    // Verifica que la tercera llamada usa schtasks
    const thirdCall = runSpy.mock.calls[2]?.[0] as {
      command: string;
      args: string[];
    };
    expect(thirdCall.command).toBe("schtasks");
  });

  it("retorna ok:false cuando todos los niveles fallan (Nivel 4)", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    // Nivel 1 (SYSTEM): access denied
    runSpy.mockResolvedValueOnce(failResult("Acceso denegado"));
    // Nivel 2 (usuario): falla
    runSpy.mockResolvedValueOnce(failResult("Error PS usuario"));
    // Nivel 3 (schtasks): falla
    runSpy.mockResolvedValueOnce(failResult("schtasks error final"));

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("BACKUP_SCHEDULE_FAILED");
    expect(result.message).toContain("múltiples intentos");
    expect(runSpy).toHaveBeenCalledTimes(3);
  });

  it("salta a Nivel 3 sin pasar por Nivel 2 si el error NO es de elevación", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    // Nivel 1 (SYSTEM): falla por error genérico (no acceso denegado)
    runSpy.mockResolvedValueOnce(
      failResult("Error: Module ScheduledTasks not found"),
    );
    // Nivel 3 (schtasks): ok (se salta nivel 2)
    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(true);
    expect(result.message).toContain("schtasks fallback");
    // Solo 2 llamadas: nivel 1 + nivel 3 (nivel 2 se saltó)
    expect(runSpy).toHaveBeenCalledTimes(2);
  });

  it("detecta múltiples variantes de error de elevación", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    for (const errorMsg of [
      "Access is denied",
      "0x80070005",
      "error 740",
      "requires elevation",
      "UnauthorizedAccessException",
      "not have the required privileges",
    ]) {
      runSpy.mockReset();
      // Nivel 1: variante de error de elevación
      runSpy.mockResolvedValueOnce(failResult(errorMsg));
      // Nivel 2: ok
      runSpy.mockResolvedValueOnce(OK_RESULT);

      const service = new BackupRestoreService(pathResolver, processRunner);
      const result = await service.configureScheduledBackup(buildConfig());

      expect(result.ok).toBe(true);
      expect(runSpy).toHaveBeenCalledTimes(2);
    }
  });

  it("elimina tarea cuando backupFrequency es 'off'", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    // PowerShell Unregister: ok
    runSpy.mockResolvedValueOnce({ ...OK_RESULT, stdout: "NOT_FOUND" });

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "off" }),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain("No existía");
  });

  it("usa intervalo 7 para frecuencia semanal", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "weekly" }),
    );

    const firstCall = runSpy.mock.calls[0]?.[0] as { args: string[] };
    const psScript = firstCall.args[firstCall.args.indexOf("-Command") + 1];
    expect(psScript).toContain("-DaysInterval 7");
  });

  it("retorna ok en plataforma no-win32 sin ejecutar nada", async () => {
    Object.defineProperty(process, "platform", { value: "linux" });
    const { pathResolver, processRunner, runSpy } = createStubs();

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(true);
    expect(result.message).toContain("fuera de Windows");
    expect(runSpy).not.toHaveBeenCalled();
  });

  it("escribe el launcher .ps1 correctamente", async () => {
    const mkdirSpy = vi.spyOn(fs, "mkdir");
    const writeSpy = vi.spyOn(fs, "writeFile");

    const { pathResolver, processRunner, runSpy } = createStubs();
    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    await service.configureScheduledBackup(buildConfig());

    expect(mkdirSpy).toHaveBeenCalledWith(
      expect.stringContaining("scheduled-tasks"),
      { recursive: true },
    );

    expect(writeSpy).toHaveBeenCalledWith(
      expect.stringContaining("run-backup-scheduled.ps1"),
      expect.stringContaining("$ErrorActionPreference = 'Stop'"),
      { encoding: "utf8" },
    );
  });
});

describe("BackupRestoreService.deleteScheduledBackupTask (vía configureScheduledBackup frequency=off)", () => {
  const originalPlatform = process.platform;

  beforeEach(() => {
    Object.defineProperty(process, "platform", { value: "win32" });
  });

  afterEach(() => {
    Object.defineProperty(process, "platform", { value: originalPlatform });
    vi.restoreAllMocks();
  });

  it("elimina con PowerShell Unregister-ScheduledTask", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();
    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "off" }),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Tarea programada de backups eliminada.");

    const firstCall = runSpy.mock.calls[0]?.[0] as {
      command: string;
      args: string[];
    };
    expect(firstCall.command).toBe("powershell");
    expect(firstCall.args.join(" ")).toContain("Unregister-ScheduledTask");
  });

  it("hace fallback a schtasks /Delete si PowerShell falla", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    // PowerShell Unregister: falla
    runSpy.mockResolvedValueOnce(failResult("PS error"));
    // schtasks /Delete: ok
    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "off" }),
    );

    expect(result.ok).toBe(true);
    expect(runSpy).toHaveBeenCalledTimes(2);

    const secondCall = runSpy.mock.calls[1]?.[0] as {
      command: string;
      args: string[];
    };
    expect(secondCall.command).toBe("schtasks");
    expect(secondCall.args).toContain("/Delete");
  });

  it("retorna ok:true si la tarea no existe (schtasks fallback)", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    // PowerShell: falla
    runSpy.mockResolvedValueOnce(failResult("PS error"));
    // schtasks: not found
    runSpy.mockResolvedValueOnce(
      failResult("ERROR: The system cannot find the file specified."),
    );

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "off" }),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain("No existía");
  });
});
