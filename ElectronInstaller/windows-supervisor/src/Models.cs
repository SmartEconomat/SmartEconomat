using System.Text.Json.Serialization;

namespace SmartEconomat.WindowsSupervisor;

public enum HealthSeverity
{
    Ok,
    Warning,
    Recoverable,
    Fatal,
}

public enum ComposeRecoveryPolicy
{
    Progressive,
    StrongOnly,
}

public sealed class SupervisorOptions
{
    public string RuntimePath { get; init; } = @"C:\SmartEconomatRuntime";
    public string ComposeProjectDir { get; init; } = @"C:\SmartEconomatRuntime\project";
    public string ComposeFile { get; init; } = @"C:\SmartEconomatRuntime\project\docker-compose.prod.yml";
    public string EnvFile { get; init; } = @"C:\SmartEconomatRuntime\.env.prod";
    public string PublicDomain { get; init; } = "smarteconomat.app";
    public string? OpsScriptsPath { get; init; }

    public int WatchdogIntervalSeconds { get; init; } = 180;
    public int ServiceCorrectionCooldownSeconds { get; init; } = 600;
    public int ContainerRecoveryCooldownSeconds { get; init; } = 300;
    public int DockerRecoveryCooldownSeconds { get; init; } = 900;
    public int ComposeLightRecoveryCooldownSeconds { get; init; } = 600;
    public int ComposeFullRecoveryCooldownSeconds { get; init; } = 900;
    public int BootGraceSeconds { get; init; } = 300;
    public int PersistenceThreshold { get; init; } = 3;
    public int L1PersistenceThreshold { get; init; } = 2;
    public int HealthTimeoutSeconds { get; init; } = 20;
    public string HealthEndpointPath { get; init; } = "/";
    public string BackendEndpointPath { get; init; } = "/api/v1";
    public ComposeRecoveryPolicy ComposeRecoveryPolicy { get; init; } = ComposeRecoveryPolicy.Progressive;
    public List<string> ExpectedServices { get; init; } = ["frontend", "backend", "db", "redis"];
}

public sealed class HealthFinding
{
    public required string Id { get; init; }
    public required string Label { get; init; }
    public HealthSeverity Severity { get; init; }
    public string Detail { get; init; } = "";
}

public sealed class ServiceCheckState
{
    public required string Service { get; init; }
    public required string Status { get; init; }
    public string Detail { get; init; } = "";
}

public sealed class SupervisorSnapshot
{
    public string Overall { get; set; } = "degraded";
    public DateTimeOffset CheckedAt { get; set; } = DateTimeOffset.UtcNow;
    public bool DockerDaemonReady { get; set; }
    public bool ComposeHealthy { get; set; }
    public bool LocalWebHealthy { get; set; }
    public bool PublicWebHealthy { get; set; }
    public int ConsecutiveFailures { get; set; }
    public int ConsecutiveDriftCycles { get; set; }
    public int ConsecutiveCriticalCycles { get; set; }
    public string LastAutomaticAction { get; set; } = "none";
    public DateTimeOffset? LastAutomaticActionAt { get; set; }
    public string? DockerServiceStartMode { get; set; }
    public bool DockerServiceRunning { get; set; }
    public List<ServiceCheckState> Services { get; set; } = [];
    public List<HealthFinding> HealthFindings { get; set; } = [];
    public string? DesiredStateSummary { get; set; }
    public string? ActualStateSummary { get; set; }
    public string? OverallHealth { get; set; }
    public string? LastRecoveryLevel { get; set; }
    public string? LastReconciliationReason { get; set; }
    public List<DriftRecord> DriftRecords { get; set; } = [];
    public DateTimeOffset? LastServiceCorrectionAt { get; set; }
    public DateTimeOffset? LastDockerRecoveryAt { get; set; }
    public DateTimeOffset? LastComposeLightRecoveryAt { get; set; }
    public DateTimeOffset? LastComposeStrongRecoveryAt { get; set; }
    public DateTimeOffset? LastL1RecoveryAt { get; set; }
    public DateTimeOffset? LastL2RecoveryAt { get; set; }
    public DateTimeOffset? LastL3RecoveryAt { get; set; }
    public DateTimeOffset? LastL4RecoveryAt { get; set; }
}

public sealed class ComposePsEntry
{
    [JsonPropertyName("Service")]
    public string Service { get; set; } = string.Empty;

    [JsonPropertyName("State")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("Health")]
    public string? Health { get; set; }

    [JsonPropertyName("ID")]
    public string? ContainerId { get; set; }
}

public sealed class ComDockerScriptResult
{
    public bool Ok { get; init; }
    public string StartMode { get; init; } = "unknown";
    public string State { get; init; } = "unknown";
    public string Detail { get; init; } = "";
}
