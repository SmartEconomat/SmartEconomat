import { describe, expect, it, vi } from "vitest";

import type { CommandResult } from "@shared/contracts";

import { ProcessRunnerService } from "../process-runner.service";
import { PathResolverService } from "../path-resolver.service";
import {
  DOCKER_SERVICE_STARTMODE_MANUAL,
  WindowsDockerServiceConfigService,
} from "../windows-docker-service-config.service";

function result(
  partial: Partial<CommandResult> & Pick<CommandResult, "ok">,
): CommandResult {
  return {
    code: partial.ok ? 0 : 1,
    stdout: "",
    stderr: "",
    message: "",
    ...partial,
  };
}

describe("WindowsDockerServiceConfigService", () => {
  it("parsea JSON de ensureAutomatic cuando StartMode es Auto", async () => {
    const runSpy = vi.fn().mockResolvedValue(
      result({
        ok: true,
        stdout:
          '{"ok":true,"startMode":"Auto","state":"Running","detail":"StartMode=Auto (antes=Manual)"}\n',
        code: 0,
      }),
    );
    const pathResolver = {
      getProjectRoot: () => "C:\\proj",
      getInstallerScriptsRoot: () => "C:\\proj\\scripts",
    } as PathResolverService;

    const service = new WindowsDockerServiceConfigService(
      { run: runSpy } as unknown as ProcessRunnerService,
      pathResolver,
    );

    const parsed = await service.ensureAutomatic({ startIfStopped: true });
    expect(parsed.ok).toBe(true);
    expect(parsed.startMode).toBe("Auto");
    expect(runSpy).toHaveBeenCalledOnce();
    const call = runSpy.mock.calls[0]?.[0] as { args: string[] };
    expect(call.args.join(" ")).toContain(
      "ensure-com-docker-service-automatic.ps1",
    );
    expect(call.args).toContain("-StartIfStopped");
  });

  it("marca DOCKER_SERVICE_STARTMODE_MANUAL cuando sigue en Manual", async () => {
    const runSpy = vi.fn().mockResolvedValue(
      result({
        ok: false,
        stdout:
          '{"ok":false,"startMode":"Manual","state":"Stopped","detail":"DOCKER_SERVICE_STARTMODE_MANUAL: sigue en Manual (antes=Manual)"}\n',
        code: 1,
      }),
    );
    const pathResolver = {
      getProjectRoot: () => "C:\\proj",
      getInstallerScriptsRoot: () => "C:\\proj\\scripts",
    } as PathResolverService;

    const service = new WindowsDockerServiceConfigService(
      { run: runSpy } as unknown as ProcessRunnerService,
      pathResolver,
    );

    const parsed = await service.ensureAutomatic();
    expect(parsed.ok).toBe(false);
    expect(parsed.errorCode).toBe(DOCKER_SERVICE_STARTMODE_MANUAL);
    expect(parsed.startMode).toBe("Manual");
  });

  it("readStartMode interpreta Automatic como ok", async () => {
    const runSpy = vi.fn().mockResolvedValue(
      result({
        ok: true,
        stdout:
          '{"ok":true,"startMode":"Automatic","state":"Running","detail":"read-only"}\n',
        code: 0,
      }),
    );
    const pathResolver = {
      getProjectRoot: () => "C:\\proj",
      getInstallerScriptsRoot: () => "C:\\proj\\scripts",
    } as PathResolverService;

    const service = new WindowsDockerServiceConfigService(
      { run: runSpy } as unknown as ProcessRunnerService,
      pathResolver,
    );

    const parsed = await service.readStartMode();
    expect(parsed.ok).toBe(true);
    expect(parsed.startMode).toBe("Automatic");
  });
});
