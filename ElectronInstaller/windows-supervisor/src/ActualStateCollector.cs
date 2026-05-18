using System.Text.Json;
using Microsoft.Extensions.Options;

namespace SmartEconomat.WindowsSupervisor;

/// <summary>Recolecta estado observado desde múltiples señales (docker info, ps, inspect, HTTP).</summary>
public sealed class ActualStateCollector(
    ILogger<ActualStateCollector> logger,
    IOptions<SupervisorOptions> optionsAccessor,
    ProcessExecutor processExecutor,
    ComDockerServiceManager dockerServiceManager)
{
    private readonly SupervisorOptions _options = optionsAccessor.Value;

    public async Task<ActualSystemState> CollectAsync(
        bool inBootGrace,
        CancellationToken cancellationToken)
    {
        var timeoutMs = Math.Max(5, _options.HealthTimeoutSeconds) * 1000;
        var (startMode, serviceRunning, serviceMissing) =
            await dockerServiceManager.ReadServiceStateAsync(cancellationToken);

        var daemonReachable = await ProbeDockerDaemonAsync(timeoutMs, cancellationToken);
        var composeServices = daemonReachable
            ? await ReadComposeStateAsync(cancellationToken)
            : [];

        var components = new List<ComponentObservation>
        {
            ObserveDockerDaemon(daemonReachable, inBootGrace),
        };

        if (daemonReachable)
        {
            components.Add(await ObserveComposeComponentAsync("postgres", "db", inBootGrace, timeoutMs, cancellationToken));
            components.Add(await ObserveComposeComponentAsync("redis", "redis", inBootGrace, timeoutMs, cancellationToken));
            components.Add(await ObserveBackendAsync(inBootGrace, timeoutMs, cancellationToken));
        }

        components.Add(await ObserveHttpComponentAsync(
            "frontend",
            "Frontend",
            $"http://127.0.0.1{_options.HealthEndpointPath}",
            DesiredComponentStatus.Available,
            inBootGrace,
            cancellationToken));

        return new ActualSystemState
        {
            ObservedAt = DateTimeOffset.UtcNow,
            InBootGrace = inBootGrace,
            DockerDaemonReachable = daemonReachable,
            DockerServiceStartMode = startMode,
            DockerServiceRunning = serviceRunning,
            DockerServiceMissing = serviceMissing,
            Components = components,
            ComposeServices = composeServices,
        };
    }

    private static ComponentObservation ObserveDockerDaemon(bool reachable, bool inBootGrace)
    {
        if (reachable)
        {
            return new ComponentObservation
            {
                Id = "docker",
                Label = "Docker daemon",
                Observed = "running",
                Health = SignalHealth.Ok,
                Detail = "docker info OK",
            };
        }

        return new ComponentObservation
        {
            Id = "docker",
            Label = "Docker daemon",
            Observed = "unreachable",
            Health = inBootGrace ? SignalHealth.Degraded : SignalHealth.Critical,
            Detail = inBootGrace ? "daemon en arranque" : "docker info falló",
        };
    }

    private async Task<ComponentObservation> ObserveComposeComponentAsync(
        string componentId,
        string composeService,
        bool inBootGrace,
        int timeoutMs,
        CancellationToken cancellationToken)
    {
        var inspect = await ProbeContainerInspectAsync(composeService, timeoutMs, cancellationToken);
        var health = MapInspectToHealth(inspect.Health, inBootGrace);
        return new ComponentObservation
        {
            Id = componentId,
            Label = composeService,
            Observed = inspect.State,
            Health = health,
            Detail = inspect.Detail,
        };
    }

    private async Task<ComponentObservation> ObserveBackendAsync(
        bool inBootGrace,
        int timeoutMs,
        CancellationToken cancellationToken)
    {
        var container = await ObserveComposeComponentAsync("backend", "backend", inBootGrace, timeoutMs, cancellationToken);
        var http = await ProbeHttpAsync(
            $"http://127.0.0.1{_options.BackendEndpointPath}",
            cancellationToken);

        var health = container.Health;
        if (!http.Ok)
        {
            var httpHealth = inBootGrace ? SignalHealth.Degraded : SignalHealth.Unhealthy;
            health = health > httpHealth ? health : httpHealth;
        }

        return new ComponentObservation
        {
            Id = "backend",
            Label = "Backend NestJS",
            Observed = http.Ok ? "healthy" : container.Observed,
            Health = health,
            Detail = $"{container.Detail} | {http.Detail}",
        };
    }

    private async Task<ComponentObservation> ObserveHttpComponentAsync(
        string id,
        string label,
        string url,
        DesiredComponentStatus desired,
        bool inBootGrace,
        CancellationToken cancellationToken)
    {
        var http = await ProbeHttpAsync(url, cancellationToken);
        return new ComponentObservation
        {
            Id = id,
            Label = label,
            Observed = http.Ok ? "available" : "unavailable",
            Health = http.Ok
                ? SignalHealth.Ok
                : inBootGrace ? SignalHealth.Degraded : SignalHealth.Unhealthy,
            Detail = http.Detail,
        };
    }

    private async Task<bool> ProbeDockerDaemonAsync(int timeoutMs, CancellationToken cancellationToken)
    {
        var result = await processExecutor.RunAsync(
            "docker",
            "info --format \"{{json .ServerVersion}}\"",
            timeoutMs,
            cancellationToken);
        return result.ExitCode == 0 && !string.IsNullOrWhiteSpace(result.Stdout);
    }

    private async Task<(string State, string Health, string Detail)> ProbeContainerInspectAsync(
        string composeService,
        int timeoutMs,
        CancellationToken cancellationToken)
    {
        var idResult = await processExecutor.RunAsync(
            "docker",
            ComposeArgs($"ps -q {composeService}"),
            timeoutMs,
            cancellationToken);

        var containerId = idResult.Stdout.Trim();
        if (idResult.ExitCode != 0 || string.IsNullOrWhiteSpace(containerId))
        {
            return ("missing", "none", "contenedor no encontrado");
        }

        var inspectResult = await processExecutor.RunAsync(
            "docker",
            $"inspect --format \"{{{{.State.Status}}}}|{{{{if .State.Health}}}}{{{{.State.Health.Status}}}}{{{{else}}}}none{{{{end}}}}\" {containerId}",
            timeoutMs,
            cancellationToken);

        var parts = inspectResult.Stdout.Trim().Split('|', 2);
        var state = parts.Length > 0 ? parts[0] : "unknown";
        var health = parts.Length > 1 ? parts[1] : "none";
        return (state, health, $"State={state}; Health={health}");
    }

    private async Task<(bool Ok, string Detail)> ProbeHttpAsync(
        string url,
        CancellationToken cancellationToken)
    {
        using var httpClient = new HttpClient
        {
            Timeout = TimeSpan.FromSeconds(Math.Max(5, _options.HealthTimeoutSeconds)),
        };

        try
        {
            using var response = await httpClient.GetAsync(url, cancellationToken);
            return (response.IsSuccessStatusCode, $"HTTP {(int)response.StatusCode} {url}");
        }
        catch (Exception ex)
        {
            return (false, $"{url}: {ex.Message}");
        }
    }

    private async Task<List<ServiceCheckState>> ReadComposeStateAsync(CancellationToken cancellationToken)
    {
        var result = await processExecutor.RunAsync(
            "docker",
            ComposeArgs("ps --format json"),
            Math.Max(5, _options.HealthTimeoutSeconds) * 1000 + 5_000,
            cancellationToken);

        if (result.ExitCode != 0 || string.IsNullOrWhiteSpace(result.Stdout))
        {
            return [];
        }

        var entries = new List<ServiceCheckState>();
        foreach (var line in result.Stdout.Split(Environment.NewLine, StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries))
        {
            try
            {
                var entry = JsonSerializer.Deserialize<ComposePsEntry>(line);
                if (entry is null || string.IsNullOrWhiteSpace(entry.Service))
                {
                    continue;
                }

                entries.Add(new ServiceCheckState
                {
                    Service = entry.Service,
                    Status = ResolveComposeStatus(entry.State, entry.Health),
                    Detail = $"State={entry.State}; Health={entry.Health ?? "none"}",
                });
            }
            catch (JsonException)
            {
                logger.LogDebug("compose ps JSON no parseable");
            }
        }

        return entries;
    }

    private static SignalHealth MapInspectToHealth(string health, bool inBootGrace)
    {
        if (string.Equals(health, "healthy", StringComparison.OrdinalIgnoreCase)
            || string.Equals(health, "none", StringComparison.OrdinalIgnoreCase))
        {
            return SignalHealth.Ok;
        }

        if (string.Equals(health, "starting", StringComparison.OrdinalIgnoreCase))
        {
            return SignalHealth.Degraded;
        }

        return inBootGrace ? SignalHealth.Degraded : SignalHealth.Unhealthy;
    }

    private static string ResolveComposeStatus(string state, string? health)
    {
        if (string.Equals(state, "running", StringComparison.OrdinalIgnoreCase)
            && string.Equals(health, "healthy", StringComparison.OrdinalIgnoreCase))
        {
            return "healthy";
        }

        if (string.Equals(state, "running", StringComparison.OrdinalIgnoreCase))
        {
            return string.Equals(health, "starting", StringComparison.OrdinalIgnoreCase) ? "starting" : "running";
        }

        return "unknown";
    }

    private string ComposeArgs(string command)
        => $"compose --project-directory \"{_options.ComposeProjectDir}\" -f \"{_options.ComposeFile}\" --env-file \"{_options.EnvFile}\" {command}";
}
