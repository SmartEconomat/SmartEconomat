using Microsoft.Extensions.Options;

namespace SmartEconomat.WindowsSupervisor;

/// <summary>Cooldowns desacoplados por nivel de recuperación.</summary>
public sealed class CooldownRegistry(
    ILogger<CooldownRegistry> logger,
    IOptions<SupervisorOptions> optionsAccessor)
{
    private readonly SupervisorOptions _options = optionsAccessor.Value;
    private string? _lastLoggedKey;

    public bool CanApply(RecoveryLevel level, SupervisorSnapshot previous, DateTimeOffset now, out string? blockReason)
    {
        var (lastAt, cooldownSeconds, name) = level switch
        {
            RecoveryLevel.L1Container => (previous.LastL1RecoveryAt, _options.ContainerRecoveryCooldownSeconds, "L1-container"),
            RecoveryLevel.L2DockerDaemon => (previous.LastL2RecoveryAt, _options.DockerRecoveryCooldownSeconds, "L2-daemon"),
            RecoveryLevel.L3ComposeLight => (previous.LastL3RecoveryAt, _options.ComposeLightRecoveryCooldownSeconds, "L3-compose-light"),
            RecoveryLevel.L4ComposeFull => (previous.LastL4RecoveryAt, _options.ComposeFullRecoveryCooldownSeconds, "L4-compose-full"),
            _ => (null, 0, "none"),
        };

        if (level == RecoveryLevel.None)
        {
            blockReason = null;
            return false;
        }

        if (lastAt is null)
        {
            blockReason = null;
            return true;
        }

        var elapsed = (now - lastAt.Value).TotalSeconds;
        if (elapsed >= cooldownSeconds)
        {
            blockReason = null;
            return true;
        }

        var remaining = (int)(cooldownSeconds - elapsed);
        blockReason = $"{name}: cooldown_active, remaining_seconds={remaining}";
        LogCooldownOnce(name, remaining);
        return false;
    }

    public bool CanApplyServiceCorrection(SupervisorSnapshot previous, DateTimeOffset now, out string? blockReason)
    {
        if (previous.LastServiceCorrectionAt is null)
        {
            blockReason = null;
            return true;
        }

        var elapsed = (now - previous.LastServiceCorrectionAt.Value).TotalSeconds;
        if (elapsed >= _options.ServiceCorrectionCooldownSeconds)
        {
            blockReason = null;
            return true;
        }

        var remaining = (int)(_options.ServiceCorrectionCooldownSeconds - elapsed);
        blockReason = $"service-correction: cooldown_active, remaining_seconds={remaining}";
        LogCooldownOnce("service-correction", remaining);
        return false;
    }

    public void MarkApplied(RecoveryLevel level, SupervisorSnapshot snapshot, DateTimeOffset now)
    {
        switch (level)
        {
            case RecoveryLevel.L1Container:
                snapshot.LastL1RecoveryAt = now;
                break;
            case RecoveryLevel.L2DockerDaemon:
                snapshot.LastL2RecoveryAt = now;
                snapshot.LastDockerRecoveryAt = now;
                break;
            case RecoveryLevel.L3ComposeLight:
                snapshot.LastL3RecoveryAt = now;
                snapshot.LastComposeLightRecoveryAt = now;
                break;
            case RecoveryLevel.L4ComposeFull:
                snapshot.LastL4RecoveryAt = now;
                snapshot.LastComposeStrongRecoveryAt = now;
                break;
        }

        snapshot.LastAutomaticActionAt = now;
    }

    public void MarkServiceCorrection(SupervisorSnapshot snapshot, DateTimeOffset now)
    {
        snapshot.LastServiceCorrectionAt = now;
    }

    private void LogCooldownOnce(string action, int remainingSeconds)
    {
        var key = $"{action}:{remainingSeconds / 60}";
        if (string.Equals(_lastLoggedKey, key, StringComparison.Ordinal))
        {
            return;
        }

        _lastLoggedKey = key;
        logger.LogInformation(
            "cooldown_active_reason={CooldownReason}",
            $"{action} (~{remainingSeconds}s restantes)");
    }
}
