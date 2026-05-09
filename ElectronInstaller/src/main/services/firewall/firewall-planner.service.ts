import type {
  FirewallDetectionResult,
  FirewallPlan,
  FirewallPlanOperation,
} from "./firewall.types";

function buildRuleName(port: number): string {
  return `SmartEconomat Local Port (${port})`;
}

/** Servicio del proceso principal: FirewallPlannerService. */
export class FirewallPlannerService {
  /**
   * Expone la operación "buildPlan" del instalador SmartEconomat.
   * @param {FirewallDetectionResult} detection - Entrada esperada por la función.
   * @returns {FirewallPlan} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  buildPlan(detection: FirewallDetectionResult): FirewallPlan {
    if (!detection.isWindows) {
      return {
        action: "noop",
        severity: "warning",
        operations: [],
        summary: "Sistema no Windows: firewall local no requerido.",
        canContinue: true,
      };
    }

    const operations: FirewallPlanOperation[] = [];
    const desiredPorts = detection.ports;
    const invalidOrMissing = new Set<number>();

    for (const port of desiredPorts) {
      const candidates = detection.rules.filter(
        (rule) => rule.localPort === port,
      );
      const matching = candidates.find(
        (rule) =>
          rule.direction === "Inbound" &&
          rule.action === "Allow" &&
          rule.enabled &&
          rule.protocol.toUpperCase() === "TCP" &&
          /Domain|Private/i.test(rule.profileRaw),
      );

      if (!matching) {
        invalidOrMissing.add(port);
      }

      if (candidates.length > 1) {
        for (let index = 1; index < candidates.length; index += 1) {
          operations.push({
            type: "delete",
            port,
            ruleName: candidates[index]?.ruleName ?? buildRuleName(port),
            reason: "Consolidar reglas duplicadas para el mismo puerto",
          });
        }
      }
    }

    for (const port of invalidOrMissing) {
      operations.push({
        type: "create",
        port,
        ruleName: buildRuleName(port),
        reason: "Regla ausente o inconsistente",
      });
    }

    if (operations.length === 0) {
      return {
        action: "noop",
        severity: "warning",
        operations: [],
        summary: "Reglas firewall consistentes; no se requieren cambios.",
        canContinue: true,
      };
    }

    const action = detection.duplicatePorts.length > 0 ? "replace" : "update";
    const severity = detection.isAdminLikely ? "degraded" : "warning";
    return {
      action,
      severity,
      operations,
      summary: `Plan firewall generado con ${operations.length} operación(es).`,
      canContinue: true,
    };
  }
}
