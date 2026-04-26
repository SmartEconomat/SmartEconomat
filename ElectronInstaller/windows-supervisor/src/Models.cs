using System.Text.Json.Serialization;

namespace SmartEconomat.WindowsSupervisor;

public sealed class SupervisorOptions
{
    public string RuntimePath { get; init; } = @"C:\SmartEconomatRuntime";
    public string ComposeProjectDir { get; init; } = @"C:\SmartEconomatRuntime\project";
    public string ComposeFile { get; init; } = @"C:\SmartEconomatRuntime\project\docker-compose.prod.yml";
    public string EnvFile { get; init; } = @"C:\SmartEconomatRuntime\.env.prod";
    public string PublicDomain { get; init; } = "smarteconomat.app";
    public int WatchdogIntervalSeconds { get; init; } = 15;
    public int RecoveryCooldownSeconds { get; init; } = 20;
    public string HealthEndpointPath { get; init; } = "/";
    public string BackendEndpointPath { get; init; } = "/api/v1";
    public List<string> ExpectedServices { get; init; } = ["frontend", "backend", "db", "redis"];
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
    public string LastAutomaticAction { get; set; } = "none";
    public DateTimeOffset? LastAutomaticActionAt { get; set; }
    public List<ServiceCheckState> Services { get; set; } = [];
}

public sealed class ComposePsEntry
{
    [JsonPropertyName("Service")]
    public string Service { get; set; } = string.Empty;

    [JsonPropertyName("State")]
    public string State { get; set; } = string.Empty;

    [JsonPropertyName("Health")]
    public string? Health { get; set; }
}
