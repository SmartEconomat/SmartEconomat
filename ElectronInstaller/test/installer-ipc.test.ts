import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import type { InstallerConfigPayload } from "@shared/contracts";

import { InstallerIPC } from "@main/ipc/installer.ipc";

vi.mock("electron", () => {
  return {
    app: {
      getPath: () => "C:/Temp",
      getAppPath: () => "C:/Temp/app",
      whenReady: () => Promise.resolve(),
    },
    BrowserWindow: class BrowserWindow {},
    dialog: {
      showOpenDialog: vi.fn(),
    },
    shell: {
      openExternal: vi.fn(),
    },
  };
});

vi.mock("nodemailer", () => {
  return {
    default: {
      createTransport: vi.fn(() => ({
        sendMail: vi.fn().mockResolvedValue({ messageId: "test-message-id" }),
      })),
    },
  };
});

const basePayload: InstallerConfigPayload = {
  runtimePath: "C:/SmartEconomatRuntime",
  instanceName: "smarteconomat-local",
  installMode: "new",
  adminUsername: "admin",
  adminPassword: "SmartEconomat2026!",
  adminEmail: "admin@smarteconomat.app",
  superAdminUsername: "superadmin",
  superAdminPassword: "SmartEconomat2026!",
  superAdminEmail: "superadmin@smarteconomat.app",
  verifyExistingAdminSession: false,
  repairAdminCredentialsOnFailure: false,
  verifyAdminUsername: "",
  verifyAdminPassword: "",
  useSamePasswordForBoth: false,
  localHost: "smarteconomat.app",
  timezone: "Europe/Madrid",
  tlsProvider: "selfsigned",
  customCertFullchainPath: "",
  customCertPrivkeyPath: "",
  backupFrequency: "off",
  backupDefaultDirectory: "C:/SmartEconomatRuntime/backups",
  backupScheduleTime: "02:00",
  backupRetentionDays: 7,
  httpPort: 80,
  httpsPort: 443,
  smtpHost: "",
  smtpPort: "",
  smtpUser: "",
  smtpPass: "",
  smtpFrom: "",
  smtpSecure: false,
};

type ProcessRunnerMock = {
  run: ReturnType<typeof vi.fn>;
};

function createInstaller(processRunner?: ProcessRunnerMock): InstallerIPC {
  const windowStub = {
    webContents: {
      send: vi.fn(),
    },
  };
  const debugLogServiceStub = {
    logIpcPush: vi.fn(),
  };

  const installer = new InstallerIPC(
    windowStub as never,
    debugLogServiceStub as never,
  );

  const runner =
    processRunner ??
    ({
      run: vi.fn().mockResolvedValue({
        ok: true,
        code: 0,
        stdout: "ok",
        stderr: "",
        message: "ok",
      }),
    } satisfies ProcessRunnerMock);

  Object.defineProperty(installer, "processRunner", {
    value: runner,
  });
  Object.defineProperty(installer, "journalService", {
    value: {
      append: vi.fn().mockResolvedValue(undefined),
    },
  });

  return installer;
}

describe("InstallerIPC Windows network automation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("actualiza hosts en Windows con backup previo", async () => {
    vi.spyOn(process, "platform", "get").mockReturnValue("win32");

    const runner: ProcessRunnerMock = {
      run: vi.fn().mockResolvedValue({
        ok: true,
        code: 0,
        stdout: "HOSTS_UPDATED",
        stderr: "",
        message: "ok",
      }),
    };

    const installer = createInstaller(runner);

    const result = await (
      installer as unknown as {
        ensureWindowsHostsMapping: (
          configuredHost: string,
          runtimePath: string,
        ) => Promise<{ ok: boolean; message: string }>;
      }
    ).ensureWindowsHostsMapping("smarteconomat.app", "C:/Runtime");

    expect(result.ok).toBe(true);
    expect(runner.run).toHaveBeenCalledTimes(1);
    const call = runner.run.mock.calls[0]?.[0] as {
      args?: string[];
    };
    const commandArgs = call.args?.join(" ") ?? "";
    expect(commandArgs).toContain("Copy-Item -LiteralPath $hostsPath -Destination $backupPath -Force");
    expect(commandArgs).toContain("127.0.0.1 smarteconomat.app");
    expect(commandArgs).toContain("::1 smarteconomat.app");
  });

  it("crea reglas de firewall para HTTP y HTTPS en Windows", async () => {
    vi.spyOn(process, "platform", "get").mockReturnValue("win32");

    const runner: ProcessRunnerMock = {
      run: vi.fn().mockResolvedValue({
        ok: true,
        code: 0,
        stdout: "ok",
        stderr: "",
        message: "ok",
      }),
    };

    const installer = createInstaller(runner);

    const result = await (
      installer as unknown as {
        ensureWindowsFirewallRules: (
          payload: InstallerConfigPayload,
        ) => Promise<{ ok: boolean; message: string }>;
      }
    ).ensureWindowsFirewallRules(basePayload);

    expect(result.ok).toBe(true);
    expect(result.message).toContain("80, 443");
    const call = runner.run.mock.calls[0]?.[0] as {
      args?: string[];
    };
    const commandArgs = call.args?.join(" ") ?? "";
    expect(commandArgs).toContain("netsh advfirewall firewall add rule");
    expect(commandArgs).toContain("localport=80");
    expect(commandArgs).toContain("localport=443");
  });

  it("falla si HTTPS estricto no valida el certificado", async () => {
    vi.spyOn(process, "platform", "get").mockReturnValue("linux");
    const installer = createInstaller();
    Object.defineProperty(installer, "checkStrictHttps", {
      value: vi.fn().mockResolvedValue(false),
    });

    const result = await (
      installer as unknown as {
        validateStrictTlsAndLocalDomain: (
          payload: InstallerConfigPayload,
        ) => Promise<{ ok: boolean; errorCode?: string }>;
      }
    ).validateStrictTlsAndLocalDomain({
      ...basePayload,
      tlsProvider: "selfsigned",
    });

    expect(result.ok).toBe(false);
    expect(result.errorCode).toBe("STRICT_TLS_VALIDATION_FAILED");
  });

  it("hace rollback de hosts cuando falla la instalación", async () => {
    vi.spyOn(process, "platform", "get").mockReturnValue("win32");

    const runner: ProcessRunnerMock = {
      run: vi.fn().mockResolvedValue({
        ok: true,
        code: 0,
        stdout: "HOSTS_ROLLED_BACK",
        stderr: "",
        message: "ok",
      }),
    };
    const installer = createInstaller(runner);

    Object.defineProperty(installer, "hostsBackupPath", {
      value: "C:/Runtime/diagnostics/hosts.backup.1.txt",
      writable: true,
    });

    const failResult = await (
      installer as unknown as {
        fail: (
          runtimePath: string,
          message: string,
          errorCode: string,
        ) => Promise<{ ok: boolean; errorCode?: string }>;
      }
    ).fail("C:/Runtime", "boom", "VERIFY_FAILED");

    expect(failResult.ok).toBe(false);
    expect(failResult.errorCode).toBe("VERIFY_FAILED");
    const commandArgs = ((runner.run.mock.calls[0]?.[0] as { args?: string[] })
      .args ?? []).join(" ");
    expect(commandArgs).toContain("Copy-Item -LiteralPath $backupPath -Destination $hostsPath -Force");
  });
});
