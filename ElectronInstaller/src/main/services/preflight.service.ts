import fs from "node:fs/promises";
import path from "node:path";

import type {
  CommandResult,
  OperationResult,
  PortRepairPayload,
  PreflightCheck,
  PreflightReport,
} from "@shared/contracts";

import {
  resolveWindowsDockerCliPath,
  resolveWindowsDockerDesktopExePath,
} from "./docker-desktop-windows-resolve";
import { OSDetectorService } from "./os-detector.service";
import { ProcessRunnerService } from "./process-runner.service";

export function evaluateDockerChecks(
  dockerVersion: CommandResult,
  composeVersion: CommandResult,
): PreflightCheck[] {
  const dockerFailure = normalizeDockerFailure(dockerVersion);
  const composeFailure = normalizeDockerFailure(composeVersion);
  const dockerTimedOut = isDockerTimeoutFailure(dockerVersion);
  const composeTimedOut = isDockerTimeoutFailure(composeVersion);
  const dockerDesktopPipeFailure = isDockerDesktopPipeFailure(dockerVersion);
  const composeDesktopPipeFailure = isDockerDesktopPipeFailure(composeVersion);

  const dockerCheck: PreflightCheck = {
    id: "docker-engine",
    label: "Docker Engine",
    status: dockerVersion.ok
      ? "OK"
      : dockerTimedOut || dockerDesktopPipeFailure
        ? "WARN"
        : "BLOCKER",
    detail: dockerVersion.ok ? dockerVersion.stdout : dockerFailure.detail,
    recommendation: dockerVersion.ok ? undefined : dockerFailure.recommendation,
  };

  const composeCheck: PreflightCheck = {
    id: "docker-compose",
    label: "Docker Compose",
    status: composeVersion.ok
      ? "OK"
      : composeTimedOut || composeDesktopPipeFailure
        ? "WARN"
        : "BLOCKER",
    detail: composeVersion.ok ? composeVersion.stdout : composeFailure.detail,
    recommendation: composeVersion.ok
      ? undefined
      : composeFailure.recommendation,
  };

  return [dockerCheck, composeCheck];
}

function normalizeDockerFailure(result: CommandResult): {
  detail: string;
  recommendation: string;
} {
  const fallbackDetail =
    result.stderr || result.message || "Docker no responde.";
  const raw =
    `${result.stderr}\n${result.stdout}\n${result.message}`.toLowerCase();

  if (raw.includes("command timed out") || raw.includes("timed out")) {
    return {
      detail:
        "La comprobación de Docker excedió el tiempo de espera. El motor puede estar arrancando o bajo carga.",
      recommendation:
        "Espera a que Docker Desktop/Engine termine de iniciar y vuelve a ejecutar preflight. Si persiste, revisa diagnóstico de Docker.",
    };
  }

  if (
    raw.includes("dockerdesktoplinuxengine") ||
    raw.includes("open //./pipe/dockerdesktoplinuxengine") ||
    raw.includes("failed to connect to the docker api at npipe")
  ) {
    return {
      detail:
        "El contexto Docker actual apunta a dockerDesktopLinuxEngine y ese pipe no responde. En modo headless esto puede ser un contexto incorrecto, no un fallo real de Engine.",
      recommendation:
        "Cambia a un contexto operativo (`docker context ls` / `docker context use default`) o verifica el daemon activo y repite preflight.",
    };
  }

  if (
    raw.includes("cannot connect to the docker daemon") ||
    raw.includes("error during connect")
  ) {
    return {
      detail:
        "No se pudo conectar con Docker daemon. Docker Desktop/Engine parece no operativo.",
      recommendation:
        "Arranca Docker Desktop (o el servicio docker en Linux) y vuelve a ejecutar preflight.",
    };
  }

  if (raw.includes("command not found") || raw.includes("enoent")) {
    return {
      detail: "Docker CLI no está disponible en PATH.",
      recommendation:
        "Instala Docker Desktop/Engine y verifica que el comando `docker` esté disponible en terminal.",
    };
  }

  return {
    detail: fallbackDetail,
    recommendation:
      "Revisa Docker Desktop/Engine y vuelve a ejecutar preflight.",
  };
}

function isDockerTimeoutFailure(result: CommandResult): boolean {
  const raw =
    `${result.message}\n${result.stderr}\n${result.stdout}`.toLowerCase();
  return raw.includes("command timed out") || raw.includes("timed out");
}

function isDockerDesktopPipeFailure(result: CommandResult): boolean {
  const raw =
    `${result.message}\n${result.stderr}\n${result.stdout}`.toLowerCase();
  return (
    raw.includes("dockerdesktoplinuxengine") ||
    raw.includes("open //./pipe/dockerdesktoplinuxengine")
  );
}

