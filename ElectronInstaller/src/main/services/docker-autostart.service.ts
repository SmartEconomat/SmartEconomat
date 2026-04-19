import path from "node:path";

import { ProcessRunnerService } from "./process-runner.service";

export interface DockerAutostartStatus {
  /**
   * Docker Desktop está configurado para iniciar con Windows
   */
  autoStartEnabled: boolean;
  /**
   * Docker Desktop está instalado en el sistema
   */
  dockerDesktopInstalled: boolean;
  /**
   * Ruta al ejecutable de Docker Desktop (si se encontró)
   */
  dockerDesktopPath: string | null;
  /**
   * Mensaje descriptivo del estado
   */
  message: string;
}

export interface DockerAutostartConfigResult {
  ok: boolean;
  message: string;
  errorCode?: string;
}

/**
 * Servicio que gestiona la configuración de inicio automático de Docker Desktop
 * en Windows. Permite verificar y configurar que Docker arranque con el sistema.
 */
export class DockerAutostartService {
  private readonly processRunner = new ProcessRunnerService();

  private readonly dockerDesktopPaths = [
    "C:/Program Files/Docker/Docker/Docker Desktop.exe",
    "C:/Program Files/Docker/Docker/Docker Desktop",
  ];

  /**
   * Verifica el estado actual de la configuración de auto-inicio de Docker Desktop.
   */
  async getAutostartStatus(): Promise<DockerAutostartStatus> {
    if (process.platform !== "win32") {
      return {
        autoStartEnabled: false,
        dockerDesktopInstalled: false,
        dockerDesktopPath: null,
        message:
          "La configuración de auto-inicio de Docker Desktop solo está disponible en Windows.",
      };
    }

    const dockerPath = await this.findDockerDesktopPath();
    if (!dockerPath) {
      return {
        autoStartEnabled: false,
        dockerDesktopInstalled: false,
        dockerDesktopPath: null,
        message:
          "Docker Desktop no está instalado o no se encontró en las rutas estándar.",
      };
    }

    const autoStartEnabled = await this.isAutoStartEnabled();

    return {
      autoStartEnabled,
      dockerDesktopInstalled: true,
      dockerDesktopPath: dockerPath,
      message: autoStartEnabled
        ? "Docker Desktop está configurado para iniciar automáticamente con Windows."
        : "Docker Desktop NO está configurado para iniciar automáticamente. Se recomienda habilitarlo.",
    };
  }

  /**
   * Configura Docker Desktop para iniciar automáticamente con Windows.
   * Utiliza múltiples estrategias:
   * 1. Configuración via Docker Desktop settings.json
   * 2. Registro de Windows (Run key)
   * 3. Tarea programada como fallback
   */
  async enableAutostart(): Promise<DockerAutostartConfigResult> {
    if (process.platform !== "win32") {
      return {
        ok: false,
        message: "Esta funcionalidad solo está disponible en Windows.",
        errorCode: "PLATFORM_NOT_SUPPORTED",
      };
    }

    const dockerPath = await this.findDockerDesktopPath();
    if (!dockerPath) {
      return {
        ok: false,
        message: "Docker Desktop no está instalado.",
        errorCode: "DOCKER_DESKTOP_NOT_FOUND",
      };
    }

    // Estrategia 1: Modificar settings.json de Docker Desktop
    const settingsResult = await this.configureDockerSettings(true);

    // Estrategia 2: Añadir al registro de Windows (Run key)
    const registryResult = await this.addToWindowsStartup(dockerPath);

    // Verificar resultado
    if (settingsResult || registryResult) {
      return {
        ok: true,
        message:
          "Docker Desktop configurado para iniciar automáticamente con Windows.",
      };
    }

    // Estrategia 3: Crear tarea programada como último recurso
    const taskResult = await this.createStartupTask(dockerPath);
    if (taskResult) {
      return {
        ok: true,
        message:
          "Docker Desktop configurado mediante tarea programada para iniciar con Windows.",
      };
    }

    return {
      ok: false,
      message:
        "No se pudo configurar el inicio automático de Docker Desktop. Habilítalo manualmente desde la configuración de Docker Desktop.",
      errorCode: "AUTOSTART_CONFIG_FAILED",
    };
  }

  /**
   * Desactiva el inicio automático de Docker Desktop.
   */
  async disableAutostart(): Promise<DockerAutostartConfigResult> {
    if (process.platform !== "win32") {
      return {
        ok: false,
        message: "Esta funcionalidad solo está disponible en Windows.",
        errorCode: "PLATFORM_NOT_SUPPORTED",
      };
    }

    await this.configureDockerSettings(false);
    await this.removeFromWindowsStartup();
    await this.removeStartupTask();

    return {
      ok: true,
      message: "Inicio automático de Docker Desktop desactivado.",
    };
  }

  // ── Métodos privados ──────────────────────────────────────────

  private async findDockerDesktopPath(): Promise<string | null> {
    for (const candidatePath of this.dockerDesktopPaths) {
      const exists = await this.fileExists(candidatePath);
      if (exists) {
        return candidatePath;
      }
    }
    return null;
  }

