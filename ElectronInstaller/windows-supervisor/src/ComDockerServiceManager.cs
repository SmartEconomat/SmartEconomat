using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace SmartEconomat.WindowsSupervisor;

/// <summary>
/// Gestión de com.docker.service vía script canónico ensure-com-docker-service-automatic.ps1.
/// </summary>
public sealed class ComDockerServiceManager(
    ILogger<ComDockerServiceManager> logger,
    IOptions<SupervisorOptions> optionsAccessor,
    ProcessExecutor processExecutor)
{
    private const string EnsureScriptName = "ensure-com-docker-service-automatic.ps1";
    private readonly SupervisorOptions _options = optionsAccessor.Value;

    public async Task<(string? StartMode, bool Running, bool Missing)> ReadServiceStateAsync(
        CancellationToken cancellationToken)
    {
        var result = await processExecutor.RunAsync(
            "powershell",
            "-NoProfile -Command \"$s = Get-CimInstance Win32_Service -Filter \\\"Name='com.docker.service'\\\" -ErrorAction SilentlyContinue; if ($null -eq $s) { Write-Output 'missing'; exit 2 }; Write-Output ($s.StartMode + '|' + $s.State)\"",
            TimeoutMs(),
            cancellationToken);

        if (result.ExitCode == 2 || result.Stdout.Trim().Equals("missing", StringComparison.OrdinalIgnoreCase))
        {
            return (null, false, true);
        }

        var parts = result.Stdout.Trim().Split('|', 2);
        if (parts.Length < 2)
        {
            return (null, false, false);
        }

        var running = parts[1].Equals("Running", StringComparison.OrdinalIgnoreCase);
        return (parts[0].Trim(), running, false);
    }

    public bool IsAutomaticStartMode(string? startMode)
        => string.Equals(startMode, "Auto", StringComparison.OrdinalIgnoreCase)
            || string.Equals(startMode, "Automatic", StringComparison.OrdinalIgnoreCase);

    public async Task<ComDockerScriptResult> EnsureAutomaticAsync(
        bool startIfStopped,
        CancellationToken cancellationToken)
    {
        var scriptPath = ResolveEnsureScriptPath();
        if (scriptPath is null)
        {
            logger.LogError(
                "Script canónico {Script} no encontrado. Rutas revisadas bajo RuntimePath y directorio del ejecutable.",
                EnsureScriptName);
            return new ComDockerScriptResult
            {
                Ok = false,
                StartMode = "unknown",
                State = "unknown",
                Detail = $"{EnsureScriptName} no encontrado",
            };
        }

        var psArgs = new StringBuilder();
        psArgs.Append("-NoProfile -ExecutionPolicy Bypass -File \"");
        psArgs.Append(scriptPath);
        psArgs.Append('"');
        if (startIfStopped)
        {
            psArgs.Append(" -StartIfStopped");
        }

        var result = await processExecutor.RunAsync(
            "powershell",
            psArgs.ToString(),
            TimeoutMs() + 10_000,
            cancellationToken);

        return ParseScriptJson(result.Stdout, result.ExitCode, result.Stderr);
    }

    private string? ResolveEnsureScriptPath()
    {
        var candidates = new List<string>();
        if (!string.IsNullOrWhiteSpace(_options.OpsScriptsPath))
        {
            candidates.Add(Path.Combine(_options.OpsScriptsPath, EnsureScriptName));
        }

        candidates.Add(Path.Combine(AppContext.BaseDirectory, "scripts", "ops", EnsureScriptName));
        candidates.Add(Path.Combine(_options.RuntimePath, "scripts", "ops", EnsureScriptName));
        candidates.Add(
            Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles),
                "SmartEconomat",
                "resources",
                "scripts",
                "ops",
                EnsureScriptName));

        foreach (var candidate in candidates)
        {
            if (File.Exists(candidate))
            {
                return candidate;
            }
        }

        return null;
    }

    private static ComDockerScriptResult ParseScriptJson(string stdout, int exitCode, string stderr)
    {
        var jsonLine = stdout
            .Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .FirstOrDefault(line => line.TrimStart().StartsWith("{", StringComparison.Ordinal));

        if (jsonLine is not null)
        {
            try
            {
                var parsed = JsonSerializer.Deserialize<ComDockerScriptResult>(
                    jsonLine,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                if (parsed is not null)
                {
                    return parsed;
                }
            }
            catch (JsonException)
            {
                // Fallback abajo.
            }
        }

        var detail = string.Join(" | ", new[] { stderr, stdout }.Where(v => v.Length > 0));
        return new ComDockerScriptResult
        {
            Ok = exitCode == 0,
            StartMode = "unknown",
            State = "unknown",
            Detail = string.IsNullOrWhiteSpace(detail) ? $"exit code {exitCode}" : detail,
        };
    }

    private int TimeoutMs() => Math.Max(5, _options.HealthTimeoutSeconds) * 1000;
}
