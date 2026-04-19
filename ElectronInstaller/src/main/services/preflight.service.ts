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

interface DockerPortContainer {
  id: string;
  name: string;
  composeProject: string;
}

interface DockerDesktopInstallProbe {
  installed: boolean;
  uncertain: boolean;
  detail: string;
}

interface DockerDesktopRunningProbe {
  running: boolean;
  uncertain: boolean;
  detail: string;
}

export class PreflightService {
  private readonly installerComposeProjects = new Set([
    "smarteconomat-prod",
    "smarteconomat",
  ]);

  private onLog: (message: string) => void = () => {
    // No-op by default
  };

  constructor(
    private readonly osDetector = new OSDetectorService(),
    private readonly processRunner = new ProcessRunnerService(),
  ) {}

  setLogCallback(callback: (message: string) => void): void {
    this.onLog = callback;
  }

  private log(message: string): void {
    this.onLog(message);
  }

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
  ): Promise<OperationResult<PreflightReport>> {
    this.log("[PREFLIGHT-REPAIR] Iniciando reparación automática...");

    if (process.platform === "win32") {
      this.log(
        "[PREFLIGHT-REPAIR] Detectado Windows. Reparando dependencias...",
      );
      await this.repairWindowsDependencies(runtimePath);
    }

    this.log("[PREFLIGHT-REPAIR] Limpiando residuos de runtime...");
    await this.cleanupRuntimeResidues(runtimePath);

    this.log("[PREFLIGHT-REPAIR] Liberando puertos conocidos bloqueados...");
    await this.releaseKnownBusyPorts();

    this.log(
      "[PREFLIGHT-REPAIR] Reparación completada. Revalidando preflight...",
    );
    return this.run(runtimePath);
  }

  async releaseBusyPort(
    payload: PortRepairPayload,
  ): Promise<OperationResult<PreflightReport>> {
    const owner = await this.inspectPort(payload.port);
    if (owner.status === "OK") {
      return this.run(payload.runtimePath);
    }

    // Primero intentamos liberar el puerto cerrando forzadamente
    // contenedores gestionados por SmartEconomat que publiquen ese puerto.
    const dockerReleased = await this.tryReleasePortByInstallerDockerContainers(
      payload.port,
    );

    if (dockerReleased) {
      const verification = await this.inspectPort(payload.port);
      if (verification.status === "OK") {
        return this.run(payload.runtimePath);
      }
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

    const windowsAdminCheck =
      process.platform === "win32" ? [await this.buildWindowsAdminCheck()] : [];

    return [memoryCheck, diskCheck, writeCheck, ...windowsAdminCheck];
  }

  private async buildWindowsAdminCheck(): Promise<PreflightCheck> {
    const isAdmin = await this.isRunningAsAdministrator();

    return {
      id: "windows-admin",
      label: "Permisos de administrador",
      status: isAdmin ? "OK" : "WARN",
      detail: isAdmin
        ? "La aplicación se está ejecutando con permisos de administrador."
        : "La aplicación NO se está ejecutando como administrador.",
      recommendation: isAdmin
        ? undefined
        : "Para auto-reparar WSL2, Hyper-V, Docker y Defender, inicia SmartEconomat como Administrador.",
      repairable: false,
    };
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
        repairable: status === "BLOCKER",
        repairAction: status === "BLOCKER" ? "auto-repair" : undefined,
        repairHint:
          status === "BLOCKER"
            ? "Intentará eliminar residuos temporales, liberar puertos y revalidar el espacio disponible."
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

  private async cleanupRuntimeResidues(runtimePath: string): Promise<void> {
    const residuePaths = [
      path.join(runtimePath, "logs"),
      path.join(runtimePath, "log"),
      path.join(runtimePath, "diagnostics"),
      path.join(runtimePath, "diagnostic"),
      path.join(runtimePath, "tmp"),
      path.join(runtimePath, "temp"),
      path.join(runtimePath, "cache"),
      path.join(runtimePath, ".write-check.tmp"),
    ];

    this.log("[CLEANUP] Eliminando residuos de instalaciones anteriores...");

    await Promise.all(
      residuePaths.map(async (candidatePath) => {
        try {
          await fs.rm(candidatePath, { recursive: true, force: true });
          this.log(`[CLEANUP] ✓ Eliminado: ${path.basename(candidatePath)}`);
        } catch {
          // Ignore cleanup errors; the main repair path can continue.
        }
      }),
    );

    this.log("[CLEANUP] Limpieza de residuos completada.");
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

    const dockerVersion = await this.runWithTimeoutRetry({
      command: "docker",
      args: ["version", "--format", "{{.Server.Version}}"],
      timeoutMs: 20_000,
    });

    const composeVersion = await this.runWithTimeoutRetry({
      command: "docker",
      args: ["compose", "version"],
      timeoutMs: 20_000,
    });

    const dockerChecks = evaluateDockerChecks(dockerVersion, composeVersion);
    const dockerEngineCheck = dockerChecks[0];
    const dockerComposeCheck = dockerChecks[1];

    if (!dockerVersion.ok && dockerEngineCheck) {
      const isTimeout = /timed out/i.test(dockerVersion.message);
      if (isTimeout) {
        dockerEngineCheck.status = "WARN";
        dockerEngineCheck.detail =
          dockerEngineCheck.detail ||
          "Docker Engine no respondió a tiempo, posible falso negativo transitorio.";
        dockerEngineCheck.recommendation =
          "Reintenta preflight. Si Docker está operativo, este timeout no debe bloquear instalación.";
      } else {
        dockerEngineCheck.repairable = process.platform === "win32";
        dockerEngineCheck.repairAction = "auto-repair";
        dockerEngineCheck.repairHint =
          "Intentará instalar/iniciar Docker Desktop y revalidar automáticamente.";
      }
    }

    if (!composeVersion.ok && dockerComposeCheck) {
      const isTimeout = /timed out/i.test(composeVersion.message);
      if (isTimeout) {
        dockerComposeCheck.status = "WARN";
        dockerComposeCheck.detail =
          dockerComposeCheck.detail ||
          "Docker Compose no respondió a tiempo, posible falso negativo transitorio.";
        dockerComposeCheck.recommendation =
          "Reintenta preflight. Si Docker responde, este timeout no debería bloquear.";
      } else {
        dockerComposeCheck.repairable = process.platform === "win32";
        dockerComposeCheck.repairAction = "auto-repair";
        dockerComposeCheck.repairHint =
          "Intentará habilitar Docker Compose v2 tras iniciar Docker Desktop.";
      }
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

  private async runWithTimeoutRetry(input: {
    command: string;
    args: string[];
    timeoutMs: number;
  }): Promise<CommandResult> {
    const first = await this.processRunner.run({
      command: input.command,
      args: input.args,
      timeoutMs: input.timeoutMs,
    });

    if (first.ok || !/timed out/i.test(first.message)) {
      return first;
    }

    return this.processRunner.run({
      command: input.command,
      args: input.args,
      timeoutMs: input.timeoutMs + 10_000,
    });
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
    const psNetTcpCommand = [
      `$conn = Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue | Select-Object -First 1`,
      "if ($null -eq $conn) { Write-Output 'FREE'; exit 0 }",
      "$pid = $conn.OwningProcess",
      "$name = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName",
      "if ([string]::IsNullOrWhiteSpace($name)) { $name = 'desconocido' }",
      "Write-Output ('BUSY|' + $pid + '|' + $name)",
    ].join("; ");

    const psNetstatFallback = [
      "$line = netstat -ano -p tcp | Select-String -Pattern (':" +
        port +
        "\\s') | ForEach-Object { $_.Line } | Where-Object { $_ -match 'LISTENING' } | Select-Object -First 1",
      "if ([string]::IsNullOrWhiteSpace($line)) { Write-Output 'FREE'; exit 0 }",
      "$parts = ($line -replace '\\s+', ' ').Trim().Split(' ')",
      "$pid = $parts[$parts.Length - 1]",
      "$name = (Get-Process -Id $pid -ErrorAction SilentlyContinue).ProcessName",
      "if ([string]::IsNullOrWhiteSpace($name)) { $name = 'desconocido' }",
      "Write-Output ('BUSY|' + $pid + '|' + $name)",
    ].join("; ");

    const probes = [
      await this.processRunner.run({
        command: "powershell",
        args: ["-NoProfile", "-Command", psNetTcpCommand],
        timeoutMs: 20_000,
      }),
      await this.processRunner.run({
        command: "powershell",
        args: ["-NoProfile", "-Command", psNetstatFallback],
        timeoutMs: 20_000,
      }),
    ];

    const firstSuccess = probes.find((probe) => probe.ok);
    if (!firstSuccess) {
      const probeDetail = probes
        .map((probe) => probe.stderr || probe.message)
        .filter((detail) => detail.trim().length > 0)
        .join(" | ");

      return {
        status: "WARN",
        detail: `No se pudo inspeccionar el puerto ${port}: ${probeDetail || "sin detalle"}`,
        recommendation:
          "Ejecutar como administrador: Get-NetTCPConnection -State Listen -LocalPort " +
          `${port} | Select-Object OwningProcess, LocalAddress, LocalPort`,
      };
    }

    const output = firstSuccess.stdout.trim();
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
            "Genera instalador firmado (certificado de confianza/EV) con build:win:release o firma posterior y verifica firma antes de distribuir.",
          repairable: true,
          repairAction: "auto-repair",
          repairHint:
            "Intentará añadir exclusiones de Defender para desarrollo local, pero en producción debes firmar el instalador para evitar bloqueos.",
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
    this.log("[WINDOWS-REPAIR] Reparando dependencias de Windows...");

    const runningAsAdmin = await this.isRunningAsAdministrator();
    if (!runningAsAdmin) {
      this.log(
        "[WINDOWS-REPAIR] ⚠️  La app no está en modo Administrador. La activación de WSL2/VirtualMachinePlatform puede fallar por permisos.",
      );
      this.log(
        "[WINDOWS-REPAIR] ⚠️  Recomendación: cerrar SmartEconomat y volver a abrirla con 'Ejecutar como administrador'.",
      );
    }

    try {
      this.log("[WINDOWS-REPAIR] 1/5 Verificando winget...");
      await this.ensureWingetAvailable();
      this.log("[WINDOWS-REPAIR] ✓ Winget disponible.");
    } catch (error) {
      this.log(
        `[WINDOWS-REPAIR] ⚠️  Winget no disponible: ${error instanceof Error ? error.message : "desconocido"}`,
      );
    }

    try {
      this.log("[WINDOWS-REPAIR] 2/5 Verificando/instalando WSL2...");
      await this.ensureWsl2Installed();
      this.log("[WINDOWS-REPAIR] ✓ WSL2 listo.");
    } catch (error) {
      this.log(
        `[WINDOWS-REPAIR] ⚠️  No se pudo instalar WSL2: ${error instanceof Error ? error.message : "desconocido"}`,
      );
    }

    try {
      this.log("[WINDOWS-REPAIR] 3/5 Verificando/instalando Docker Desktop...");
      await this.ensureDockerDesktopInstalled();
      this.log("[WINDOWS-REPAIR] ✓ Docker Desktop instalado.");
    } catch (error) {
      this.log(
        `[WINDOWS-REPAIR] ⚠️  No se pudo instalar Docker Desktop: ${error instanceof Error ? error.message : "desconocido"}`,
      );
    }

    try {
      this.log("[WINDOWS-REPAIR] 4/5 Iniciando Docker Desktop...");
      await this.ensureDockerDesktopRunning();
      this.log("[WINDOWS-REPAIR] ✓ Docker Desktop en ejecución.");
    } catch (error) {
      this.log(
        `[WINDOWS-REPAIR] ⚠️  No se pudo iniciar Docker Desktop: ${error instanceof Error ? error.message : "desconocido"}`,
      );
    }

    try {
      this.log("[WINDOWS-REPAIR] 5/5 Configurando exclusiones de Defender...");
      await this.tryEnableDefenderExclusions(runtimePath);
      this.log("[WINDOWS-REPAIR] ✓ Exclusiones de Defender configuradas.");
    } catch (error) {
      this.log(
        `[WINDOWS-REPAIR] ⚠️  No se pudieron configurar las exclusiones: ${error instanceof Error ? error.message : "desconocido"}`,
      );
    }

    this.log("[WINDOWS-REPAIR] Reparación de dependencias completada.");
  }

  private async ensureWingetAvailable(): Promise<void> {
    const result = await this.processRunner.run({
      command: "winget",
      args: ["--version"],
      timeoutMs: 10_000,
    });

    if (!result.ok) {
      throw this.buildWindowsCommandError("verificar winget", result);
    }
  }

  private async ensureWsl2Installed(): Promise<void> {
    if (!(await this.isRunningAsAdministrator())) {
      throw new Error(
        "Permisos insuficientes para activar WSL2. Ejecuta SmartEconomat como Administrador y vuelve a lanzar Auto-repair.",
      );
    }

    const check = await this.processRunner.run({
      command: "wsl",
      args: ["-l", "-v"],
      timeoutMs: 15_000,
    });

    const status = await this.processRunner.run({
      command: "wsl",
      args: ["--status"],
      timeoutMs: 20_000,
    });

    if (this.isWsl2Ready(status, check)) {
      return;
    }

    this.log(
      "[WINDOWS-REPAIR] [WSL2] Habilitando característica Microsoft-Windows-Subsystem-Linux...",
    );
    const wslFeature = await this.enableWindowsOptionalFeature(
      "Microsoft-Windows-Subsystem-Linux",
    );

    this.log(
      "[WINDOWS-REPAIR] [WSL2] Habilitando característica VirtualMachinePlatform...",
    );
    const vmPlatformFeature = await this.enableWindowsOptionalFeature(
      "VirtualMachinePlatform",
    );

    this.log(
      "[WINDOWS-REPAIR] [WSL2] Configurando hypervisorlaunchtype=Auto...",
    );
    await this.ensureHypervisorLaunchTypeAuto();

    this.log(
      "[WINDOWS-REPAIR] [WSL2] Ejecutando instalación base de WSL sin distro...",
    );
    const installResult = await this.processRunner.run({
      command: "wsl",
      args: ["--install", "--no-distribution"],
      timeoutMs: 120_000,
    });

    if (!this.isSuccessfulWindowsCommand(installResult)) {
      throw this.buildWindowsCommandError(
        "instalar WSL2 (wsl --install)",
        installResult,
      );
    }

    this.log(
      "[WINDOWS-REPAIR] [WSL2] Estableciendo versión por defecto WSL2...",
    );
    const setDefaultVersionResult = await this.processRunner.run({
      command: "wsl",
      args: ["--set-default-version", "2"],
      timeoutMs: 30_000,
    });

    if (!this.isSuccessfulWindowsCommand(setDefaultVersionResult)) {
      throw this.buildWindowsCommandError(
        "establecer WSL2 por defecto",
        setDefaultVersionResult,
      );
    }

    this.log("[WINDOWS-REPAIR] [WSL2] Actualizando componentes de WSL...");
    const updateResult = await this.processRunner.run({
      command: "wsl",
      args: ["--update"],
      timeoutMs: 120_000,
    });

    if (!this.isSuccessfulWindowsCommand(updateResult)) {
      this.log(
        `[WINDOWS-REPAIR] [WSL2] ⚠️  wsl --update falló: ${updateResult.stderr || updateResult.message}`,
      );
    }

    const postInstallCheck = await this.processRunner.run({
      command: "wsl",
      args: ["-l", "-v"],
      timeoutMs: 20_000,
    });

    const postInstallStatus = await this.processRunner.run({
      command: "wsl",
      args: ["--status"],
      timeoutMs: 20_000,
    });

    if (this.isWsl2Ready(postInstallStatus, postInstallCheck)) {
      return;
    }

    const rebootRequired =
      wslFeature.rebootRequired || vmPlatformFeature.rebootRequired;
    const combinedOutput =
      `${postInstallStatus.stdout} ${postInstallStatus.stderr} ${postInstallCheck.stdout} ${postInstallCheck.stderr}`.toLowerCase();

    if (
      rebootRequired ||
      /reinici|restart required|reboot|plataforma de máquina virtual|virtual machine platform|hyper-v|hypervisor/i.test(
        combinedOutput,
      )
    ) {
      throw new Error(
        "WSL2 requiere reiniciar Windows para finalizar la activación de características. Reinicia el equipo y ejecuta de nuevo el preflight.",
      );
    }

    throw new Error(
      postInstallStatus.stderr ||
        postInstallCheck.stderr ||
        "No se pudo dejar WSL2 operativo automáticamente.",
    );
  }

  private async enableWindowsOptionalFeature(featureName: string): Promise<{
    rebootRequired: boolean;
  }> {
    const result = await this.processRunner.run({
      command: "dism.exe",
      args: [
        "/online",
        "/enable-feature",
        `/featurename:${featureName}`,
        "/all",
        "/norestart",
      ],
      timeoutMs: 120_000,
    });

    if (!this.isSuccessfulWindowsCommand(result)) {
      throw this.buildWindowsCommandError(
        `activar característica ${featureName}`,
        result,
      );
    }

    const output = `${result.stdout} ${result.stderr}`.toLowerCase();
    const rebootRequired =
      result.code === 3010 ||
      /reinici|restart required|reboot required|restart needed/i.test(output);

    return { rebootRequired };
  }

  private async ensureHypervisorLaunchTypeAuto(): Promise<void> {
    const result = await this.processRunner.run({
      command: "bcdedit",
      args: ["/set", "hypervisorlaunchtype", "auto"],
      timeoutMs: 20_000,
    });

    if (!this.isSuccessfulWindowsCommand(result)) {
      throw this.buildWindowsCommandError(
        "configurar hypervisorlaunchtype=auto",
        result,
      );
    }
  }

  private async isRunningAsAdministrator(): Promise<boolean> {
    if (process.platform !== "win32") {
      return true;
    }

    const result = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        "[bool](([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator))",
      ],
      timeoutMs: 10_000,
    });

    if (!result.ok) {
      return false;
    }

    return result.stdout.trim().toLowerCase() === "true";
  }

  private buildWindowsCommandError(
    action: string,
    result: CommandResult,
  ): Error {
    const baseMessage =
      result.stderr.trim() || result.stdout.trim() || result.message;

    if (this.isWindowsElevationFailure(result)) {
      return new Error(
        `No se pudo ${action} por falta de permisos de administrador. Cierra SmartEconomat, ábrela con 'Ejecutar como administrador' y reintenta Auto-repair. Detalle: ${baseMessage}`,
      );
    }

    return new Error(`No se pudo ${action}. Detalle: ${baseMessage}`);
  }

  private isWindowsElevationFailure(result: CommandResult): boolean {
    const detail =
      `${result.stderr} ${result.stdout} ${result.message}`.toLowerCase();

    return (
      detail.includes("requires elevation") ||
      detail.includes("elevation required") ||
      detail.includes("acceso denegado") ||
      detail.includes("access is denied") ||
      detail.includes("administrador") ||
      detail.includes("admin") ||
      detail.includes("0x80070005") ||
      detail.includes("error 740")
    );
  }

  private isSuccessfulWindowsCommand(result: CommandResult): boolean {
    return result.ok || result.code === 3010;
  }

  private isWsl2Ready(
    statusResult: CommandResult,
    listResult: CommandResult,
  ): boolean {
    if (!listResult.ok) {
      return false;
    }

    const mergedStatus =
      `${statusResult.stdout} ${statusResult.stderr} ${listResult.stdout} ${listResult.stderr}`.toLowerCase();

    return !/wsl2 no es compatible|not compatible|virtual machine platform|plataforma de máquina virtual|debe habilitarse|must be enabled|hyper-v|hypervisorlaunchtype/i.test(
      mergedStatus,
    );
  }

  private buildWsl2FailureDetail(
    statusResult: CommandResult,
    listResult: CommandResult,
  ): string {
    const mergedStatus =
      `${statusResult.stdout} ${statusResult.stderr} ${listResult.stdout} ${listResult.stderr}`.toLowerCase();

    if (
      /virtual machine platform|plataforma de máquina virtual|must be enabled|debe habilitarse/i.test(
        mergedStatus,
      )
    ) {
      return "WSL2 no está operativo porque VirtualMachinePlatform/WSL no están habilitados o falta reinicio del sistema.";
    }

    if (/hyper-v|hypervisorlaunchtype/i.test(mergedStatus)) {
      return "WSL2 requiere Hyper-V/hypervisorlaunchtype en modo auto y reinicio de Windows.";
    }

    if (/not compatible|no es compatible/i.test(mergedStatus)) {
      return "WSL2 no es compatible con la configuración actual del sistema o virtualización desactivada en BIOS/UEFI.";
    }

    if (/0x8007019e|0x80370102/.test(mergedStatus)) {
      return "WSL2 no está inicializado correctamente. Activa características de Windows para WSL2 y reinicia el equipo.";
    }

    return "WSL2 no disponible en el sistema. Activa Microsoft-Windows-Subsystem-Linux y VirtualMachinePlatform, reinicia y reintenta.";
  }

  private async ensureDockerDesktopInstalled(): Promise<void> {
    const probe = await this.probeDockerDesktopInstalled();
    if (probe.installed || probe.uncertain) {
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
    const runningProbe = await this.probeDockerDesktopRunning();
    if (runningProbe.running || runningProbe.uncertain) {
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
      const recheck = await this.probeDockerDesktopRunning();
      if (recheck.running) {
        return;
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 3_000);
      });
    }
  }

  private async releaseKnownBusyPorts(): Promise<void> {
    this.log("[PORTS] Inspeccionando puertos 80 (HTTP) y 443 (HTTPS)...");

    for (const port of [80, 443]) {
      const status = await this.inspectPort(port);
      if (status.status === "OK") {
        this.log(`[PORTS] ✓ Puerto ${port} disponible.`);
        continue;
      }

      this.log(
        `[PORTS] ⚠️  Puerto ${port} ocupado por ${status.ownerProcessName || "desconocido"} (PID: ${status.ownerPid}).`,
      );

      const dockerReleased =
        await this.tryReleasePortByInstallerDockerContainers(port);
      if (dockerReleased) {
        this.log(`[PORTS] ✓ Contenedor Docker liberado del puerto ${port}.`);
        const verification = await this.inspectPort(port);
        if (verification.status === "OK") {
          continue;
        }
      }

      if (!status.ownerPid) {
        this.log(
          `[PORTS] ⚠️  No se pudo identificar el PID del puerto ${port}.`,
        );
        continue;
      }

      this.log(
        `[PORTS] Cerrando proceso ${status.ownerPid} para liberar puerto ${port}...`,
      );
      const killed = await this.killPid(status.ownerPid);
      if (killed) {
        this.log(
          `[PORTS] ✓ Proceso ${status.ownerPid} cerrado. Puerto ${port} debe estar libre.`,
        );
      } else {
        this.log(
          `[PORTS] ⚠️  No se pudo cerrar el proceso ${status.ownerPid}. Puede requerir intervención manual.`,
        );
      }
    }

    this.log("[PORTS] Inspección de puertos completada.");
  }

  private isDockerOwnerProcess(processName: string): boolean {
    const normalized = processName.trim().toLowerCase();
    return (
      normalized === "docker" ||
      normalized === "dockerd" ||
      normalized === "docker desktop" ||
      normalized === "com.docker.backend" ||
      normalized === "com.docker.service"
    );
  }

  private async tryReleasePortByInstallerDockerContainers(
    port: number,
  ): Promise<boolean> {
    const candidates =
      await this.listInstallerDockerContainersByPublishedPort(port);
    if (candidates.length === 0) {
      return false;
    }

    const ids = candidates.map((container) => container.id);
    const forceRemoveResult = await this.processRunner.run({
      command: "docker",
      args: ["rm", "-f", ...ids],
      timeoutMs: 45_000,
    });

    return forceRemoveResult.ok;
  }

  private async listInstallerDockerContainersByPublishedPort(
    port: number,
  ): Promise<DockerPortContainer[]> {
    const result = await this.processRunner.run({
      command: "docker",
      args: [
        "ps",
        "--filter",
        `publish=${port}`,
        "--format",
        '{{.ID}}|{{.Names}}|{{.Label "com.docker.compose.project"}}',
      ],
      timeoutMs: 15_000,
    });

    if (!result.ok) {
      return [];
    }

    const containers: DockerPortContainer[] = [];
    for (const line of result.stdout.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        continue;
      }

      const [idRaw = "", nameRaw = "", composeProjectRaw = ""] =
        trimmed.split("|");
      const id = idRaw.trim();
      const name = nameRaw.trim();
      const composeProject = composeProjectRaw.trim();

      if (!id || !name) {
        continue;
      }

      if (this.isInstallerManagedContainer(name, composeProject)) {
        containers.push({ id, name, composeProject });
      }
    }

    return containers;
  }

  private isInstallerManagedContainer(
    containerName: string,
    composeProject: string,
  ): boolean {
    const normalizedName = containerName.trim().toLowerCase();
    const normalizedProject = composeProject.trim().toLowerCase();

    return (
      this.installerComposeProjects.has(normalizedProject) ||
      normalizedName.startsWith("smarteconomat-") ||
      normalizedName.startsWith("smarteconomat_")
    );
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

    const statusResult = await this.processRunner.run({
      command: "wsl",
      args: ["--status"],
      timeoutMs: 15_000,
    });

    const ready = this.isWsl2Ready(statusResult, result);
    const detail = ready
      ? "WSL2 detectado correctamente."
      : this.buildWsl2FailureDetail(statusResult, result);
    const recommendation = ready
      ? undefined
      : "Activa las características de Windows 'Microsoft-Windows-Subsystem-Linux' y 'VirtualMachinePlatform', reinicia el equipo y vuelve a ejecutar preflight.";

    return {
      id: "wsl2",
      label: "WSL2",
      status: ready ? "OK" : "BLOCKER",
      detail,
      recommendation,
      repairable: !ready,
      repairAction: !ready ? "auto-repair" : undefined,
      repairHint: !ready
        ? "Intentará instalar WSL2 automáticamente."
        : undefined,
    };
  }

  private async checkDockerDesktopInstalled(): Promise<PreflightCheck> {
    const probe = await this.probeDockerDesktopInstalled();

    return {
      id: "docker-desktop-installed",
      label: "Docker Desktop instalado",
      status: probe.installed ? "OK" : probe.uncertain ? "WARN" : "BLOCKER",
      detail: probe.detail,
      recommendation: probe.installed
        ? undefined
        : probe.uncertain
          ? "No se pudo confirmar al 100%. Reintenta preflight o verifica Docker Desktop manualmente."
          : "Instalar Docker Desktop para habilitar Docker Engine y Compose.",
      repairable: !probe.installed && !probe.uncertain,
      repairAction:
        !probe.installed && !probe.uncertain ? "auto-repair" : undefined,
      repairHint:
        !probe.installed && !probe.uncertain
          ? "Intentará instalar Docker Desktop con winget."
          : undefined,
    };
  }

  private async checkDockerDesktopRunning(): Promise<PreflightCheck> {
    const probe = await this.probeDockerDesktopRunning();

    return {
      id: "docker-desktop-running",
      label: "Docker Desktop en ejecución",
      status: probe.running ? "OK" : probe.uncertain ? "WARN" : "BLOCKER",
      detail: probe.detail,
      recommendation: probe.running
        ? undefined
        : probe.uncertain
          ? "No se pudo confirmar el estado del engine. Si Docker está levantado, continúa; si no, inicia Docker Desktop y reintenta."
          : "Iniciar Docker Desktop y esperar a que Engine esté operativo.",
      repairable: !probe.running && !probe.uncertain,
      repairAction:
        !probe.running && !probe.uncertain ? "auto-repair" : undefined,
      repairHint:
        !probe.running && !probe.uncertain
          ? "Intentará iniciar Docker Desktop automáticamente."
          : undefined,
    };
  }

  private async probeDockerDesktopInstalled(): Promise<DockerDesktopInstallProbe> {
    const pathProbe = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        [
          "$paths = @(",
          "  'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe',",
          "  'C:\\Program Files\\Docker\\Docker\\Docker Desktop'",
          ")",
          "$exists = $false",
          "foreach ($p in $paths) { if (Test-Path -LiteralPath $p) { $exists = $true; break } }",
          "if ($exists) { Write-Output 'INSTALLED_PATH' } else { Write-Output 'MISSING_PATH' }",
        ].join("; "),
      ],
      timeoutMs: 8_000,
    });

    if (pathProbe.ok && pathProbe.stdout.trim() === "INSTALLED_PATH") {
      return {
        installed: true,
        uncertain: false,
        detail: "Docker Desktop está instalado (detectado por ruta local).",
      };
    }

    const dockerCliProbe = await this.processRunner.run({
      command: "docker",
      args: ["--version"],
      timeoutMs: 12_000,
    });

    if (dockerCliProbe.ok) {
      return {
        installed: true,
        uncertain: false,
        detail: "Docker CLI responde correctamente en este sistema.",
      };
    }

    const command = [
      "$candidateRoots = @($env:ProgramFiles, $env:ProgramW6432) | Where-Object { -not [string]::IsNullOrWhiteSpace($_) } | Select-Object -Unique",
      "$paths = @()",
      "foreach ($root in $candidateRoots) {",
      "  $paths += Join-Path $root 'Docker\\Docker\\Docker Desktop.exe'",
      "  $paths += Join-Path $root 'Docker\\Docker\\Docker Desktop'",
      "}",
      "$paths += 'C:\\Program Files\\Docker\\Docker\\Docker Desktop.exe'",
      "$paths += 'C:\\Program Files\\Docker\\Docker\\Docker Desktop'",
      "$paths = $paths | Select-Object -Unique",
      "$existsByPath = $false",
      "foreach ($p in $paths) { if (Test-Path -LiteralPath $p) { $existsByPath = $true; break } }",
      "$existsByRegistry = $false",
      "$registryPaths = @('HKLM:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*', 'HKLM:\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall\\*')",
      "foreach ($reg in $registryPaths) {",
      "  $item = Get-ItemProperty -Path $reg -ErrorAction SilentlyContinue | Where-Object { $_.DisplayName -eq 'Docker Desktop' } | Select-Object -First 1",
      "  if ($null -ne $item) { $existsByRegistry = $true; break }",
      "}",
      "$existsByCommand = $null -ne (Get-Command 'Docker Desktop' -ErrorAction SilentlyContinue)",
      "$installed = $existsByPath -or $existsByRegistry -or $existsByCommand",
      "if ($installed) {",
      "  Write-Output ('INSTALLED|' + ($paths -join ';'))",
      "} else {",
      "  Write-Output ('MISSING|' + ($paths -join ';'))",
      "}",
    ].join("; ");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", command],
      timeoutMs: 25_000,
    });

    const output = result.stdout.trim();
    const installed = result.ok && output.startsWith("INSTALLED|");

    if (installed) {
      return {
        installed: true,
        uncertain: false,
        detail: "Docker Desktop está instalado.",
      };
    }

    if (!result.ok && /timed out/i.test(result.message)) {
      return {
        installed: false,
        uncertain: true,
        detail:
          "No se pudo verificar instalación de Docker Desktop por timeout, pero el resultado puede ser transitorio.",
      };
    }

    return {
      installed: false,
      uncertain: false,
      detail: result.ok
        ? "No se encontró Docker Desktop en Program Files o registro del sistema."
        : `No se pudo verificar instalación de Docker Desktop: ${result.stderr || result.message}`,
    };
  }

  private async probeDockerDesktopRunning(): Promise<DockerDesktopRunningProbe> {
    const processCheck = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        "if (Get-Process -Name 'Docker Desktop' -ErrorAction SilentlyContinue) { Write-Output 'RUNNING' } else { Write-Output 'STOPPED' }",
      ],
      timeoutMs: 10_000,
    });

    if (processCheck.ok && processCheck.stdout.trim() === "RUNNING") {
      return {
        running: true,
        uncertain: false,
        detail: "Docker Desktop está en ejecución.",
      };
    }

    const dockerServerVersion = await this.processRunner.run({
      command: "docker",
      args: ["version", "--format", "{{.Server.Version}}"],
      timeoutMs: 15_000,
    });

    if (dockerServerVersion.ok) {
      return {
        running: true,
        uncertain: false,
        detail: "Docker Engine responde correctamente.",
      };
    }

    const dockerInfo = await this.processRunner.run({
      command: "docker",
      args: ["info", "--format", "{{.ServerVersion}}"],
      timeoutMs: 20_000,
    });

    if (dockerInfo.ok) {
      return {
        running: true,
        uncertain: false,
        detail: "Docker Engine responde correctamente (docker info).",
      };
    }

    const timeoutSignals = [
      processCheck,
      dockerServerVersion,
      dockerInfo,
    ].filter((probe) => /timed out/i.test(probe.message));

    if (timeoutSignals.length > 0) {
      return {
        running: false,
        uncertain: true,
        detail:
          "No se pudo confirmar estado de Docker Desktop/Engine por timeout. Puede ser un falso negativo temporal.",
      };
    }

    return {
      running: false,
      uncertain: false,
      detail: "Docker Desktop no está iniciado o Docker Engine no responde.",
    };
  }
}
