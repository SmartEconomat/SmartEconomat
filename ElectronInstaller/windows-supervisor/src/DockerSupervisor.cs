using System.Diagnostics;
using System.Text;
using System.Text.Json;

namespace SmartEconomat.WindowsSupervisor;

public sealed class DockerSupervisor(ILogger<DockerSupervisor> logger, SupervisorOptions options)
{
    private DateTimeOffset _lastRecoveryAt = DateTimeOffset.MinValue;

    public async Task<SupervisorSnapshot> EvaluateAndRepairAsync(SupervisorSnapshot previous, CancellationToken cancellationToken)
    {
        var snapshot = new SupervisorSnapshot
        {
            CheckedAt = DateTimeOffset.UtcNow,
            ConsecutiveFailures = previous.ConsecutiveFailures,
            LastAutomaticAction = previous.LastAutomaticAction,
            LastAutomaticActionAt = previous.LastAutomaticActionAt,
        };

        snapshot.DockerDaemonReady = await IsDockerDaemonReady(cancellationToken);
        if (!snapshot.DockerDaemonReady)
        {
            await RecoverDockerDaemon(snapshot, cancellationToken);
            snapshot.DockerDaemonReady = await IsDockerDaemonReady(cancellationToken);
        }

        var composeState = await ReadComposeState(cancellationToken);
        snapshot.Services = composeState;
        snapshot.ComposeHealthy = IsComposeHealthy(composeState);

        if (snapshot.DockerDaemonReady && !snapshot.ComposeHealthy)
        {
            await RecoverComposeStack(snapshot, cancellationToken);
            composeState = await ReadComposeState(cancellationToken);
            snapshot.Services = composeState;
            snapshot.ComposeHealthy = IsComposeHealthy(composeState);
        }

        snapshot.LocalWebHealthy = await CheckLocalWeb(cancellationToken);
        snapshot.PublicWebHealthy = await CheckPublicWeb(cancellationToken);

        if (snapshot.DockerDaemonReady && snapshot.ComposeHealthy && snapshot.LocalWebHealthy && snapshot.PublicWebHealthy)
        {
            snapshot.Overall = "healthy";
            snapshot.ConsecutiveFailures = 0;
        }
        else
        {
            snapshot.Overall = "degraded";
            snapshot.ConsecutiveFailures += 1;
        }

        return snapshot;
    }

    private bool IsComposeHealthy(IReadOnlyCollection<ServiceCheckState> services)
    {
        if (services.Count == 0)
        {
            return false;
        }

        var statesByService = services.ToDictionary(entry => entry.Service, StringComparer.OrdinalIgnoreCase);
        foreach (var service in options.ExpectedServices)
        {
            if (!statesByService.TryGetValue(service, out var state))
            {
                return false;
            }

            var healthy = string.Equals(state.Status, "running", StringComparison.OrdinalIgnoreCase)
                || string.Equals(state.Status, "healthy", StringComparison.OrdinalIgnoreCase);
            if (!healthy)
            {
                return false;
            }
        }

        return true;
    }

    private async Task<bool> IsDockerDaemonReady(CancellationToken cancellationToken)
    {
        var result = await RunProcess("docker", "info --format \"{{json .ServerVersion}}\"", 20_000, cancellationToken);
        return result.ExitCode == 0 && !string.IsNullOrWhiteSpace(result.Stdout);
    }

    private async Task<List<ServiceCheckState>> ReadComposeState(CancellationToken cancellationToken)
    {
        var args = ComposeArgs("ps --format json");
        var result = await RunProcess("docker", args, 25_000, cancellationToken);
        if (result.ExitCode != 0 || string.IsNullOrWhiteSpace(result.Stdout))
        {
            return [];
        }

        var lines = result.Stdout
            .Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        var entries = new List<ServiceCheckState>();
        foreach (var line in lines)
        {
            try
            {
                var composeEntry = JsonSerializer.Deserialize<ComposePsEntry>(line);
                if (composeEntry is null || string.IsNullOrWhiteSpace(composeEntry.Service))
                {
                    continue;
                }

                var status = ResolveStatus(composeEntry.State, composeEntry.Health);
                entries.Add(new ServiceCheckState
                {
                    Service = composeEntry.Service,
                    Status = status,
                    Detail = $"State={composeEntry.State}; Health={composeEntry.Health ?? "none"}",
                });
            }
            catch (JsonException)
            {
                logger.LogWarning("No se pudo parsear línea JSON de compose: {Line}", line);
            }
        }

        return entries;
    }

