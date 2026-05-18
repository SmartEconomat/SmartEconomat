using Microsoft.Extensions.Options;

namespace SmartEconomat.WindowsSupervisor;

/// <summary>Motor de reconciliación: observar → comparar → planificar → actuar (máx. una acción/ciclo).</summary>
public sealed class StateReconciler(
    ILogger<StateReconciler> logger,
    IOptions<SupervisorOptions> optionsAccessor,
    ActualStateCollector stateCollector,
    DriftAnalyzer driftAnalyzer,
    CooldownRegistry cooldowns,
    ReconciliationExecutor executor)
{
    private readonly SupervisorOptions _options = optionsAccessor.Value;
    private readonly DateTimeOffset _serviceStartedAt = DateTimeOffset.UtcNow;
    private string? _lastDriftSignature;

    public async Task<SupervisorSnapshot> ReconcileAsync(
        SupervisorSnapshot previous,
        CancellationToken cancellationToken)
    {
        var now = DateTimeOffset.UtcNow;
        var inBootGrace = IsInBootGrace(now);
        var actual = await stateCollector.CollectAsync(inBootGrace, cancellationToken);
        var plan = driftAnalyzer.BuildPlan(actual, previous);

        var snapshot = MapPreviousState(previous, now);
        ApplyActualToSnapshot(snapshot, actual, plan);

        LogObservation(plan);

        if (plan.LevelToApply == RecoveryLevel.None)
        {
            FinalizeSnapshot(snapshot, plan, inBootGrace);
            return snapshot;
        }

        if (!cooldowns.CanApply(plan.LevelToApply, snapshot, now, out var blockReason))
        {
            logger.LogInformation(
                "reconciliation_deferred planned_level={Level} cooldown_active_reason={Reason}",
                plan.LevelToApply,
                blockReason);
            FinalizeSnapshot(snapshot, plan, inBootGrace);
            return snapshot;
        }

        var actionDetail = await executor.ExecuteAsync(
            plan.LevelToApply,
            plan,
            snapshot,
            now,
            cancellationToken);

        logger.LogInformation(
            "reconciliation_complete level={Level} action={Action} reason={Reason}",
            plan.LevelToApply,
            actionDetail,
            plan.Reason);

        if (plan.LevelToApply >= RecoveryLevel.L2DockerDaemon)
        {
            actual = await stateCollector.CollectAsync(inBootGrace, cancellationToken);
            ApplyActualToSnapshot(snapshot, actual, driftAnalyzer.BuildPlan(actual, snapshot));
        }

        FinalizeSnapshot(snapshot, plan, inBootGrace);
        return snapshot;
    }

    private void ApplyActualToSnapshot(
        SupervisorSnapshot snapshot,
        ActualSystemState actual,
        ReconciliationPlan plan)
    {
        snapshot.CheckedAt = actual.ObservedAt;
        snapshot.DesiredStateSummary = DesiredStateCatalog.Summarize();
        snapshot.ActualStateSummary = actual.Summarize();
        snapshot.DockerServiceStartMode = actual.DockerServiceStartMode;
        snapshot.DockerServiceRunning = actual.DockerServiceRunning;
        snapshot.DockerDaemonReady = actual.DockerDaemonReachable;
        snapshot.Services = actual.ComposeServices;
        snapshot.ComposeHealthy = IsComposeOperational(actual.ComposeServices, actual.InBootGrace);
        snapshot.DriftRecords = plan.Drifts.Select(d => new DriftRecord
        {
            ComponentId = d.ComponentId,
            Severity = d.Severity.ToString(),
            Detail = d.Detail,
            MinimumLevel = d.MinimumRecoveryLevel.ToString(),
        }).ToList();
        snapshot.LastRecoveryLevel = plan.LevelToApply.ToString();
        snapshot.LastReconciliationReason = plan.Reason;
        snapshot.OverallHealth = plan.OverallHealth.ToString();

        snapshot.LocalWebHealthy = actual.Components.Any(c =>
            c.Id == "frontend" && c.Health == SignalHealth.Ok);
        snapshot.PublicWebHealthy = false;

        snapshot.HealthFindings = plan.Drifts.Select(d => new HealthFinding
        {
            Id = d.ComponentId,
            Label = d.ComponentId,
            Severity = MapSeverity(d.Severity),
            Detail = d.Detail,
        }).ToList();
    }

    private void FinalizeSnapshot(
        SupervisorSnapshot snapshot,
        ReconciliationPlan plan,
        bool inBootGrace)
    {
        if (plan.Drifts.Count == 0)
        {
            snapshot.Overall = "healthy";
            snapshot.ConsecutiveDriftCycles = 0;
            snapshot.ConsecutiveFailures = 0;
            snapshot.ConsecutiveCriticalCycles = 0;
            return;
        }

        if (inBootGrace && plan.OverallHealth < SignalHealth.Critical)
        {
            snapshot.Overall = "stabilizing";
            return;
        }

        snapshot.ConsecutiveDriftCycles += 1;
        snapshot.ConsecutiveFailures = snapshot.ConsecutiveDriftCycles;

        if (plan.OverallHealth >= SignalHealth.Critical)
        {
            snapshot.ConsecutiveCriticalCycles += 1;
        }
        else
        {
            snapshot.ConsecutiveCriticalCycles = 0;
        }

        snapshot.Overall = plan.OverallHealth switch
        {
            SignalHealth.Ok => "healthy",
            SignalHealth.Degraded => "stabilizing",
            _ => "degraded",
        };
    }

    private void LogObservation(ReconciliationPlan plan)
    {
        var driftSig = string.Join(
            ";",
            plan.Drifts.Select(d => $"{d.ComponentId}:{d.Severity}"));
        if (!string.Equals(_lastDriftSignature, driftSig, StringComparison.Ordinal))
        {
            _lastDriftSignature = driftSig;
            if (plan.Drifts.Count > 0)
            {
                logger.LogWarning(
                    "drift_detected desired_state_snapshot={Desired} actual_state_snapshot={Actual} drifts={DriftCount}",
                    DesiredStateCatalog.Summarize(),
                    plan.Actual.Summarize(),
                    plan.Drifts.Count);
            }
        }

        logger.LogInformation(
            "desired_state_snapshot={Desired} actual_state_snapshot={Actual} overall_health={Health} planned_level={Level} reason={Reason}",
            DesiredStateCatalog.Summarize(),
            plan.Actual.Summarize(),
            plan.OverallHealth,
            plan.LevelToApply,
            plan.Reason);
    }

    private static void LogBlocked(ReconciliationPlan plan)
    {
        // CooldownRegistry ya registró cooldown_active_reason
    }

    private static SupervisorSnapshot MapPreviousState(SupervisorSnapshot previous, DateTimeOffset now)
    {
        return new SupervisorSnapshot
        {
            CheckedAt = now,
            ConsecutiveFailures = previous.ConsecutiveFailures,
            ConsecutiveDriftCycles = previous.ConsecutiveDriftCycles,
            ConsecutiveCriticalCycles = previous.ConsecutiveCriticalCycles,
            LastAutomaticAction = previous.LastAutomaticAction,
            LastAutomaticActionAt = previous.LastAutomaticActionAt,
            LastServiceCorrectionAt = previous.LastServiceCorrectionAt,
            LastDockerRecoveryAt = previous.LastDockerRecoveryAt,
            LastComposeLightRecoveryAt = previous.LastComposeLightRecoveryAt,
            LastComposeStrongRecoveryAt = previous.LastComposeStrongRecoveryAt,
            LastL1RecoveryAt = previous.LastL1RecoveryAt,
            LastL2RecoveryAt = previous.LastL2RecoveryAt,
            LastL3RecoveryAt = previous.LastL3RecoveryAt,
            LastL4RecoveryAt = previous.LastL4RecoveryAt,
        };
    }

    private bool IsInBootGrace(DateTimeOffset now)
        => now - _serviceStartedAt < TimeSpan.FromSeconds(_options.BootGraceSeconds);

    private static bool IsComposeOperational(List<ServiceCheckState> services, bool inBootGrace)
    {
        if (services.Count == 0)
        {
            return inBootGrace;
        }

        return services.All(s =>
            string.Equals(s.Status, "running", StringComparison.OrdinalIgnoreCase)
            || string.Equals(s.Status, "healthy", StringComparison.OrdinalIgnoreCase)
            || string.Equals(s.Status, "starting", StringComparison.OrdinalIgnoreCase));
    }

    private static HealthSeverity MapSeverity(SignalHealth health)
        => health switch
        {
            SignalHealth.Ok => HealthSeverity.Ok,
            SignalHealth.Degraded => HealthSeverity.Warning,
            SignalHealth.Unhealthy => HealthSeverity.Recoverable,
            SignalHealth.Critical => HealthSeverity.Fatal,
            _ => HealthSeverity.Recoverable,
        };
}