export function downgradeWindowsDockerDesktopChecks(
  checks: PreflightCheck[],
  dockerVersion: CommandResult,
  composeVersion: CommandResult,
  platform: NodeJS.Platform = process.platform,
): PreflightCheck[] {
  if (platform !== "win32") {
    return checks;
  }

  if (!dockerVersion.ok || !composeVersion.ok) {
    return checks;
  }

  return checks.map((check) => {
    if (
      check.status !== "BLOCKER" ||
      (check.id !== "wsl2" &&
        check.id !== "docker-desktop-installed" &&
        check.id !== "docker-desktop-running")
    ) {
      return check;
    }

    return {
      ...check,
      status: "WARN",
      detail: `${check.detail} Docker está operativo, así que esta validación de Desktop no bloquea la instalación.`,
      recommendation:
        "Docker responde correctamente. Esta comprobación se mantiene solo como advertencia informativa.",
      repairable: false,
      repairAction: undefined,
      repairHint: undefined,
    };
  });
}

export function downgradeDockerContextPipeChecks(
  checks: PreflightCheck[],
): PreflightCheck[] {
  return checks.map((check) => {
    const raw = `${check.detail}\n${check.recommendation ?? ""}`.toLowerCase();
    const isDockerContextPipeWarning =
      (check.id === "docker-engine" || check.id === "docker-compose") &&
      raw.includes("dockerdesktoplinuxengine");

    if (!isDockerContextPipeWarning) {
      return check;
    }

    return {
      ...check,
      status: "WARN",
      repairable: true,
      repairAction: "auto-repair",
      repairHint:
        "Intentará arrancar com.docker.service, Docker Desktop y el engine Linux de WSL automáticamente.",
    };
  });
}

interface PortInspectionResult {
  status: PreflightCheck["status"];
  detail: string;
  recommendation?: string;
  ownerPid?: number;
  ownerProcessName?: string;
}

export class PreflightService {
  constructor(
    private readonly osDetector = new OSDetectorService(),
    private readonly processRunner = new ProcessRunnerService(),
  ) {}

  async run(runtimePath: string): Promise<OperationResult<PreflightReport>> {
    const checks: PreflightCheck[] = [];

    checks.push(...(await this.systemChecks(runtimePath)));
    checks.push(...(await this.dockerChecks(runtimePath)));
    checks.push(...(await this.portChecks()));
    checks.push(...(await this.certDependencyChecks()));
    checks.push(...(await this.smartAppControlChecks()));

    const hasBlocker = checks.some((check) => check.status === "BLOCKER");

    return {
      ok: !hasBlocker,
      message: hasBlocker
        ? "Preflight completado con bloqueantes."
        : "Preflight completado sin bloqueantes.",
      data: {
        generatedAt: new Date().toISOString(),
        checks,
      },
      errorCode: hasBlocker ? "PREFLIGHT_BLOCKER" : undefined,
    };
  }

  async runAutoRepair(
    runtimePath: string,
    onProgress?: (line: string) => void,
  ): Promise<OperationResult<PreflightReport>> {
    onProgress?.("Iniciando autorreparación de preflight...");

    if (process.platform === "win32") {
      await this.repairWindowsDependencies(runtimePath, onProgress);
    }

    onProgress?.("Liberando puertos conocidos (80/443) si están ocupados...");
    await this.releaseKnownBusyPorts();
    onProgress?.("Reejecutando preflight para validar el estado final...");
    return this.run(runtimePath);
  }

  async releaseBusyPort(
    payload: PortRepairPayload,
  ): Promise<OperationResult<PreflightReport>> {
    const owner = await this.inspectPort(payload.port);
    if (owner.status === "OK") {
      return this.run(payload.runtimePath);
    }

    if (!owner.ownerPid) {
      return {
        ok: false,
        message: `No se pudo identificar el PID del puerto ${payload.port}.`,
        errorCode: "PORT_OWNER_UNKNOWN",
      };
    }

    const released = await this.killPid(owner.ownerPid);
    if (!released) {
      return {
        ok: false,
        message: `No se pudo cerrar el proceso ${owner.ownerPid} del puerto ${payload.port}.`,
        errorCode: "PORT_RELEASE_FAILED",
      };
    }

    return this.run(payload.runtimePath);
  }

  private async systemChecks(runtimePath: string): Promise<PreflightCheck[]> {
    const details = this.osDetector.detect();

    await fs.mkdir(runtimePath, { recursive: true });

    const memoryStatus = details.totalMemoryGb >= 6 ? "OK" : "WARN";
    const memoryCheck: PreflightCheck = {
      id: "system-memory",
      label: "Memoria RAM mínima",
      status: memoryStatus,
      detail: `RAM detectada: ${details.totalMemoryGb} GB`,
      recommendation:
        memoryStatus === "WARN"
          ? "Recomendado >= 6 GB para instalación estable."
          : undefined,
    };

    const diskCheck = await this.buildDiskCheck(runtimePath);
    const writeCheck = await this.buildWriteCheck(runtimePath);

    return [memoryCheck, diskCheck, writeCheck];
  }

