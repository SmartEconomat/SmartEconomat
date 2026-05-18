namespace SmartEconomat.WindowsSupervisor;

/// <summary>Punto de entrada del ciclo de supervisión; delega en reconciliación por estado deseado.</summary>
public sealed class DockerSupervisor(StateReconciler reconciler)
{
    public Task<SupervisorSnapshot> EvaluateAndRepairAsync(
        SupervisorSnapshot previous,
        CancellationToken cancellationToken)
        => reconciler.ReconcileAsync(previous, cancellationToken);
}
