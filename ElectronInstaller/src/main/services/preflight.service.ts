import fs from "node:fs/promises";
import path from "node:path";

import type {
  CommandResult,
  OperationResult,
  PortRepairPayload,
  PreflightCheck,
  PreflightReport,
} from "@shared/contracts";

import { OSDetectorService } from "./os-detector.service";
import { ProcessRunnerService } from "./process-runner.service";

/**
 * Expone la operación "evaluateDockerChecks" del instalador SmartEconomat.
 * @param {CommandResult} dockerVersion - Entrada esperada por la función.
 * @param {CommandResult} composeVersion - Entrada esperada por la función.
 * @returns {PreflightCheck[]} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
export function evaluateDockerChecks(
  dockerVersion: CommandResult,
  composeVersion: CommandResult,
): PreflightCheck[] {
  const dockerCheck: PreflightCheck = {
    id: "docker-engine",
    label: "Docker Engine",
    status: dockerVersion.ok ? "OK" : "BLOCKER",
    detail: dockerVersion.ok ? dockerVersion.stdout : dockerVersion.stderr,
    recommendation: dockerVersion.ok
      ? undefined
      : "Instalar/iniciar Docker Desktop o Docker Engine.",
  };

  const composeCheck: PreflightCheck = {
    id: "docker-compose",
    label: "Docker Compose",
    status: composeVersion.ok ? "OK" : "BLOCKER",
    detail: composeVersion.ok ? composeVersion.stdout : composeVersion.stderr,
    recommendation: composeVersion.ok
      ? undefined
      : "Habilitar plugin docker compose en el host.",
  };

  return [dockerCheck, composeCheck];
}

/**
 * Expone la operación "downgradeWindowsDockerDesktopChecks" del instalador SmartEconomat.
 * @param {PreflightCheck[]} checks - Entrada esperada por la función.
 * @param {CommandResult} dockerVersion - Entrada esperada por la función.
 * @param {CommandResult} composeVersion - Entrada esperada por la función.
 * @param {NodeJS.Platform} platform - Entrada esperada por la función.
 * @returns {PreflightCheck[]} Resultado efectivo tras la llamada (puede incluir Promesas).
 */
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

interface PortInspectionResult {
  status: PreflightCheck["status"];
  detail: string;
  recommendation?: string;
  ownerPid?: number;
  ownerProcessName?: string;
}

/** Servicio del proceso principal: PreflightService. */
export class PreflightService {
  /**
   * Construye la instancia del servicio.
   * @param {OSDetectorService} osDetector - Entrada esperada por la función.
   * @param {ProcessRunnerService} processRunner - Entrada esperada por la función.
   */
  constructor(
    private readonly osDetector = new OSDetectorService(),
    private readonly processRunner = new ProcessRunnerService(),
  ) {}

