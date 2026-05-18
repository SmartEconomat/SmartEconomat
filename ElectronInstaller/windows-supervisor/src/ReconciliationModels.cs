namespace SmartEconomat.WindowsSupervisor;

/// <summary>Salud de señal observada (múltiples fuentes convergen aquí).</summary>
public enum SignalHealth
{
    Ok = 0,
    Degraded = 1,
    Unhealthy = 2,
    Critical = 3,
}

/// <summary>Niveles de recuperación (acción mínima necesaria).</summary>
public enum RecoveryLevel
{
    None = 0,
    L1Container = 1,
    L2DockerDaemon = 2,
    L3ComposeLight = 3,
    L4ComposeFull = 4,
}

public enum DesiredComponentStatus
{
    Running,
    Healthy,
    Available,
}

public sealed class DesiredComponentSpec
{
    public required string Id { get; init; }
    public required string Label { get; init; }
    public DesiredComponentStatus Status { get; init; }
}

public static class DesiredStateCatalog
{
    public static IReadOnlyList<DesiredComponentSpec> All { get; } =
    [
        new() { Id = "docker", Label = "Docker daemon", Status = DesiredComponentStatus.Running },
        new() { Id = "postgres", Label = "PostgreSQL", Status = DesiredComponentStatus.Healthy },
        new() { Id = "redis", Label = "Redis", Status = DesiredComponentStatus.Healthy },
        new() { Id = "backend", Label = "Backend NestJS", Status = DesiredComponentStatus.Healthy },
        new() { Id = "frontend", Label = "Frontend", Status = DesiredComponentStatus.Available },
    ];

    public static string Summarize()
        => string.Join(
            ", ",
            All.Select(c => $"{c.Id}={c.Status.ToString().ToLowerInvariant()}"));
}

public sealed class ComponentObservation
{
    public required string Id { get; init; }
    public required string Label { get; init; }
    public string Observed { get; init; } = "unknown";
    public SignalHealth Health { get; init; } = SignalHealth.Unhealthy;
    public string Detail { get; init; } = "";
}

public sealed class ActualSystemState
{
    public DateTimeOffset ObservedAt { get; init; } = DateTimeOffset.UtcNow;
    public bool InBootGrace { get; init; }
    public bool DockerDaemonReachable { get; init; }
    public string? DockerServiceStartMode { get; init; }
    public bool DockerServiceRunning { get; init; }
    public bool DockerServiceMissing { get; init; }
    public IReadOnlyList<ComponentObservation> Components { get; init; } = [];
    public List<ServiceCheckState> ComposeServices { get; init; } = [];

    public string Summarize()
    {
        var parts = Components
            .Select(c => $"{c.Id}={c.Observed}({c.Health})")
            .ToList();
        parts.Add($"win-service={DockerServiceStartMode ?? "missing"}/{(DockerServiceRunning ? "running" : "stopped")}");
        return string.Join(", ", parts);
    }
}

public sealed class StateDrift
{
    public required string ComponentId { get; init; }
    public DesiredComponentStatus Desired { get; init; }
    public SignalHealth Severity { get; init; }
    public RecoveryLevel MinimumRecoveryLevel { get; init; }
    public required string Detail { get; init; }
}

public sealed class ReconciliationPlan
{
    public ActualSystemState Actual { get; init; } = new();
    public IReadOnlyList<StateDrift> Drifts { get; init; } = [];
    public SignalHealth OverallHealth { get; init; } = SignalHealth.Ok;
    public RecoveryLevel LevelToApply { get; init; } = RecoveryLevel.None;
    public required string Reason { get; init; }
    public IReadOnlyList<string> L1TargetServices { get; init; } = [];
}

public sealed class ReconciliationOutcome
{
    public required ReconciliationPlan Plan { get; init; }
    public bool ActionExecuted { get; init; }
    public RecoveryLevel ExecutedLevel { get; init; } = RecoveryLevel.None;
    public string? ActionDetail { get; init; }
}

public sealed class DriftRecord
{
    public required string ComponentId { get; init; }
    public string Severity { get; init; } = "";
    public string Detail { get; init; } = "";
    public string MinimumLevel { get; init; } = "";
}
