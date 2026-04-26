using Microsoft.Extensions.Options;

namespace SmartEconomat.WindowsSupervisor;

public sealed class SupervisorWorker(
    ILogger<SupervisorWorker> logger,
    IOptions<SupervisorOptions> optionsAccessor,
    StateStore stateStore,
    DockerSupervisor dockerSupervisor) : BackgroundService
{
    private readonly SupervisorOptions _options = optionsAccessor.Value;

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Supervisor arrancado. Intervalo {Interval}s", _options.WatchdogIntervalSeconds);

        var previousSnapshot = await stateStore.LoadAsync(stoppingToken) ?? new SupervisorSnapshot();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var snapshot = await dockerSupervisor.EvaluateAndRepairAsync(previousSnapshot, stoppingToken);
                await stateStore.SaveAsync(snapshot, stoppingToken);
                previousSnapshot = snapshot;

                logger.LogInformation(
                    "Estado={Overall} Docker={Docker} Compose={Compose} LocalWeb={LocalWeb} PublicWeb={PublicWeb} Failures={Failures}",
                    snapshot.Overall,
                    snapshot.DockerDaemonReady,
                    snapshot.ComposeHealthy,
                    snapshot.LocalWebHealthy,
                    snapshot.PublicWebHealthy,
                    snapshot.ConsecutiveFailures);
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Error inesperado en ciclo de supervisión");
            }

            await Task.Delay(TimeSpan.FromSeconds(_options.WatchdogIntervalSeconds), stoppingToken);
        }
    }
}