  private async buildDiskCheck(runtimePath: string): Promise<PreflightCheck> {
    try {
      const stats = await fs.statfs(runtimePath);
      const freeBytes = BigInt(stats.bavail) * BigInt(stats.bsize);
      const freeGb = Number(freeBytes) / 1024 ** 3;
      const status = freeGb >= 10 ? "OK" : "BLOCKER";

      return {
        id: "system-disk",
        label: "Espacio de disco",
        status,
        detail: `Espacio libre estimado: ${freeGb.toFixed(2)} GB`,
        recommendation:
          status === "BLOCKER"
            ? "Liberar espacio hasta superar 10 GB."
            : undefined,
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "No se pudo evaluar el disco";
      return {
        id: "system-disk",
        label: "Espacio de disco",
        status: "WARN",
        detail: message,
        recommendation: "Validar manualmente que haya al menos 10 GB libres.",
      };
    }
  }

  private async buildWriteCheck(runtimePath: string): Promise<PreflightCheck> {
    const probeFile = `${runtimePath}/.write-check.tmp`;

    try {
      await fs.writeFile(probeFile, "ok", { encoding: "utf8" });
      await fs.unlink(probeFile);
      return {
        id: "system-write",
        label: "Permisos de escritura",
        status: "OK",
        detail: "La carpeta runtime permite escritura.",
      };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Permiso denegado";
      const isAccessDenied =
        message.includes("EACCES") ||
        message.toLowerCase().includes("permission denied");
      const recommendation =
        isAccessDenied && runtimePath.startsWith("/tmp/")
          ? "Esa ruta bajo /tmp no es escribible (a menudo por permisos o porque se creó con otro usuario/sudo). Elige una carpeta bajo tu usuario (por defecto ~/.smarteconomat-runtime) o corrige permisos/chown del directorio."
          : "Seleccionar una carpeta con permisos de escritura.";
      return {
        id: "system-write",
        label: "Permisos de escritura",
        status: "BLOCKER",
        detail: message,
        recommendation,
      };
    }
  }

  private async dockerChecks(runtimePath: string): Promise<PreflightCheck[]> {
    const checks: PreflightCheck[] = [];
    const dockerDesktopChecks: PreflightCheck[] = [];
    const dockerCommand =
      process.platform === "win32"
        ? ((await resolveWindowsDockerCliPath(this.processRunner)) ?? "docker")
        : "docker";

    if (process.platform === "win32") {
      dockerDesktopChecks.push(await this.checkWsl2());
      dockerDesktopChecks.push(await this.checkDockerDesktopInstalled());
      dockerDesktopChecks.push(await this.checkDockerDesktopRunning());
    }

    const dockerVersion = await this.processRunner.run({
      command: dockerCommand,
      args: ["version", "--format", "{{.Server.Version}}"],
      timeoutMs: 15_000,
    });

    const composeVersion = await this.processRunner.run({
      command: dockerCommand,
      args: ["compose", "version"],
      timeoutMs: 15_000,
    });

    const dockerChecks = evaluateDockerChecks(dockerVersion, composeVersion);
    const dockerEngineCheck = dockerChecks[0];
    const dockerComposeCheck = dockerChecks[1];

    if (!dockerVersion.ok && dockerEngineCheck) {
      dockerEngineCheck.repairable = process.platform === "win32";
      dockerEngineCheck.repairAction = "auto-repair";
      dockerEngineCheck.repairHint =
        "Intentará corregir contexto Docker y revalidar daemon automáticamente.";
    }

    if (!composeVersion.ok && dockerComposeCheck) {
      dockerComposeCheck.repairable = process.platform === "win32";
      dockerComposeCheck.repairAction = "auto-repair";
      dockerComposeCheck.repairHint =
        "Intentará revalidar Docker Compose tras corregir contexto/daemon.";
    }

    checks.push(
      ...downgradeWindowsDockerDesktopChecks(
        dockerDesktopChecks,
        dockerVersion,
        composeVersion,
        process.platform,
      ),
    );

    if (runtimePath.trim().length === 0) {
      checks.push({
        id: "runtime-path-empty",
        label: "Ruta runtime",
        status: "BLOCKER",
        detail: "La ruta runtime está vacía.",
        recommendation: "Configura una ruta runtime válida antes de continuar.",
      });
    }

    return downgradeDockerContextPipeChecks([...checks, ...dockerChecks]);
  }

  private async portChecks(): Promise<PreflightCheck[]> {
    const ports = [80, 443];
    const checks: PreflightCheck[] = [];

    for (const port of ports) {
      const inspection = await this.inspectPort(port);

      checks.push({
        id: `port-${port}`,
        label: `Puerto ${port}`,
        status: inspection.status,
        detail: inspection.detail,
        recommendation: inspection.recommendation,
        repairable:
          inspection.status === "BLOCKER" && Boolean(inspection.ownerPid),
        repairAction:
          inspection.status === "BLOCKER" && inspection.ownerPid
            ? "release-port"
            : undefined,
        repairHint:
          inspection.status === "BLOCKER" && inspection.ownerPid
            ? `Cerrar automáticamente ${inspection.ownerProcessName ?? "proceso"} (PID ${inspection.ownerPid}).`
            : undefined,
        metadata: {
          port,
          ownerPid: inspection.ownerPid,
          ownerProcessName: inspection.ownerProcessName,
        },
      });
    }

    return checks;
  }

  private async inspectPort(port: number): Promise<PortInspectionResult> {
    if (process.platform === "win32") {
      return this.inspectPortWindows(port);
    }

    return this.inspectPortUnix(port);
  }

  private async inspectPortWindows(
    port: number,
  ): Promise<PortInspectionResult> {
    const command = [
      `$conn = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1`,
      "if ($null -eq $conn) { Write-Output 'FREE'; exit 0 }",
      "$ownerPid = $conn.OwningProcess",
      "$name = (Get-Process -Id $ownerPid -ErrorAction SilentlyContinue).ProcessName",
      "if ([string]::IsNullOrWhiteSpace($name)) { $name = 'desconocido' }",
      "Write-Output ('BUSY|' + $ownerPid + '|' + $name)",
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", command],
      timeoutMs: 10_000,
    });

    if (!result.ok) {
      return {
        status: "WARN",
        detail: `No se pudo inspeccionar el puerto ${port}: ${result.stderr || result.message}`,
        recommendation:
          "Ejecutar como administrador: Get-NetTCPConnection -State Listen -LocalPort " +
          `${port} | Select-Object OwningProcess, LocalAddress, LocalPort`,
      };
    }

    const output = result.stdout.trim();
    if (output === "FREE") {
      return {
        status: "OK",
        detail: `Puerto ${port} libre.`,
      };
    }

    if (output.startsWith("BUSY|")) {
      const [, pidRaw = "desconocido", processNameRaw = "desconocido"] =
        output.split("|");
      const pid = pidRaw.trim();
      const processName = processNameRaw.trim();
      const pidNumber = Number.parseInt(pid, 10);

      return {
        status: "BLOCKER",
        detail: `Puerto ${port} ocupado por ${processName} (PID ${pid}).`,
        recommendation:
          `PowerShell (admin): Stop-Process -Id ${pid} -Force. ` +
          "También puedes ejecutar bootstrap.ps1 con -ReleaseBusyPorts.",
        ownerPid: Number.isNaN(pidNumber) ? undefined : pidNumber,
        ownerProcessName: processName,
      };
    }

    return {
      status: "WARN",
      detail: `No se pudo interpretar el estado del puerto ${port}.`,
      recommendation:
        "Revisar manualmente con PowerShell: Get-NetTCPConnection -State Listen -LocalPort " +
        `${port}`,
    };
  }

