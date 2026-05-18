using Microsoft.Extensions.Options;
using Xunit;

namespace SmartEconomat.WindowsSupervisor.Tests;

public sealed class DriftAnalyzerTests
{
    private static DriftAnalyzer CreateAnalyzer(
        int persistenceThreshold = 3,
        int l1PersistenceThreshold = 2)
    {
        var options = Options.Create(new SupervisorOptions
        {
            PersistenceThreshold = persistenceThreshold,
            L1PersistenceThreshold = l1PersistenceThreshold,
        });
        return new DriftAnalyzer(options);
    }

    [Fact]
    public void SinDrift_EstadoSaludable_NoAplicaRecuperacion()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.Healthy(),
            ActualStateTestFactory.Snapshot());

        Assert.Empty(plan.Drifts);
        Assert.Equal(SignalHealth.Ok, plan.OverallHealth);
        Assert.Equal(RecoveryLevel.None, plan.LevelToApply);
        Assert.Equal("aligned: no drift", plan.Reason);
    }

    [Fact]
    public void BootGrace_ConDriftNoCritico_SoloObserva()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.SingleUnhealthy("backend", inBootGrace: true),
            ActualStateTestFactory.Snapshot());

        Assert.NotEmpty(plan.Drifts);
        Assert.Equal(RecoveryLevel.None, plan.LevelToApply);
        Assert.Equal("boot_grace: observe_only", plan.Reason);
    }

    [Fact]
    public void ManualConDaemonAccesible_NoGeneraDriftNiNivelL2()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.ManualServiceDaemonUp(),
            ActualStateTestFactory.Snapshot());

        Assert.DoesNotContain(plan.Drifts, d => d.ComponentId == "docker-platform");
        Assert.Equal(SignalHealth.Ok, plan.OverallHealth);
        Assert.Equal(RecoveryLevel.None, plan.LevelToApply);
        Assert.Equal("aligned: no drift", plan.Reason);
    }

    [Fact]
    public void ServicioWindowsAusenteConDaemonAccesible_NoGeneraDrift()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.ServiceMissingDaemonUp(),
            ActualStateTestFactory.Snapshot());

        Assert.Empty(plan.Drifts);
        Assert.Equal(SignalHealth.Ok, plan.OverallHealth);
        Assert.Equal(RecoveryLevel.None, plan.LevelToApply);
    }

    [Fact]
    public void DaemonInaccesible_DriftCritico_NivelL2()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.DaemonDown(),
            ActualStateTestFactory.Snapshot());

        Assert.Contains(plan.Drifts, d => d.ComponentId == "docker");
        Assert.Equal(SignalHealth.Critical, plan.Drifts.First(d => d.ComponentId == "docker").Severity);
        Assert.Equal(RecoveryLevel.L2DockerDaemon, plan.LevelToApply);
    }

    [Fact]
    public void ServicioWindowsAusenteConDaemonCaido_DriftCritico_NivelL2()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.ServiceMissing(),
            ActualStateTestFactory.Snapshot());

        Assert.Single(plan.Drifts);
        Assert.Equal("docker", plan.Drifts[0].ComponentId);
        Assert.Equal(SignalHealth.Critical, plan.Drifts[0].Severity);
        Assert.Equal(RecoveryLevel.L2DockerDaemon, plan.LevelToApply);
    }

    [Fact]
    public void UnContenedorUnhealthy_SinPersistencia_Espera()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.SingleUnhealthy("backend"),
            ActualStateTestFactory.Snapshot(driftCycles: 0));

        Assert.Equal(RecoveryLevel.None, plan.LevelToApply);
        Assert.Contains("awaiting_persistence=0", plan.Reason, StringComparison.Ordinal);
    }

    [Fact]
    public void UnContenedorUnhealthy_ConPersistenciaL1_AplicaL1()
    {
        var analyzer = CreateAnalyzer(l1PersistenceThreshold: 2);
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.SingleUnhealthy("backend"),
            ActualStateTestFactory.Snapshot(driftCycles: 2));

        Assert.Equal(RecoveryLevel.L1Container, plan.LevelToApply);
        Assert.Contains("backend", plan.L1TargetServices, StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void PostgresUnhealthy_MapeaTargetComposeDb()
    {
        var analyzer = CreateAnalyzer(l1PersistenceThreshold: 2);
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.SingleUnhealthy("postgres"),
            ActualStateTestFactory.Snapshot(driftCycles: 2));

        Assert.Equal(RecoveryLevel.L1Container, plan.LevelToApply);
        Assert.Contains("db", plan.L1TargetServices, StringComparer.OrdinalIgnoreCase);
    }

    [Fact]
    public void DosComponentesUnhealthy_ConPersistenciaL3_AplicaL3()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.MultipleUnhealthy("backend", "redis"),
            ActualStateTestFactory.Snapshot(driftCycles: 3));

        Assert.Equal(RecoveryLevel.L3ComposeLight, plan.LevelToApply);
    }

    [Fact]
    public void CriticoPersistenteTrasL3_AplicaL4()
    {
        var analyzer = CreateAnalyzer(persistenceThreshold: 3);
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.BackendCriticalOnly(),
            ActualStateTestFactory.Snapshot(
                driftCycles: 5,
                lastL3: DateTimeOffset.UtcNow.AddHours(-1)));

        Assert.Equal(RecoveryLevel.L4ComposeFull, plan.LevelToApply);
    }

    [Fact]
    public void ComponenteDegraded_NoGeneraDriftNiRecuperacion()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.RedisDegradedOnly(),
            ActualStateTestFactory.Snapshot());

        Assert.DoesNotContain(plan.Drifts, d => d.ComponentId == "redis");
        Assert.Equal(RecoveryLevel.None, plan.LevelToApply);
    }

    [Fact]
    public void ManualEnBootGraceConDaemonAccesible_NoGeneraDrift()
    {
        var analyzer = CreateAnalyzer();
        var plan = analyzer.BuildPlan(
            ActualStateTestFactory.ManualServiceDaemonUpInBootGrace(),
            ActualStateTestFactory.Snapshot());

        Assert.Empty(plan.Drifts);
        Assert.Equal(SignalHealth.Degraded, plan.OverallHealth);
        Assert.Equal(RecoveryLevel.None, plan.LevelToApply);
        Assert.Equal("boot_grace: observe_only", plan.Reason);
    }
}
