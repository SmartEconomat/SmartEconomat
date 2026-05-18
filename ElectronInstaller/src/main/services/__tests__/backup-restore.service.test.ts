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

  it("programa con schtasks en SYSTEM cuando el primer /Create tiene éxito", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(true);
    expect(result.message).toContain("Backup automático programado");
    expect(result.message).toContain("03:00");
    expect(runSpy).toHaveBeenCalledTimes(1);

    const firstCall = runSpy.mock.calls[0]?.[0] as {
      command: string;
      args: string[];
    };
    expect(firstCall.command).toBe("schtasks");
    expect(firstCall.args).toContain("/Create");
    expect(firstCall.args).toContain("/RU");
    expect(firstCall.args).toContain("SYSTEM");
    expect(firstCall.args).toContain("/SC");
    expect(firstCall.args).toContain("DAILY");
    expect(firstCall.args).toContain("/MO");
    expect(firstCall.args).toContain("1");
    const trIndex = firstCall.args.indexOf("/TR");
    expect(trIndex).toBeGreaterThan(-1);
    expect(firstCall.args[trIndex + 1]).toMatch(/powershell\.exe/i);
    expect(firstCall.args[trIndex + 1]).toContain("run-backup-scheduled.ps1");
  });

  it("hace fallback a schtasks sin SYSTEM cuando el primer intento devuelve acceso denegado", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(failResult("Acceso denegado"));
    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(true);
    expect(result.message).toContain("contexto de usuario");
    expect(runSpy).toHaveBeenCalledTimes(2);

    const secondCall = runSpy.mock.calls[1]?.[0] as {
      command: string;
      args: string[];
    };
    expect(secondCall.command).toBe("schtasks");
    expect(secondCall.args).toContain("/Create");
    expect(secondCall.args).not.toContain("SYSTEM");
  });

  it("retorna error cuando hay acceso denegado y también falla el /Create en contexto usuario", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(failResult("Acceso denegado"));
    runSpy.mockResolvedValueOnce(failResult("Error PS usuario"));

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("BACKUP_SCHEDULE_FAILED");
    expect(result.message).toContain("Error PS usuario");
    expect(result.message).toContain("diagnóstico scheduler");
    expect(result.message).toContain("fallback-user");
    expect(runSpy).toHaveBeenCalledTimes(2);
  });

  it("no hace fallback a usuario si el fallo no es de acceso denegado", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(
      failResult("Error: Module ScheduledTasks not found"),
    );

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("BACKUP_SCHEDULE_FAILED");
    expect(runSpy).toHaveBeenCalledTimes(1);
  });

  it("trata Access is denied y Acceso denegado como disparadores del fallback usuario", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    for (const errorMsg of ["Access is denied", "Acceso denegado"]) {
      runSpy.mockReset();
      runSpy.mockResolvedValueOnce(failResult(errorMsg));
      runSpy.mockResolvedValueOnce(OK_RESULT);

      const service = new BackupRestoreService(pathResolver, processRunner);
      const result = await service.configureScheduledBackup(buildConfig());

      expect(result.ok).toBe(true);
      expect(result.message).toContain("contexto de usuario");
      expect(runSpy).toHaveBeenCalledTimes(2);
    }
  });

  it("no reintenta en usuario cuando el texto de error no coincide con acceso denegado", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(failResult("0x80070005 elevation required"));

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(buildConfig());

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("BACKUP_SCHEDULE_FAILED");
    expect(runSpy).toHaveBeenCalledTimes(1);
  });

  it("elimina tarea cuando backupFrequency es 'off' y schtasks /Delete tiene éxito", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "off" }),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toBe("Tarea programada de backups eliminada.");
    expect(runSpy).toHaveBeenCalledTimes(1);
    const firstCall = runSpy.mock.calls[0]?.[0] as {
      command: string;
      args: string[];
    };
    expect(firstCall.command).toBe("schtasks");
    expect(firstCall.args).toContain("/Delete");
  });

  it("usa /MO 7 para frecuencia semanal (intervalo de 7 días bajo /SC DAILY)", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(OK_RESULT);

    const service = new BackupRestoreService(pathResolver, processRunner);
    await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "weekly" }),
    );

    const firstCall = runSpy.mock.calls[0]?.[0] as { args: string[] };
    const moIndex = firstCall.args.indexOf("/MO");
    expect(moIndex).toBeGreaterThan(-1);
    expect(firstCall.args[moIndex + 1]).toBe("7");
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

  it("elimina con schtasks /Delete /F", async () => {
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
    expect(firstCall.command).toBe("schtasks");
    expect(firstCall.args).toContain("/Delete");
    expect(firstCall.args).toContain("/F");
  });

  it("retorna ok:true si schtasks indica que la tarea no existe", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(
      failResult("ERROR: The system cannot find the file specified."),
    );

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "off" }),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain("No existía");
    expect(runSpy).toHaveBeenCalledTimes(1);
  });

  it("retorna ok:true con mensaje en español cuando no se puede encontrar la tarea", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(
      failResult("No se puede encontrar el archivo especificado."),
    );

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "off" }),
    );

    expect(result.ok).toBe(true);
    expect(result.message).toContain("No existía");
  });

  it("retorna error si schtasks /Delete falla por un motivo distinto a no encontrado", async () => {
    const { pathResolver, processRunner, runSpy } = createStubs();

    runSpy.mockResolvedValueOnce(failResult("ERROR: Access denied"));

    const service = new BackupRestoreService(pathResolver, processRunner);
    const result = await service.configureScheduledBackup(
      buildConfig({ backupFrequency: "off" }),
    );

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("BACKUP_SCHEDULE_DELETE_FAILED");
    expect(runSpy).toHaveBeenCalledTimes(1);
  });
});