  private async inspectPortUnix(port: number): Promise<PortInspectionResult> {
    const command = [
      `if command -v lsof >/dev/null 2>&1; then`,
      `  pid="$(lsof -nP -iTCP:${port} -sTCP:LISTEN -t 2>/dev/null | head -n1)"`,
      `  if [ -z "$pid" ]; then echo FREE; exit 0; fi`,
      `  name="$(ps -p "$pid" -o comm= 2>/dev/null | head -n1)"`,
      `  [ -z "$name" ] && name=desconocido`,
      `  echo "BUSY|$pid|$name"; exit 0`,
      `fi`,
      `if command -v ss >/dev/null 2>&1; then`,
      `  line="$(ss -ltnp "sport = :${port}" 2>/dev/null | awk 'NR>1 && /LISTEN/ {print; exit}')"`,
      `  if [ -z "$line" ]; then echo FREE; exit 0; fi`,
      `  pid="$(printf '%s' "$line" | sed -n 's/.*pid=\\([0-9][0-9]*\\).*/\\1/p')"`,
      `  name="$(printf '%s' "$line" | awk -F'"' '{print $2}')"`,
      `  [ -z "$pid" ] && pid=desconocido`,
      `  [ -z "$name" ] && name=desconocido`,
      `  echo "BUSY|$pid|$name"; exit 0`,
      `fi`,
      `echo UNKNOWN`,
    ].join("\n");

    const result = await this.processRunner.run({
      command: "bash",
      args: ["-lc", command],
      timeoutMs: 10_000,
    });

    if (!result.ok) {
      return {
        status: "WARN",
        detail: `No se pudo inspeccionar el puerto ${port}: ${result.stderr || result.message}`,
        recommendation: `Revisar manualmente: lsof -nP -iTCP:${port} -sTCP:LISTEN`,
      };
    }

    const output = result.stdout.trim();
    if (output === "FREE") {
      return {
        status: "OK",
        detail: `Puerto ${port} libre.`,
      };
    }

    if (output.startsWith("BUSY|")) {
      const [, pidRaw = "desconocido", processNameRaw = "desconocido"] =
        output.split("|");
      const pid = pidRaw.trim();
      const processName = processNameRaw.trim();
      const pidNumber = Number.parseInt(pid, 10);

      return {
        status: "BLOCKER",
        detail: `Puerto ${port} ocupado por ${processName} (PID ${pid}).`,
        recommendation:
          `Linux/macOS: sudo kill -15 ${pid} || true; sudo kill -9 ${pid} || true. ` +
          "También puedes ejecutar bootstrap.sh con --release-busy-ports.",
        ownerPid: Number.isNaN(pidNumber) ? undefined : pidNumber,
        ownerProcessName: processName,
      };
    }

    return {
      status: "WARN",
      detail: `No se encontraron utilidades para inspeccionar el puerto ${port}.`,
      recommendation: `Instalar lsof/ss o revisar manualmente qué proceso usa el puerto ${port}.`,
    };
  }

