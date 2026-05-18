namespace SmartEconomat.WindowsSupervisor.Tests;

internal static class ActualStateTestFactory
{
    public static ActualSystemState Healthy(
        bool inBootGrace = false,
        string startMode = "Automatic")
        => new()
        {
            InBootGrace = inBootGrace,
            DockerDaemonReachable = true,
            DockerServiceStartMode = startMode,
            DockerServiceRunning = true,
            DockerServiceMissing = false,
            Components =
            [
                Obs("docker", SignalHealth.Ok, "running"),
                Obs("postgres", SignalHealth.Ok, "healthy"),
                Obs("redis", SignalHealth.Ok, "healthy"),
                Obs("backend", SignalHealth.Ok, "healthy"),
                Obs("frontend", SignalHealth.Ok, "available"),
            ],
        };

    public static ActualSystemState ManualServiceDaemonUp(string startMode = "Manual")
        => new()
        {
            DockerDaemonReachable = true,
            DockerServiceStartMode = startMode,
            DockerServiceRunning = false,
            Components = Healthy().Components,
        };

    public static ActualSystemState ManualServiceDaemonUpInBootGrace(string startMode = "Manual")
        => new()
        {
            InBootGrace = true,
            DockerDaemonReachable = true,
            DockerServiceStartMode = startMode,
            DockerServiceRunning = false,
            Components = Healthy().Components,
        };

    public static ActualSystemState DaemonDown(string startMode = "Automatic", bool serviceRunning = true)
        => new()
        {
            DockerDaemonReachable = false,
            DockerServiceStartMode = startMode,
            DockerServiceRunning = serviceRunning,
            Components = [Obs("docker", SignalHealth.Critical, "unreachable")],
        };

    public static ActualSystemState ServiceMissing()
        => new()
        {
            DockerServiceMissing = true,
            DockerDaemonReachable = false,
        };

    public static ActualSystemState ServiceMissingDaemonUp()
        => new()
        {
            DockerServiceMissing = true,
            DockerDaemonReachable = true,
            Components = Healthy().Components,
        };

    public static ActualSystemState SingleUnhealthy(string componentId, bool inBootGrace = false)
    {
        var components = Healthy().Components
            .Select(c => c.Id == componentId
                ? Obs(componentId, SignalHealth.Unhealthy, "unhealthy")
                : c)
            .ToList();

        return new ActualSystemState
        {
            InBootGrace = inBootGrace,
            DockerDaemonReachable = true,
            DockerServiceStartMode = "Automatic",
            DockerServiceRunning = true,
            Components = components,
        };
    }

    public static ActualSystemState MultipleUnhealthy(params string[] componentIds)
    {
        var set = new HashSet<string>(componentIds, StringComparer.OrdinalIgnoreCase);
        var components = Healthy().Components
            .Select(c => set.Contains(c.Id)
                ? Obs(c.Id, SignalHealth.Unhealthy, "unhealthy")
                : c)
            .ToList();

        return new ActualSystemState
        {
            DockerDaemonReachable = true,
            DockerServiceStartMode = "Automatic",
            DockerServiceRunning = true,
            Components = components,
        };
    }

    public static ActualSystemState RedisDegradedOnly()
    {
        var components = Healthy().Components
            .Select(c => c.Id == "redis"
                ? Obs("redis", SignalHealth.Degraded, "starting")
                : c)
            .ToList();

        return new ActualSystemState
        {
            DockerDaemonReachable = true,
            DockerServiceStartMode = "Automatic",
            DockerServiceRunning = true,
            Components = components,
        };
    }

    public static ActualSystemState BackendCriticalOnly()
        => new()
        {
            DockerDaemonReachable = true,
            DockerServiceStartMode = "Automatic",
            DockerServiceRunning = true,
            Components =
            [
                Obs("docker", SignalHealth.Ok, "running"),
                Obs("backend", SignalHealth.Critical, "dead"),
            ],
        };

    public static SupervisorSnapshot Snapshot(int driftCycles = 0, DateTimeOffset? lastL3 = null)
        => new()
        {
            ConsecutiveDriftCycles = driftCycles,
            ConsecutiveFailures = driftCycles,
            LastL3RecoveryAt = lastL3,
        };

    private static ComponentObservation Obs(string id, SignalHealth health, string observed)
        => new()
        {
            Id = id,
            Label = id,
            Observed = observed,
            Health = health,
            Detail = $"test {id}",
        };
}
