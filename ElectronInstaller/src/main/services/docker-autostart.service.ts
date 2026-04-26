import path from "node:path";

import { resolveWindowsDockerDesktopExePath } from "./docker-desktop-windows-resolve";
import { ProcessRunnerService } from "./process-runner.service";

export interface DockerAutostartStatus {
        /**
     * Documentación en español.
     */
  autoStartEnabled: boolean;
        /**
     * Documentación en español.
     */
  dockerDesktopInstalled: boolean;
        /**
     * Documentación en español.
     */
  dockerDesktopPath: string | null;
        /**
     * Documentación en español.
     */
  message: string;
}

export interface DockerAutostartConfigResult {
  ok: boolean;
  message: string;
  errorCode?: string;
}

/**
 * Documentación en español.
 */
export class DockerAutostartService {
  private readonly processRunner = new ProcessRunnerService();

  async getAutostartStatus(): Promise<DockerAutostartStatus> {
    const platform = process.platform;

    if (platform === "win32") {
      return this.getAutostartStatusWindows();
    }

    if (platform === "darwin") {
      return this.getAutostartStatusMacOS();
    }

    if (platform === "linux") {
      return this.getAutostartStatusLinux();
    }

    return {
      autoStartEnabled: false,
      dockerDesktopInstalled: false,
      dockerDesktopPath: null,
      message: `Plataforma no soportada: ${platform}`,
    };
  }

  async enableAutostart(): Promise<DockerAutostartConfigResult> {
    const platform = process.platform;

    if (platform === "win32") {
      return this.enableAutostartWindows();
    }

    if (platform === "darwin") {
      return this.enableAutostartMacOS();
    }

    if (platform === "linux") {
      return this.enableAutostartLinux();
    }

    return {
      ok: false,
      message: `Plataforma no soportada: ${platform}`,
      errorCode: "PLATFORM_NOT_SUPPORTED",
    };
  }

  async disableAutostart(): Promise<DockerAutostartConfigResult> {
    const platform = process.platform;

    if (platform === "win32") {
      return this.disableAutostartWindows();
    }

    if (platform === "darwin") {
      return this.disableAutostartMacOS();
    }

    if (platform === "linux") {
      return this.disableAutostartLinux();
    }

    return {
      ok: false,
      message: `Plataforma no soportada: ${platform}`,
      errorCode: "PLATFORM_NOT_SUPPORTED",
    };
  }

  // ══════════════════════════════════════════════════════════════
  // ── Windows ──────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  private async getAutostartStatusWindows(): Promise<DockerAutostartStatus> {
    const dockerPath = await this.findDockerDesktopPathWindows();
    if (!dockerPath) {
      return {
        autoStartEnabled: false,
        dockerDesktopInstalled: false,
        dockerDesktopPath: null,
        message:
          "Docker Desktop no está instalado o no se encontró (Program Files, perfil local ni registro).",
      };
    }

    const autoStartEnabled = await this.isAutoStartEnabledWindows();