  private async certDependencyChecks(): Promise<PreflightCheck[]> {
    const isWindows = process.platform === "win32";
    const command = isWindows ? "powershell" : "openssl";
    const args = isWindows
      ? ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"]
      : ["version"];

    const result = await this.processRunner.run({
      command,
      args,
      timeoutMs: 10_000,
    });

    return [
      {
        id: "tls-dependency",
        label: isWindows ? "PowerShell disponible" : "OpenSSL disponible",
        status: result.ok ? "OK" : "WARN",
        detail: result.ok ? result.stdout : result.stderr,
        recommendation: result.ok
          ? undefined
          : "Instalar dependencia TLS para automatizar certificados locales.",
      },
    ];
  }

  private async smartAppControlChecks(): Promise<PreflightCheck[]> {
    if (process.platform !== "win32") {
      return [];
    }

    const command = [
      "$policyPath = 'HKLM:\\SYSTEM\\CurrentControlSet\\Control\\CI\\Policy'",
      "$state = (Get-ItemProperty -Path $policyPath -Name 'VerifiedAndReputablePolicyState' -ErrorAction SilentlyContinue).VerifiedAndReputablePolicyState",
      "if ($null -eq $state) { Write-Output 'UNKNOWN'; exit 0 }",
      "Write-Output $state",
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", command],
      timeoutMs: 10_000,
    });

    if (!result.ok) {
      return [
        {
          id: "smart-app-control",
          label: "Smart App Control",
          status: "WARN",
          detail:
            "No se pudo detectar el estado de Smart App Control en este equipo.",
          recommendation:
            "Revisa Seguridad de Windows > Control de aplicaciones y navegador.",
          repairable: true,
          repairAction: "open-security",
        },
      ];
    }

    const state = result.stdout.trim();
    if (state === "2") {
      return [
        {
          id: "smart-app-control",
          label: "Smart App Control",
          status: "WARN",
          detail:
            "Smart App Control está activo. Las apps sin firma de confianza pueden bloquearse.",
          recommendation:
            "Firmar el instalador y añadir exclusión en Defender para entorno de desarrollo.",
          repairable: true,
          repairAction: "auto-repair",
          repairHint:
            "Intentará añadir exclusiones de Defender y abrir Seguridad de Windows.",
          metadata: {
            ownerProcessName: path.basename(process.execPath),
          },
        },
      ];
    }

    if (state === "1") {
      return [
        {
          id: "smart-app-control",
          label: "Smart App Control",
          status: "WARN",
          detail: "Smart App Control está en modo evaluación.",
          recommendation:
            "Se recomienda usar binarios firmados para evitar bloqueos futuros.",
          repairable: true,
          repairAction: "open-security",
        },
      ];
    }