    private static string ResolveStatus(string state, string? health)
    {
        if (string.Equals(state, "running", StringComparison.OrdinalIgnoreCase)
            && string.Equals(health, "healthy", StringComparison.OrdinalIgnoreCase))
        {
            return "healthy";
        }

        if (string.Equals(state, "running", StringComparison.OrdinalIgnoreCase))
        {
            return "running";
        }

        if (string.Equals(health, "unhealthy", StringComparison.OrdinalIgnoreCase))
        {
            return "unhealthy";
        }

        return "unknown";
    }

    private async Task RecoverDockerDaemon(SupervisorSnapshot snapshot, CancellationToken cancellationToken)
    {
        if (!CanRecoverNow())
        {
            return;
        }

        await RunProcess("powershell", "-NoProfile -Command \"wsl -l -v | Out-Null\"", 20_000, cancellationToken);
        await RunProcess(
            "powershell",
            "-NoProfile -Command \"sc.exe config com.docker.service start= auto | Out-Null; sc.exe failure com.docker.service reset= 86400 actions= restart/5000/restart/15000/restart/30000 | Out-Null; Set-Service -Name com.docker.service -StartupType Automatic -ErrorAction SilentlyContinue; Start-Service -Name com.docker.service -ErrorAction SilentlyContinue\"",
            20_000,
            cancellationToken);
        MarkRecovery(snapshot, "restart services");
    }

    private async Task RecoverComposeStack(SupervisorSnapshot snapshot, CancellationToken cancellationToken)
    {
        if (!CanRecoverNow())
        {
            return;
        }

        var downResult = await RunProcess("docker", ComposeArgs("down"), 40_000, cancellationToken);
        var upResult = await RunProcess("docker", ComposeArgs("up -d"), 60_000, cancellationToken);
        var action = downResult.ExitCode == 0 && upResult.ExitCode == 0
            ? "compose down/up"
            : "restart containers";
        MarkRecovery(snapshot, action);
    }

    private static async Task<bool> CheckUrl(string url, CancellationToken cancellationToken)
    {
        using var httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(5),
        };

        try
        {
            using var response = await httpClient.GetAsync(url, cancellationToken);
            return response.IsSuccessStatusCode;
        }
        catch
        {
            return false;
        }
    }

    private Task<bool> CheckLocalWeb(CancellationToken cancellationToken)
        => CheckUrl("http://127.0.0.1/", cancellationToken);

    private Task<bool> CheckPublicWeb(CancellationToken cancellationToken)
        => CheckUrl($"https://{options.PublicDomain}/", cancellationToken);

    private string ComposeArgs(string command)
        => $"compose --project-directory \"{options.ComposeProjectDir}\" -f \"{options.ComposeFile}\" --env-file \"{options.EnvFile}\" {command}";

    private bool CanRecoverNow()
        => DateTimeOffset.UtcNow - _lastRecoveryAt >= TimeSpan.FromSeconds(options.RecoveryCooldownSeconds);

    private void MarkRecovery(SupervisorSnapshot snapshot, string action)
    {
        _lastRecoveryAt = DateTimeOffset.UtcNow;
        snapshot.LastAutomaticAction = action;
        snapshot.LastAutomaticActionAt = _lastRecoveryAt;
        logger.LogWarning("Auto reparación ejecutada: {Action}", action);
    }

    private async Task<ProcessResult> RunProcess(
        string fileName,
        string arguments,
        int timeoutMs,
        CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = fileName,
            Arguments = arguments,
            RedirectStandardError = true,
            RedirectStandardOutput = true,
            UseShellExecute = false,
            CreateNoWindow = true,
        };

        using var process = new Process { StartInfo = startInfo };
        var stdout = new StringBuilder();
        var stderr = new StringBuilder();

        process.OutputDataReceived += (_, eventArgs) =>
        {
            if (eventArgs.Data is not null)
            {
                stdout.AppendLine(eventArgs.Data);
            }
        };
        process.ErrorDataReceived += (_, eventArgs) =>
        {
            if (eventArgs.Data is not null)
            {
                stderr.AppendLine(eventArgs.Data);
            }
        };

        process.Start();
        process.BeginOutputReadLine();
        process.BeginErrorReadLine();

        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(timeoutMs);

        try
        {
            await process.WaitForExitAsync(timeoutCts.Token);
        }
        catch (OperationCanceledException)
        {
            if (!process.HasExited)
            {
                process.Kill(entireProcessTree: true);
            }

            return new ProcessResult(124, stdout.ToString(), $"Timeout {timeoutMs}ms");
        }

        return new ProcessResult(process.ExitCode, stdout.ToString(), stderr.ToString());
    }

    private readonly record struct ProcessResult(int ExitCode, string Stdout, string Stderr);
}