    return {
      autoStartEnabled,
      dockerDesktopInstalled: true,
      dockerDesktopPath: dockerPath,
      message: autoStartEnabled
        ? "Docker Desktop está configurado para iniciar automáticamente con Windows."
        : "Docker Desktop NO está configurado para iniciar automáticamente. Se recomienda habilitarlo.",
    };
  }

  private async enableAutostartWindows(): Promise<DockerAutostartConfigResult> {
    const dockerPath = await this.findDockerDesktopPathWindows();
    if (!dockerPath) {
      return {
        ok: false,
        message: "Docker Desktop no está instalado.",
        errorCode: "DOCKER_DESKTOP_NOT_FOUND",
      };
    }

    const settingsResult = await this.configureDockerSettingsWindows(true);
    const registryResult = await this.addToWindowsStartup(dockerPath);

    if (settingsResult || registryResult) {
      return {
        ok: true,
        message:
          "Docker Desktop configurado para iniciar automáticamente con Windows.",
      };
    }

    const taskResult = await this.createStartupTaskWindows(dockerPath);
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
        "No se pudo configurar el inicio automático de Docker Desktop. Habilítalo manualmente.",
      errorCode: "AUTOSTART_CONFIG_FAILED",
    };
  }

  private async disableAutostartWindows(): Promise<DockerAutostartConfigResult> {
    await this.configureDockerSettingsWindows(false);
    await this.removeFromWindowsStartup();
    await this.removeStartupTaskWindows();

    return {
      ok: true,
      message: "Inicio automático de Docker Desktop desactivado.",
    };
  }

  private async findDockerDesktopPathWindows(): Promise<string | null> {
    return resolveWindowsDockerDesktopExePath(this.processRunner);
  }

  private async isAutoStartEnabledWindows(): Promise<boolean> {
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

  private async configureDockerSettingsWindows(
    enable: boolean,
  ): Promise<boolean> {
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

  private async addToWindowsStartup(dockerPath: string): Promise<boolean> {
    const normalizedPath = path.win32.normalize(dockerPath);
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

  private async createStartupTaskWindows(dockerPath: string): Promise<boolean> {
    const normalizedPath = path.win32.normalize(dockerPath);
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

  private async removeStartupTaskWindows(): Promise<boolean> {
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

  // ══════════════════════════════════════════════════════════════
  // ── macOS ────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  private async getAutostartStatusMacOS(): Promise<DockerAutostartStatus> {
    const dockerInstalled = await this.isDockerInstalledMacOS();
    if (!dockerInstalled) {
      return {
        autoStartEnabled: false,
        dockerDesktopInstalled: false,
        dockerDesktopPath: null,
        message: "Docker Desktop no está instalado en macOS.",
      };
    }

    const autoStartEnabled = await this.isAutoStartEnabledMacOS();

    return {
      autoStartEnabled,
      dockerDesktopInstalled: true,
      dockerDesktopPath: "/Applications/Docker.app",
      message: autoStartEnabled
        ? "Docker Desktop está configurado para iniciar automáticamente con macOS."
        : "Docker Desktop NO está configurado para iniciar automáticamente. Se recomienda habilitarlo.",
    };
  }

  private async enableAutostartMacOS(): Promise<DockerAutostartConfigResult> {
    const installed = await this.isDockerInstalledMacOS();
    if (!installed) {
      return {
        ok: false,
        message: "Docker Desktop no está instalado en macOS.",
        errorCode: "DOCKER_DESKTOP_NOT_FOUND",
      };
    }

    // Configurar Docker Desktop settings.json para macOS
    const settingsResult = await this.configureDockerSettingsMacOS(true);

    // Añadir via osascript (Login Items)
    const loginItemResult = await this.addLoginItemMacOS();

    if (settingsResult || loginItemResult) {
      return {
        ok: true,
        message:
          "Docker Desktop configurado para iniciar automáticamente con macOS.",
      };
    }

    return {
      ok: false,
      message:
        "No se pudo configurar el inicio automático. Configúralo manualmente desde Docker Desktop > Preferences.",
      errorCode: "AUTOSTART_CONFIG_FAILED",
    };
  }

  private async disableAutostartMacOS(): Promise<DockerAutostartConfigResult> {
    await this.configureDockerSettingsMacOS(false);
    await this.removeLoginItemMacOS();

    return {
      ok: true,
      message: "Inicio automático de Docker Desktop desactivado en macOS.",
    };
  }

  private async isDockerInstalledMacOS(): Promise<boolean> {
    const result = await this.processRunner.run({
      command: "test",
      args: ["-d", "/Applications/Docker.app"],
      timeoutMs: 5_000,
    });
    return result.ok;
  }

  private async isAutoStartEnabledMacOS(): Promise<boolean> {
    // Verificar en Docker settings.json
    const result = await this.processRunner.run({
      command: "bash",
      args: [
        "-c",
        `settingsPath="$HOME/Library/Group Containers/group.com.docker/settings.json"; if [ -f "$settingsPath" ]; then grep -q '"autoStart"\\s*:\\s*true' "$settingsPath" && exit 0; fi; exit 1`,
      ],
      timeoutMs: 10_000,
    });

    return result.ok;
  }

  private async configureDockerSettingsMacOS(
    enable: boolean,
  ): Promise<boolean> {
    const script = `
      SETTINGS_PATH="$HOME/Library/Group Containers/group.com.docker/settings.json"
      SETTINGS_DIR="$(dirname "$SETTINGS_PATH")"
      mkdir -p "$SETTINGS_DIR"
      if [ -f "$SETTINGS_PATH" ]; then
        # Usar python3 (incluido en macOS) para manipular JSON
        python3 -c "
import json, sys
try:
    with open('$SETTINGS_PATH', 'r') as f:
        data = json.load(f)
except:
    data = {}
data['autoStart'] = ${enable ? "True" : "False"}
data['openAtLogin'] = ${enable ? "True" : "False"}
with open('$SETTINGS_PATH', 'w') as f:
    json.dump(data, f, indent=2)
" && exit 0 || exit 1
      else
        echo '{"autoStart": ${enable}, "openAtLogin": ${enable}}' > "$SETTINGS_PATH"
        exit 0
      fi
    `;

    const result = await this.processRunner.run({
      command: "bash",
      args: ["-c", script],
      timeoutMs: 15_000,
    });

    return result.ok;
  }

  private async addLoginItemMacOS(): Promise<boolean> {
    const result = await this.processRunner.run({
      command: "osascript",
      args: [
        "-e",
        'tell application "System Events" to make login item at end with properties {path:"/Applications/Docker.app", hidden:true}',
      ],
      timeoutMs: 15_000,
    });

    return result.ok;
  }

  private async removeLoginItemMacOS(): Promise<boolean> {
    const result = await this.processRunner.run({
      command: "osascript",
      args: [
        "-e",
        'tell application "System Events" to delete login item "Docker"',
      ],
      timeoutMs: 15_000,
    });

    return result.ok;
  }

  // ══════════════════════════════════════════════════════════════
  // ── Linux ────────────────────────────────────────────────────
  // ══════════════════════════════════════════════════════════════

  private async getAutostartStatusLinux(): Promise<DockerAutostartStatus> {
    const dockerInstalled = await this.isDockerInstalledLinux();
    if (!dockerInstalled) {
      return {
        autoStartEnabled: false,
        dockerDesktopInstalled: false,
        dockerDesktopPath: null,
        message: "Docker no está instalado en este sistema Linux.",
      };
    }

    const autoStartEnabled = await this.isAutoStartEnabledLinux();

    return {
      autoStartEnabled,
      dockerDesktopInstalled: true,
      dockerDesktopPath: "/usr/bin/docker",
      message: autoStartEnabled
        ? "El servicio Docker está configurado para iniciar automáticamente con Linux."
        : "El servicio Docker NO está configurado para iniciar automáticamente. Se recomienda habilitarlo.",
    };
  }

  private async enableAutostartLinux(): Promise<DockerAutostartConfigResult> {
    const installed = await this.isDockerInstalledLinux();
    if (!installed) {
      return {
        ok: false,
        message: "Docker no está instalado en este sistema Linux.",
        errorCode: "DOCKER_NOT_FOUND",
      };
    }

    // Habilitar Docker daemon via systemd
    const systemdResult = await this.processRunner.run({
      command: "systemctl",
      args: ["enable", "docker"],
      timeoutMs: 15_000,
    });

    if (systemdResult.ok) {
      return {
        ok: true,
        message:
          "Servicio Docker habilitado para inicio automático via systemd.",
      };
    }

    // Intentar Docker Desktop para Linux
    const desktopResult = await this.processRunner.run({
      command: "systemctl",
      args: ["--user", "enable", "docker-desktop"],
      timeoutMs: 15_000,
    });

    if (desktopResult.ok) {
      return {
        ok: true,
        message:
          "Docker Desktop habilitado para inicio automático via systemd (user).",
      };
    }

    return {
      ok: false,
      message:
        "No se pudo habilitar el inicio automático de Docker. Configúralo manualmente con: sudo systemctl enable docker",
      errorCode: "AUTOSTART_CONFIG_FAILED",
    };
  }

  private async disableAutostartLinux(): Promise<DockerAutostartConfigResult> {
    await this.processRunner.run({
      command: "systemctl",
      args: ["disable", "docker"],
      timeoutMs: 15_000,
    });

    await this.processRunner.run({
      command: "systemctl",
      args: ["--user", "disable", "docker-desktop"],
      timeoutMs: 15_000,
    });

    return {
      ok: true,
      message: "Inicio automático de Docker desactivado en Linux.",
    };
  }

  private async isDockerInstalledLinux(): Promise<boolean> {
    const result = await this.processRunner.run({
      command: "which",
      args: ["docker"],
      timeoutMs: 5_000,
    });
    return result.ok;
  }

  private async isAutoStartEnabledLinux(): Promise<boolean> {
    // Verificar Docker daemon
    const daemonCheck = await this.processRunner.run({
      command: "systemctl",
      args: ["is-enabled", "docker"],
      timeoutMs: 10_000,
    });

    if (daemonCheck.ok) {
      return true;
    }

    // Verificar Docker Desktop para Linux
    const desktopCheck = await this.processRunner.run({
      command: "systemctl",
      args: ["--user", "is-enabled", "docker-desktop"],
      timeoutMs: 10_000,
    });

    return desktopCheck.ok;
  }
}
