using Microsoft.Extensions.Options;

namespace SmartEconomat.WindowsSupervisor;

/// <summary>Ejecuta acciones de reconciliación L1–L4 (una por invocación).</summary>
public sealed class ReconciliationExecutor(
    ILogger<ReconciliationExecutor> logger,
    IOptions<SupervisorOptions> optionsAccessor,
    ComDockerServiceManager dockerServiceManager,
    ProcessExecutor processExecutor,
    CooldownRegistry cooldowns)
{
    private readonly SupervisorOptions _options = optionsAccessor.Value;

    public async Task<string> ExecuteAsync(
        RecoveryLevel level,
        ReconciliationPlan plan,
        SupervisorSnapshot snapshot,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        return level switch
        {
            RecoveryLevel.L1Container => await ExecuteL1Async(plan, snapshot, now, cancellationToken),
            RecoveryLevel.L2DockerDaemon => await ExecuteL2Async(snapshot, now, cancellationToken),
            RecoveryLevel.L3ComposeLight => await ExecuteL3Async(snapshot, now, cancellationToken),
            RecoveryLevel.L4ComposeFull => await ExecuteL4Async(snapshot, now, cancellationToken),
            _ => "no_action",
        };
    }

    private async Task<string> ExecuteL1Async(
        ReconciliationPlan plan,
        SupervisorSnapshot snapshot,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        var targets = plan.L1TargetServices.Count > 0
            ? plan.L1TargetServices
            : plan.Drifts
                .Select(d => d.ComponentId)
                .Where(id => id is not "docker" and not "docker-platform")
                .Select(id => id switch
                {
                    "postgres" => "db",
                    _ => id,
                })
                .Distinct(StringComparer.OrdinalIgnoreCase)
                .ToList();

        if (targets.Count == 0)
        {
            return "L1_skipped: no targets";
        }

        var serviceList = string.Join(' ', targets);
        logger.LogWarning(
            "recovery_level_applied=L1 reason=container_drift targets={Targets}",
            serviceList);

        await processExecutor.RunAsync(
            "docker",
            ComposeArgs($"restart {serviceList}"),
            90_000,
            cancellationToken);

        cooldowns.MarkApplied(RecoveryLevel.L1Container, snapshot, now);
        snapshot.LastAutomaticAction = $"L1:restart {serviceList}";
        return $"L1 restarted {serviceList}";
    }

    private async Task<string> ExecuteL2Async(
        SupervisorSnapshot snapshot,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        logger.LogWarning("recovery_level_applied=L2 reason=daemon_or_platform_drift");
        var started = DateTimeOffset.UtcNow;

        if (cooldowns.CanApplyServiceCorrection(snapshot, now, out _))
        {
            var result = await dockerServiceManager.EnsureAutomaticAsync(startIfStopped: true, cancellationToken);
            cooldowns.MarkServiceCorrection(snapshot, now);
            logger.LogInformation(
                "L2 service correction: ok={Ok} StartMode={StartMode} elapsed_ms={Elapsed}",
                result.Ok,
                result.StartMode,
                (int)(DateTimeOffset.UtcNow - started).TotalMilliseconds);
        }
        else
        {
            logger.LogInformation("L2: service correction omitida por cooldown");
        }

        await processExecutor.RunAsync(
            "powershell",
            "-NoProfile -Command \"wsl -l -v | Out-Null\"",
            TimeoutMs(),
            cancellationToken);

        cooldowns.MarkApplied(RecoveryLevel.L2DockerDaemon, snapshot, now);
        snapshot.LastAutomaticAction = "L2:daemon-reconcile";
        return "L2 daemon/platform reconciled";
    }

    private async Task<string> ExecuteL3Async(
        SupervisorSnapshot snapshot,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        logger.LogWarning("recovery_level_applied=L3 reason=multi_component_or_persistent_drift");

        await processExecutor.RunAsync("docker", ComposeArgs("up -d"), 90_000, cancellationToken);

        var unhealthy = snapshot.Services
            .Where(s => !IsOperational(s.Status))
            .Select(s => s.Service)
            .ToList();

        var targets = unhealthy.Count > 0
            ? string.Join(' ', unhealthy)
            : string.Join(' ', _options.ExpectedServices);

        await processExecutor.RunAsync(
            "docker",
            ComposeArgs($"restart {targets}"),
            90_000,
            cancellationToken);

        cooldowns.MarkApplied(RecoveryLevel.L3ComposeLight, snapshot, now);
        snapshot.LastAutomaticAction = $"L3:compose-light {targets}";
        return $"L3 up -d + restart {targets}";
    }

    private async Task<string> ExecuteL4Async(
        SupervisorSnapshot snapshot,
        DateTimeOffset now,
        CancellationToken cancellationToken)
    {
        logger.LogWarning("recovery_level_applied=L4 reason=critical_persistent_drift");

        await processExecutor.RunAsync("docker", ComposeArgs("down"), 60_000, cancellationToken);
        await processExecutor.RunAsync("docker", ComposeArgs("up -d"), 120_000, cancellationToken);

        cooldowns.MarkApplied(RecoveryLevel.L4ComposeFull, snapshot, now);
        snapshot.LastAutomaticAction = "L4:compose-full";
        return "L4 compose down/up";
    }

    private static bool IsOperational(string status)
        => string.Equals(status, "running", StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, "healthy", StringComparison.OrdinalIgnoreCase)
            || string.Equals(status, "starting", StringComparison.OrdinalIgnoreCase);

    private int TimeoutMs() => Math.Max(5, _options.HealthTimeoutSeconds) * 1000;

    private string ComposeArgs(string command)
        => $"compose --project-directory \"{_options.ComposeProjectDir}\" -f \"{_options.ComposeFile}\" --env-file \"{_options.EnvFile}\" {command}";
}
