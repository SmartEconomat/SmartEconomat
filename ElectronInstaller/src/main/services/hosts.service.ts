import { ProcessRunnerService } from "./process-runner.service";

export class HostsService {
  private readonly processRunner = new ProcessRunnerService();

        /**
     * Documentación en español.
     */
  async ensureHostEntry(host: string, ip: string = "127.0.0.1"): Promise<void> {
    if (process.platform !== "win32") {
      return;
    }

    if (host === "localhost" || host === "127.0.0.1" || host === "::1") {
      return;
    }

    // Script de PowerShell para manipular el archivo hosts de forma atómica y segura
    const script = `
      $ErrorActionPreference = 'Stop'
      $hostsPath = "$env:SystemRoot\\System32\\drivers\\etc\\hosts"
      $ip = "${ip}"
      $hostName = "${host}"
      $entry = "$ip $hostName"
      $marker = "# [SmartEconomat] Entrada automatica"

      if (-not (Test-Path $hostsPath)) {
        throw "No se encontró el archivo hosts en $hostsPath"
      }

      $content = Get-Content $hostsPath
      $newContent = @()
      $found = $false

      foreach ($line in $content) {
        $trimmed = $line.Trim()
        # Si la línea contiene el host (ignorando comentarios o espacios)
        if ($trimmed -match "^\\s*[^#]*\\s+$hostName(\\s|$)") {
          if ($trimmed -ne $entry) {
            $newContent += "$entry $marker"
          } else {
            $newContent += $line
          }
          $found = $true
        } else {
          $newContent += $line
        }
      }

      if (-not $found) {
        $newContent += "$entry $marker"
      }

      # Guardar con codificación UTF8 sin BOM (estándar para hosts)
      [System.IO.File]::WriteAllLines($hostsPath, $newContent)
    `;

    await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      timeoutMs: 15_000,
    });
  }

        /**
     * Documentación en español.
     */
  async removeSmartEconomatEntries(): Promise<void> {
    if (process.platform !== "win32") {
      return;
    }

    const script = `
      $ErrorActionPreference = 'Stop'
      $hostsPath = "$env:SystemRoot\\System32\\drivers\\etc\\hosts"
      $marker = "# [SmartEconomat] Entrada automatica"

      if (-not (Test-Path $hostsPath)) { return }

      $content = Get-Content $hostsPath
      $newContent = $content | Where-Object { $_ -notlike "*$marker*" }

      if ($content.Length -ne $newContent.Length) {
        [System.IO.File]::WriteAllLines($hostsPath, $newContent)
      }
    `;

    await this.processRunner.run({
      command: "powershell",
      args: ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
      timeoutMs: 15_000,
    });
  }
}