    return [
      {
        id: "smart-app-control",
        label: "Smart App Control",
        status: "OK",
        detail: "Smart App Control no bloquea esta instalación actualmente.",
      },
    ];
  }

  private async repairWindowsDependencies(
    runtimePath: string,
    onProgress?: (line: string) => void,
  ): Promise<void> {
    onProgress?.("Comprobando winget...");
    await this.ensureWingetAvailable();
    onProgress?.("Comprobando/instalando WSL2...");
    await this.ensureWsl2Installed();
    onProgress?.("Ajustando runtime WSL (update + default version 2)...");
    await this.ensureWslUpdatedAndDefaultVersion(onProgress);
    onProgress?.("Comprobando/instalando Docker Desktop...");
    await this.ensureDockerDesktopInstalled(onProgress);
    onProgress?.("Asegurando Docker CLI en PATH de Windows...");
    await this.ensureDockerCliAvailableInPath(onProgress);
    onProgress?.(
      "Asegurando que Docker Desktop y com.docker.service estén activos...",
    );
    await this.ensureDockerDesktopRunning(onProgress);
    onProgress?.("Esperando disponibilidad del engine Linux de Docker...");
    await this.ensureDockerLinuxEngineReady(onProgress);
    onProgress?.("Aplicando exclusiones de Defender (si procede)...");
    await this.tryEnableDefenderExclusions(runtimePath);
  }

  private async ensureWingetAvailable(): Promise<void> {
    await this.processRunner.run({
      command: "winget",
      args: ["--version"],
      timeoutMs: 10_000,
    });
  }

  private async ensureWsl2Installed(): Promise<void> {
    const check = await this.processRunner.run({
      command: "wsl",
      args: ["-l", "-v"],
      timeoutMs: 15_000,
    });
    if (check.ok) {
      return;
    }

    await this.processRunner.run({
      command: "wsl",
      args: ["--install", "--no-distribution"],
      timeoutMs: 120_000,
    });
  }

  private async ensureWslUpdatedAndDefaultVersion(
    onProgress?: (line: string) => void,
  ): Promise<void> {
    const update = await this.processRunner.run({
      command: "wsl",
      args: ["--update"],
      timeoutMs: 180_000,
    });

    if (!update.ok) {
      onProgress?.(
        "WSL update no pudo ejecutarse en modo normal. Intentando elevación (UAC)...",
      );
      await this.runElevatedWslCommand(["--update"], 240_000);
    } else {
      onProgress?.("WSL actualizado correctamente.");
    }

    const setDefaultVersion = await this.processRunner.run({
      command: "wsl",
      args: ["--set-default-version", "2"],
      timeoutMs: 30_000,
    });

    if (!setDefaultVersion.ok) {
      onProgress?.(
        "No se pudo fijar WSL default version 2 en modo normal. Intentando elevación (UAC)...",
      );
      await this.runElevatedWslCommand(["--set-default-version", "2"], 60_000);
    } else {
      onProgress?.("WSL default version configurada en 2.");
    }
  }

  private async runElevatedWslCommand(
    wslArgs: string[],
    timeoutMs: number,
  ): Promise<void> {
    const encodedArgs = wslArgs
      .map((arg) => `'${arg.replace(/'/g, "''")}'`)
      .join(", ");
    const elevateScript = [
      `$p = Start-Process -FilePath 'wsl.exe' -ArgumentList @(${encodedArgs}) -Verb RunAs -WindowStyle Hidden -PassThru -Wait`,
      "if ($null -eq $p) { exit 1 }",
      "exit $p.ExitCode",
    ].join("; ");

    await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", elevateScript],
      timeoutMs,
    });
  }

  private async ensureDockerDesktopInstalled(
    onProgress?: (line: string) => void,
  ): Promise<void> {
    const check = await this.checkDockerDesktopInstalled();
    if (check.status === "OK") {
      onProgress?.("Docker Desktop ya está instalado.");
      return;
    }

    // Si Docker CLI ya responde, no forzamos instalación de Docker Desktop:
    // puede ser un entorno headless válido o una instalación no estándar.
    const dockerCommand =
      (await resolveWindowsDockerCliPath(this.processRunner)) ?? "docker";
    const dockerProbe = await this.processRunner.run({
      command: dockerCommand,
      args: ["version", "--format", "{{.Server.Version}}"],
      timeoutMs: 15_000,
    });
    if (dockerProbe.ok) {
      onProgress?.(
        "Docker CLI ya está operativo; se omite instalación de Docker Desktop.",
      );
      return;
    }

    onProgress?.(
      "Docker Desktop no detectado y Docker CLI no operativo. Instalando con winget (puede tardar varios minutos)...",
    );

    const heartbeat = setInterval(() => {
      onProgress?.(
        "Instalando Docker Desktop... esperando a que winget finalice (proceso en curso).",
      );
    }, 15_000);

    try {
      await this.processRunner.run({
        command: "winget",
        args: [
          "install",
          "-e",
          "--id",
          "Docker.DockerDesktop",
          "--accept-package-agreements",
          "--accept-source-agreements",
          "--disable-interactivity",
          "--silent",
        ],
        timeoutMs: 420_000,
      });
    } finally {
      clearInterval(heartbeat);
    }
    onProgress?.("Finalizó la instalación de Docker Desktop (winget).");
  }

  private async ensureDockerCliAvailableInPath(
    onProgress?: (line: string) => void,
  ): Promise<void> {
    const dockerCommand = await resolveWindowsDockerCliPath(this.processRunner);
    if (!dockerCommand) {
      onProgress?.(
        "No se encontró docker.exe en rutas conocidas; se seguirá con reparación de Docker Desktop.",
      );
      return;
    }

    const dockerBin = path.dirname(dockerCommand);
    const currentPath = process.env.Path ?? process.env.PATH ?? "";
    if (!currentPath.toLowerCase().includes(dockerBin.toLowerCase())) {
      process.env.Path = `${dockerBin};${currentPath}`;
      process.env.PATH = process.env.Path;
      onProgress?.(`PATH de esta ejecución actualizado con ${dockerBin}.`);
    }

    const escapedDockerBin = dockerBin.replace(/'/g, "''");
    const result = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        [
          `$dockerBin='${escapedDockerBin}'`,
          "$current=[Environment]::GetEnvironmentVariable('Path','User')",
          "if ([string]::IsNullOrWhiteSpace($current)) { $current = '' }",
          "if ($current.ToLowerInvariant().Contains($dockerBin.ToLowerInvariant())) { Write-Output 'USER_PATH_ALREADY_OK'; exit 0 }",
          "$next = ($current.TrimEnd(';') + ';' + $dockerBin).TrimStart(';')",
          "[Environment]::SetEnvironmentVariable('Path', $next, 'User')",
          "Write-Output 'USER_PATH_UPDATED'",
        ].join("; "),
      ],
      timeoutMs: 15_000,
    });

    if (result.ok && result.stdout.includes("USER_PATH_UPDATED")) {
      onProgress?.(
        "PATH de usuario actualizado. Las terminales nuevas ya reconocerán docker.",
      );
      return;
    }

    if (result.ok) {
      onProgress?.("PATH de usuario ya contenía Docker CLI.");
      return;
    }

    onProgress?.(
      `No se pudo actualizar PATH de usuario automáticamente: ${result.stderr || result.message}`,
    );
  }

  private async ensureDockerDesktopRunning(
    onProgress?: (line: string) => void,
  ): Promise<void> {
    await this.ensureWindowsDockerServiceRunning();
    await this.ensureDockerCliAvailableInPath(onProgress);

    const running = await this.checkDockerDesktopRunning();
    if (running.status === "OK") {
      onProgress?.("Docker Desktop ya estaba en ejecución.");
      return;
    }

    const resolved = await resolveWindowsDockerDesktopExePath(
      this.processRunner,
    );
    const candidatePaths =
      resolved !== null
        ? [resolved]
        : [
            "C:/Program Files/Docker/Docker/Docker Desktop.exe",
            "C:/Program Files/Docker/Docker/Docker Desktop",
          ];

    for (const executablePath of candidatePaths) {
      const escaped = executablePath.replace(/'/g, "''");
      const start = await this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-Command",
          `if (Test-Path -LiteralPath '${escaped}') { Start-Process -FilePath '${escaped}'; exit 0 } else { exit 1 }`,
        ],
        timeoutMs: 15_000,
      });
      if (start.ok) {
        onProgress?.(
          "Docker Desktop lanzado. Esperando que responda el daemon...",
        );
        break;
      }
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const dockerVersion = await this.processRunner.run({
        command:
          (await resolveWindowsDockerCliPath(this.processRunner)) ?? "docker",
        args: ["version", "--format", "{{.Server.Version}}"],
        timeoutMs: 10_000,
      });

      if (dockerVersion.ok) {
        onProgress?.("Docker daemon responde correctamente.");
        return;
      }
      onProgress?.(
        `Docker daemon aún no responde (intento ${attempt + 1}/10). Esperando arranque...`,
      );

      await new Promise((resolve) => {
        setTimeout(resolve, 3_000);
      });
    }

    onProgress?.(
      "Docker daemon sigue sin responder tras los reintentos iniciales.",
    );
  }

  private async ensureWindowsDockerServiceRunning(): Promise<void> {
    const normalResult = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        [
          "$service = Get-Service -Name 'com.docker.service' -ErrorAction SilentlyContinue",
          "if ($null -eq $service) { exit 2 }",
          "sc.exe config com.docker.service start= auto | Out-Null",
          "sc.exe failure com.docker.service reset= 86400 actions= restart/5000/restart/15000/restart/30000 | Out-Null",
          "Set-Service -Name 'com.docker.service' -StartupType Automatic -ErrorAction Stop",
          "$service = Get-Service -Name 'com.docker.service'",
          "if ($service.Status -ne 'Running') { Start-Service -Name 'com.docker.service' -ErrorAction Stop }",
          "$service = Get-Service -Name 'com.docker.service'",
          "if ($service.Status -eq 'Running') { exit 0 }",
          "exit 1",
        ].join("; "),
      ],
      timeoutMs: 20_000,
    });

    if (normalResult.ok) {
      return;
    }

    const detail = `${normalResult.stderr}\n${normalResult.stdout}\n${normalResult.message}`;
    if (
      !/acceso denegado|access is denied|requires elevation|elevaci/i.test(
        detail,
      )
    ) {
      return;
    }

    await this.tryElevatedWindowsDockerServiceRepair();
  }

  private async tryElevatedWindowsDockerServiceRepair(): Promise<void> {
    const script = [
      "$ErrorActionPreference = 'Stop'",
      "sc.exe config com.docker.service start= auto | Out-Null",
      "sc.exe failure com.docker.service reset= 86400 actions= restart/5000/restart/15000/restart/30000 | Out-Null",
      "Set-Service -Name 'com.docker.service' -StartupType Automatic",
      "$service = Get-Service -Name 'com.docker.service'",
      "if ($service.Status -ne 'Running') { Start-Service -Name 'com.docker.service' }",
    ].join("; ");
    const encodedScript = Buffer.from(script, "utf16le").toString("base64");
    const elevateCommand = [
      `$argumentList = @('-NoProfile','-ExecutionPolicy','Bypass','-EncodedCommand','${encodedScript}')`,
      "$process = Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -PassThru -ArgumentList $argumentList",
      "if ($null -eq $process) { exit 1 }",
      "exit $process.ExitCode",
    ].join("; ");

    await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        elevateCommand,
      ],
      timeoutMs: 90_000,
    });
  }

  private async releaseKnownBusyPorts(): Promise<void> {
    for (const port of [80, 443]) {
      const status = await this.inspectPort(port);
      if (status.ownerPid) {
        await this.killPid(status.ownerPid);
      }
    }
  }

  private async killPid(pid: number): Promise<boolean> {
    if (pid <= 0 || pid === 4) {
      return false;
    }

    const result =
      process.platform === "win32"
        ? await this.processRunner.run({
            command: "powershell",
            args: [
              "-NoProfile",
              "-Command",
              `Stop-Process -Id ${pid} -Force -ErrorAction Stop`,
            ],
            timeoutMs: 10_000,
          })
        : await this.processRunner.run({
            command: "bash",
            args: ["-lc", `kill -15 ${pid} || true; kill -9 ${pid} || true`],
            timeoutMs: 10_000,
          });

    return result.ok;
  }

  private async tryEnableDefenderExclusions(
    runtimePath: string,
  ): Promise<void> {
    if (process.platform !== "win32") {
      return;
    }

    const escapedRuntime = runtimePath.replace(/'/g, "''");
    const escapedExe = process.execPath.replace(/'/g, "''");
    const command = [
      `$runtime='${escapedRuntime}'`,
      `$exe='${escapedExe}'`,
      "try {",
      "  Add-MpPreference -ExclusionPath $runtime -ErrorAction Stop | Out-Null",
      "  Add-MpPreference -ExclusionProcess $exe -ErrorAction Stop | Out-Null",
      "  Start-Process 'windowsdefender://appbrowser' | Out-Null",
      "  Write-Output 'OK'",
      "} catch {",
      "  Write-Output ('WARN|' + $_.Exception.Message)",
      "}",
    ].join("; ");

    await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", command],
      timeoutMs: 20_000,
    });
  }

  private async checkWsl2(): Promise<PreflightCheck> {
    const result = await this.processRunner.run({
      command: "wsl",
      args: ["-l", "-v"],
      timeoutMs: 15_000,
    });

    return {
      id: "wsl2",
      label: "WSL2",
      status: result.ok ? "OK" : "BLOCKER",
      detail: result.ok
        ? "WSL2 detectado correctamente."
        : result.stderr || "WSL2 no disponible en el sistema.",
      recommendation: result.ok
        ? undefined
        : "Instalar WSL2 (wsl --install) y reiniciar el equipo.",
      repairable: !result.ok,
      repairAction: !result.ok ? "auto-repair" : undefined,
      repairHint: !result.ok
        ? "Intentará instalar WSL2 automáticamente."
        : undefined,
    };
  }

  private async checkDockerDesktopInstalled(): Promise<PreflightCheck> {
    const exePath = await resolveWindowsDockerDesktopExePath(
      this.processRunner,
    );
    const installed = exePath !== null;
    const normalized = (exePath ?? "").replace(/\\/g, "/").toLowerCase();
    const looksLikeSystemProgramFiles =
      normalized.includes("/program files/") ||
      normalized.includes("/archivos de programa/");
    const detail = installed
      ? looksLikeSystemProgramFiles
        ? "Docker Desktop está instalado."
        : "Docker Desktop está instalado (ubicación por usuario o registro; instalación válida en Windows)."
      : "No se detectó el ejecutable de Docker Desktop (Program Files, perfil local ni registro de desinstalación).";

    return {
      id: "docker-desktop-installed",
      label: "Docker Desktop instalado",
      status: installed ? "OK" : "WARN",
      detail,
      recommendation: installed
        ? undefined
        : "Docker Desktop no está instalado. En modo Docker Engine/WSL2 headless no bloquea instalación si `docker` y `compose` funcionan.",
      repairable: false,
      repairAction: undefined,
      repairHint: undefined,
    };
  }

  private async checkDockerDesktopRunning(): Promise<PreflightCheck> {
    const command = [
      "$names = @('Docker Desktop','com.docker.backend')",
      "$running = $false",
      "foreach ($n in $names) {",
      "  if (Get-Process -Name $n -ErrorAction SilentlyContinue) { $running = $true; break }",
      "}",
      "if ($running) { Write-Output 'RUNNING' } else { Write-Output 'STOPPED' }",
    ].join(" ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", command],
      timeoutMs: 10_000,
    });
    const running = result.ok && result.stdout.trim() === "RUNNING";

    return {
      id: "docker-desktop-running",
      label: "Docker Desktop en ejecución",
      status: running ? "OK" : "WARN",
      detail: running
        ? "Docker Desktop está en ejecución."
        : "Docker Desktop no está iniciado. Se puede reparar automáticamente iniciando com.docker.service, Docker Desktop y el engine Linux de WSL.",
      recommendation: running
        ? undefined
        : "Pulsa Solucionar automáticamente para iniciar Docker Desktop/WSL antes de desplegar.",
      repairable: !running,
      repairAction: !running ? "auto-repair" : undefined,
      repairHint: !running
        ? "Intentará iniciar Docker Desktop y esperar a que responda el daemon."
        : undefined,
    };
  }

  private async ensureDockerLinuxEngineReady(
    onProgress?: (line: string) => void,
  ): Promise<void> {
    const dockerCommand =
      (await resolveWindowsDockerCliPath(this.processRunner)) ?? "docker";
    const initialProbe = await this.processRunner.run({
      command: dockerCommand,
      args: [
        "--context",
        "desktop-linux",
        "info",
        "--format",
        "{{.ServerVersion}}",
      ],
      timeoutMs: 15_000,
    });
    if (initialProbe.ok) {
      onProgress?.("El engine Linux de Docker ya estaba disponible.");
      return;
    }

    onProgress?.("Cambiando Docker al engine Linux (WSL)...");
    const dockerCliPath = "C:/Program Files/Docker/Docker/DockerCli.exe";
    await this.processRunner.run({
      command: dockerCliPath,
      args: ["-SwitchLinuxEngine"],
      timeoutMs: 45_000,
    });

    const deadline = Date.now() + 120_000;
    let attempt = 0;
    while (Date.now() < deadline) {
      attempt += 1;
      const probe = await this.processRunner.run({
        command: dockerCommand,
        args: [
          "--context",
          "desktop-linux",
          "info",
          "--format",
          "{{.ServerVersion}}",
        ],
        timeoutMs: 15_000,
      });
      if (probe.ok) {
        onProgress?.("Engine Linux de Docker listo y respondiendo.");
        return;
      }
      onProgress?.(
        `Esperando engine Linux de Docker (intento ${attempt}). WSL aún está iniciando...`,
      );
      await new Promise((resolve) => {
        setTimeout(resolve, 3_000);
      });
    }

    onProgress?.(
      "No se confirmó disponibilidad del engine Linux dentro del tiempo esperado.",
    );
  }
}