  private async fileExists(filePath: string): Promise<boolean> {
    const result = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        `if (Test-Path '${filePath}') { exit 0 } else { exit 1 }`,
      ],
      timeoutMs: 5_000,
    });
    return result.ok;
  }

  /**
   * Verifica si Docker Desktop está configurado para iniciar automáticamente
   * verificando el registro de Windows y las configuraciones de Docker.
   */
  private async isAutoStartEnabled(): Promise<boolean> {
    // Verificar en el registro de Windows
    const registryCheck = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        `
          $regPath = 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
          $dockerKey = Get-ItemProperty -Path $regPath -Name 'Docker Desktop' -ErrorAction SilentlyContinue
          if ($dockerKey) { exit 0 } else { exit 1 }
        `,
      ],
      timeoutMs: 10_000,
    });

    if (registryCheck.ok) {
      return true;
    }

    // Verificar configuración de Docker Desktop settings.json
    const settingsCheck = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        `
          $settingsPath = "$env:APPDATA\\Docker\\settings.json"
          if (Test-Path $settingsPath) {
            $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json
            if ($settings.autoStart -eq $true) { exit 0 } else { exit 1 }
          } else { exit 1 }
        `,
      ],
      timeoutMs: 10_000,
    });

    if (settingsCheck.ok) {
      return true;
    }

    // Verificar tarea programada
    const taskCheck = await this.processRunner.run({
      command: "powershell",
      args: [
        "-NoProfile",
        "-Command",
        `
          $task = Get-ScheduledTask -TaskName 'DockerDesktopAutoStart' -ErrorAction SilentlyContinue
          if ($task -and $task.State -ne 'Disabled') { exit 0 } else { exit 1 }
        `,
      ],
      timeoutMs: 10_000,
    });

    return taskCheck.ok;
  }

  /**
   * Modifica settings.json de Docker Desktop para habilitar/deshabilitar autoStart.
   */
  private async configureDockerSettings(enable: boolean): Promise<boolean> {
    const script = `
      $settingsPath = "$env:APPDATA\\Docker\\settings.json"
      $settingsDir = Split-Path $settingsPath
      
      if (-not (Test-Path $settingsDir)) {
        New-Item -ItemType Directory -Path $settingsDir -Force | Out-Null
      }
      
      $settings = @{}
      if (Test-Path $settingsPath) {
        try {
          $settings = Get-Content $settingsPath -Raw | ConvertFrom-Json -AsHashtable
        } catch {
          $settings = @{}
        }
      }
      
      $settings['autoStart'] = $${enable.toString().toLowerCase()}
      $settings['startAtLogin'] = $${enable.toString().toLowerCase()}
      
      $settings | ConvertTo-Json -Depth 10 | Set-Content $settingsPath -Encoding UTF8
      exit 0
    `;

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", script],
      timeoutMs: 15_000,
    });

    return result.ok;
  }

  /**
   * Añade Docker Desktop al registro de Windows para inicio automático.
   */
  private async addToWindowsStartup(dockerPath: string): Promise<boolean> {
    const normalizedPath = path.win32.normalize(dockerPath);
    // Usamos comillas simples de PowerShell para evitar problemas con template literals
    const script = [
      "$regPath = 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'",
      `$dockerPath = '${normalizedPath}'`,
      "",
      "try {",
      "  $value = '\"' + $dockerPath + '\" --autostart'",
      "  Set-ItemProperty -Path $regPath -Name 'Docker Desktop' -Value $value -Type String",
      "  exit 0",
      "} catch {",
      "  exit 1",
      "}",
    ].join("\n");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", script],
      timeoutMs: 15_000,
    });

    return result.ok;
  }

  /**
   * Elimina Docker Desktop del registro de Windows.
   */
  private async removeFromWindowsStartup(): Promise<boolean> {
    const script = `
      $regPath = 'HKCU:\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Run'
      
      try {
        Remove-ItemProperty -Path $regPath -Name 'Docker Desktop' -ErrorAction SilentlyContinue
        exit 0
      } catch {
        exit 0
      }
    `;

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", script],
      timeoutMs: 10_000,
    });

    return result.ok;
  }

  /**
   * Crea una tarea programada para iniciar Docker Desktop al iniciar sesión.
   * Este es un método de respaldo si las otras opciones fallan.
   */
  private async createStartupTask(dockerPath: string): Promise<boolean> {
    const normalizedPath = path.win32.normalize(dockerPath);
    // Usamos un array y join para evitar problemas con template literals y comentarios
    const script = [
      "$taskName = 'DockerDesktopAutoStart'",
      `$dockerPath = '${normalizedPath}'`,
      "",
      "Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue",
      "",
      "$action = New-ScheduledTaskAction -Execute $dockerPath -Argument '--autostart'",
      "$trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME",
      "$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable",
      "",
      "try {",
      "  Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description 'Inicia Docker Desktop automaticamente al iniciar sesion' -Force",
      "  exit 0",
      "} catch {",
      "  exit 1",
      "}",
    ].join("\n");

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", script],
      timeoutMs: 30_000,
    });

    return result.ok;
  }

  /**
   * Elimina la tarea programada de inicio de Docker Desktop.
   */
  private async removeStartupTask(): Promise<boolean> {
    const script = `
      $taskName = 'DockerDesktopAutoStart'
      Unregister-ScheduledTask -TaskName $taskName -Confirm:$false -ErrorAction SilentlyContinue
      exit 0
    `;

    const result = await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-Command", script],
      timeoutMs: 15_000,
    });

    return result.ok;
  }
}
