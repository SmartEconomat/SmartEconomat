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
        if (options.WatchdogIntervalSeconds < 10)
        {
            throw new InvalidOperationException("WatchdogIntervalSeconds debe ser >= 10.");
        }

        if (options.ExpectedServices.Count == 0)
        {
            throw new InvalidOperationException("ExpectedServices no puede estar vacío.");
        }
    }
}
