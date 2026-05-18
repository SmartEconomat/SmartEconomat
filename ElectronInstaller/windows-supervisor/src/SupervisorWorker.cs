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
        logger.LogInformation(
            "Supervisor reconciliación arrancada. Intervalo={Interval}s desired_state={Desired} "
            + "L1cooldown={L1}s L2cooldown={L2}s L3cooldown={L3}s L4cooldown={L4}s",
            _options.WatchdogIntervalSeconds,
            DesiredStateCatalog.Summarize(),
            _options.ContainerRecoveryCooldownSeconds,
            _options.DockerRecoveryCooldownSeconds,
            _options.ComposeLightRecoveryCooldownSeconds,
            _options.ComposeFullRecoveryCooldownSeconds);

        var previousSnapshot = await stateStore.LoadAsync(stoppingToken) ?? new SupervisorSnapshot();

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var snapshot = await dockerSupervisor.EvaluateAndRepairAsync(previousSnapshot, stoppingToken);
                await stateStore.SaveAsync(snapshot, stoppingToken);
                previousSnapshot = snapshot;
            }
            catch (Exception exception)
            {
                logger.LogError(exception, "Error inesperado en ciclo de supervisión");
            }

            await Task.Delay(TimeSpan.FromSeconds(_options.WatchdogIntervalSeconds), stoppingToken);
        }
    }
}
