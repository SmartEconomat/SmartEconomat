using Microsoft.Extensions.Options;

namespace SmartEconomat.WindowsSupervisor;

/// <summary>Compara estado deseado vs observado y calcula drift + nivel mínimo de recuperación.</summary>
public sealed class DriftAnalyzer(IOptions<SupervisorOptions> optionsAccessor)
{
    private readonly SupervisorOptions _options = optionsAccessor.Value;

    public ReconciliationPlan BuildPlan(ActualSystemState actual, SupervisorSnapshot previous)
    {
        var drifts = DetectDrifts(actual);
        var overall = drifts.Count == 0
            ? SignalHealth.Ok
            : drifts.Max(d => d.Severity);

        if (actual.InBootGrace && overall < SignalHealth.Critical)
        {
            return new ReconciliationPlan
            {
                Actual = actual,
                Drifts = drifts,
                OverallHealth = SignalHealth.Degraded,
                LevelToApply = RecoveryLevel.None,
                Reason = "boot_grace: observe_only",
            };
        }

        var level = SelectRecoveryLevel(drifts, overall, previous);
        var l1Targets = drifts
            .Where(d => d.ComponentId is "postgres" or "redis" or "backend" or "frontend")
            .Where(d => d.MinimumRecoveryLevel == RecoveryLevel.L1Container)
            .Select(d => MapComponentToComposeService(d.ComponentId))
            .Where(s => s is not null)
            .Cast<string>()
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        return new ReconciliationPlan
        {
            Actual = actual,
            Drifts = drifts,
            OverallHealth = overall,
            LevelToApply = level,
            Reason = BuildReason(drifts, level, previous),
            L1TargetServices = l1Targets,
        };
    }

    private List<StateDrift> DetectDrifts(ActualSystemState actual)
    {
        var drifts = new List<StateDrift>();

        var platformDrift = AnalyzeDockerPlatform(actual);
        if (platformDrift is not null)
        {
            drifts.Add(platformDrift);
        }

        if (!actual.DockerDaemonReachable)
        {
            return drifts;
        }

        foreach (var spec in DesiredStateCatalog.All)
        {
            if (spec.Id == "docker")
            {
                continue;
            }

            var observed = actual.Components.FirstOrDefault(c =>
                string.Equals(c.Id, spec.Id, StringComparison.OrdinalIgnoreCase));
            if (observed is null || observed.Health == SignalHealth.Ok)
            {
                continue;
            }

            var minLevel = observed.Health switch
            {
                SignalHealth.Degraded => RecoveryLevel.None,
                SignalHealth.Unhealthy => RecoveryLevel.L1Container,
                SignalHealth.Critical => RecoveryLevel.L3ComposeLight,
                _ => RecoveryLevel.None,
            };

            if (minLevel == RecoveryLevel.None)
            {
                continue;
            }

            drifts.Add(new StateDrift
            {
                ComponentId = spec.Id,
                Desired = spec.Status,
                Severity = observed.Health,
                MinimumRecoveryLevel = minLevel,
                Detail = observed.Detail,
            });
        }

        return drifts;
    }

    private static StateDrift? AnalyzeDockerPlatform(ActualSystemState actual)
    {
        var manual = !string.Equals(actual.DockerServiceStartMode, "Auto", StringComparison.OrdinalIgnoreCase)
            && !string.Equals(actual.DockerServiceStartMode, "Automatic", StringComparison.OrdinalIgnoreCase);

        if (!actual.DockerDaemonReachable)
        {
            var detail = actual.DockerServiceMissing
                ? "docker info no responde; com.docker.service no encontrado"
                : manual
                    ? $"daemon inaccesible; StartMode={actual.DockerServiceStartMode}"
                    : "docker info no responde";

            return new StateDrift
            {
                ComponentId = "docker",
                Desired = DesiredComponentStatus.Running,
                Severity = SignalHealth.Critical,
                MinimumRecoveryLevel = RecoveryLevel.L2DockerDaemon,
                Detail = detail,
            };
        }

        return null;
    }

    private RecoveryLevel SelectRecoveryLevel(
        IReadOnlyList<StateDrift> drifts,
        SignalHealth overall,
        SupervisorSnapshot previous)
    {
        if (drifts.Count == 0)
        {
            return RecoveryLevel.None;
        }

        var persistence = previous.ConsecutiveDriftCycles;
        var needsPlatformReconcile = drifts.Any(d =>
            d.ComponentId is "docker" or "docker-platform");

        if (needsPlatformReconcile)
        {
            return RecoveryLevel.L2DockerDaemon;
        }

        if (overall == SignalHealth.Critical
            && persistence >= _options.PersistenceThreshold + 2
            && previous.LastL3RecoveryAt is not null)
        {
            return RecoveryLevel.L4ComposeFull;
        }

        var unhealthyCount = drifts.Count(d => d.Severity >= SignalHealth.Unhealthy);
        var needsComposeLight = unhealthyCount >= 2
            || drifts.Any(d => d.MinimumRecoveryLevel >= RecoveryLevel.L3ComposeLight);

        if (needsComposeLight)
        {
            return persistence >= _options.PersistenceThreshold
                ? RecoveryLevel.L3ComposeLight
                : RecoveryLevel.None;
        }

        if (drifts.Any(d => d.MinimumRecoveryLevel == RecoveryLevel.L1Container))
        {
            return persistence >= Math.Max(2, _options.L1PersistenceThreshold)
                ? RecoveryLevel.L1Container
                : RecoveryLevel.None;
        }

        return RecoveryLevel.None;
    }

    private static string BuildReason(
        IReadOnlyList<StateDrift> drifts,
        RecoveryLevel level,
        SupervisorSnapshot previous)
    {
        if (drifts.Count == 0)
        {
            return "aligned: no drift";
        }

        var ids = string.Join(",", drifts.Select(d => d.ComponentId));
        return level == RecoveryLevel.None
            ? $"drift_detected=[{ids}] awaiting_persistence={previous.ConsecutiveDriftCycles}"
            : $"drift_detected=[{ids}] recovery_level={level}";
    }

    private static string? MapComponentToComposeService(string componentId)
        => componentId switch
        {
            "postgres" => "db",
            "redis" => "redis",
            "backend" => "backend",
            "frontend" => "frontend",
            _ => null,
        };
}