  /**
   * Expone la operación "run" del instalador SmartEconomat.
   * @param {string} runtimePath - Entrada esperada por la función.
   * @returns {Promise<OperationResult<PreflightReport>>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
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

  /**
   * Expone la operación "runAutoRepair" del instalador SmartEconomat.
   * @param {string} runtimePath - Entrada esperada por la función.
   * @returns {Promise<OperationResult<PreflightReport>>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async runAutoRepair(
    runtimePath: string,
  ): Promise<OperationResult<PreflightReport>> {
    if (process.platform === "win32") {
      await this.repairWindowsDependencies(runtimePath);
    }

    await this.releaseKnownBusyPorts();
    return this.run(runtimePath);
  }

  /**
   * Expone la operación "releaseBusyPort" del instalador SmartEconomat.
   * @param {PortRepairPayload} payload - Entrada esperada por la función.
   * @returns {Promise<OperationResult<PreflightReport>>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
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
      return {
        id: "system-write",
        label: "Permisos de escritura",
        status: "BLOCKER",
        detail: message,
        recommendation: "Seleccionar una carpeta con permisos de escritura.",
      };
    }
  }

  private async dockerChecks(runtimePath: string): Promise<PreflightCheck[]> {
    const checks: PreflightCheck[] = [];
    const dockerDesktopChecks: PreflightCheck[] = [];

    if (process.platform === "win32") {
      dockerDesktopChecks.push(await this.checkWsl2());
      dockerDesktopChecks.push(await this.checkDockerDesktopInstalled());
      dockerDesktopChecks.push(await this.checkDockerDesktopRunning());
    }

    const dockerVersion = await this.processRunner.run({
      command: "docker",
      args: ["version", "--format", "{{.Server.Version}}"],
      timeoutMs: 15_000,
    });

    const composeVersion = await this.processRunner.run({
      command: "docker",
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
        "Intentará instalar/iniciar Docker Desktop y revalidar automáticamente.";
    }

    if (!composeVersion.ok && dockerComposeCheck) {
      dockerComposeCheck.repairable = process.platform === "win32";
      dockerComposeCheck.repairAction = "auto-repair";
      dockerComposeCheck.repairHint =
        "Intentará habilitar Docker Compose v2 tras iniciar Docker Desktop.";
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

    return [...checks, ...dockerChecks];
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
      "$pid = $conn.OwningProcess",
      "$name = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName",
      "if ([string]::IsNullOrWhiteSpace($name)) { $name = 'desconocido' }",
      "Write-Output ('BUSY|' + $pid + '|' + $name)",
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

  private async repairWindowsDependencies(runtimePath: string): Promise<void> {
    await this.ensureWingetAvailable();
    await this.ensureWsl2Installed();
    await this.ensureDockerDesktopInstalled();
    await this.ensureDockerDesktopRunning();
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

  private async ensureDockerDesktopInstalled(): Promise<void> {
    const check = await this.checkDockerDesktopInstalled();
    if (check.status === "OK") {
      return;
    }

    await this.processRunner.run({
      command: "winget",
      args: [
        "install",
        "-e",
        "--id",
        "Docker.DockerDesktop",
        "--accept-package-agreements",
        "--accept-source-agreements",
        "--silent",
      ],
      timeoutMs: 240_000,
    });
  }

  private async ensureDockerDesktopRunning(): Promise<void> {
    const running = await this.checkDockerDesktopRunning();
    if (running.status === "OK") {
      return;
    }

    const candidatePaths = [
      "C:/Program Files/Docker/Docker/Docker Desktop.exe",
      "C:/Program Files/Docker/Docker/Docker Desktop",
    ];

    for (const executablePath of candidatePaths) {
      const start = await this.processRunner.run({
        command: "powershell",
        args: [
          "-NoProfile",
          "-Command",
          `if (Test-Path '${executablePath}') { Start-Process -FilePath '${executablePath}'; exit 0 } else { exit 1 }`,
        ],
        timeoutMs: 15_000,
      });

      if (start.ok) {
        break;
      }
    }

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const dockerVersion = await this.processRunner.run({
        command: "docker",
        args: ["version", "--format", "{{.Server.Version}}"],
        timeoutMs: 10_000,
      });

      if (dockerVersion.ok) {
        return;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 3_000);
      });
    }
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
    const command = [
      "$paths = @(",
      "  'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',",
      "  'C:\\Program Files\\Docker\\Docker\\Docker Desktop'",
      ")",
      "$exists = $false",
      "foreach ($path in $paths) { if (Test-Path $path) { $exists = $true; break } }",
      "if ($exists) { Write-Output 'INSTALLED' } else { Write-Output 'MISSING' }",
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", command],
      timeoutMs: 10_000,
    });
    const installed = result.ok && result.stdout.trim() === "INSTALLED";

    return {
      id: "docker-desktop-installed",
      label: "Docker Desktop instalado",
      status: installed ? "OK" : "BLOCKER",
      detail: installed
        ? "Docker Desktop está instalado."
        : "No se encontró Docker Desktop en Program Files.",
      recommendation: installed
        ? undefined
        : "Instalar Docker Desktop para habilitar Docker Engine y Compose.",
      repairable: !installed,
      repairAction: !installed ? "auto-repair" : undefined,
      repairHint: !installed
        ? "Intentará instalar Docker Desktop con winget."
        : undefined,
    };
  }

  private async checkDockerDesktopRunning(): Promise<PreflightCheck> {
    const command =
      "if (Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue) { Write-Output 'RUNNING' } else { Write-Output 'STOPPED' }";

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", command],
      timeoutMs: 10_000,
    });
    const running = result.ok && result.stdout.trim() === "RUNNING";

    return {
      id: "docker-desktop-running",
      label: "Docker Desktop en ejecución",
      status: running ? "OK" : "BLOCKER",
      detail: running
        ? "Docker Desktop está en ejecución."
        : "Docker Desktop no está iniciado.",
      recommendation: running
        ? undefined
        : "Iniciar Docker Desktop y esperar a que Engine esté operativo.",
      repairable: !running,
      repairAction: !running ? "auto-repair" : undefined,
      repairHint: !running
        ? "Intentará iniciar Docker Desktop automáticamente."
        : undefined,
    };
  }
}
