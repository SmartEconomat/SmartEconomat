using Microsoft.Extensions.Options;
using Serilog;

namespace SmartEconomat.WindowsSupervisor;

public static class Program
{
    public static async Task Main(string[] args)
    {
        Directory.CreateDirectory(@"C:\ProgramData\SmartEconomat\logs");
        Directory.CreateDirectory(@"C:\ProgramData\SmartEconomat\state");

        var builder = Host.CreateApplicationBuilder(args);
        builder.Services.AddWindowsService(options =>
        {
            options.ServiceName = "SmartEconomatSupervisor";
        });

        builder.Services.Configure<SupervisorOptions>(builder.Configuration.GetSection("Supervisor"));
        builder.Services.AddSingleton<StateStore>();
        builder.Services.AddSingleton<ProcessExecutor>();
        builder.Services.AddSingleton<ComDockerServiceManager>();
        builder.Services.AddSingleton<ActualStateCollector>();
        builder.Services.AddSingleton<DriftAnalyzer>();
        builder.Services.AddSingleton<CooldownRegistry>();
        builder.Services.AddSingleton<ReconciliationExecutor>();
        builder.Services.AddSingleton<StateReconciler>();
        builder.Services.AddSingleton<DockerSupervisor>();
        builder.Services.AddHostedService<SupervisorWorker>();

        Log.Logger = new LoggerConfiguration()
            .ReadFrom.Configuration(builder.Configuration)
            .Enrich.FromLogContext()
            .CreateLogger();

        builder.Services.AddSerilog();

        using var host = builder.Build();
        ValidateOptions(host.Services.GetRequiredService<IOptions<SupervisorOptions>>().Value);
        await host.RunAsync();
    }

    private static void ValidateOptions(SupervisorOptions options)
    {
        if (options.WatchdogIntervalSeconds is < 120 or > 300)
        {
            throw new InvalidOperationException(
                "WatchdogIntervalSeconds debe estar entre 120 y 300 segundos (2–5 min).");
        }

        if (options.ExpectedServices.Count == 0)
        {
            throw new InvalidOperationException("ExpectedServices no puede estar vacío.");
        }

        if (!File.Exists(options.ComposeFile))
        {
            Log.Warning(
                "ComposeFile no encontrado en {ComposeFile}. Reconciliación continuará cuando exista.",
                options.ComposeFile);
        }
    }
}
