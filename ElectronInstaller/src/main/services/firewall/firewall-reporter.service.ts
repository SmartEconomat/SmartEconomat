import type {
  FirewallEnsureSummary,
  FirewallVerificationResult,
} from "./firewall.types";

/** Servicio del proceso principal: FirewallReporterService. */
export class FirewallReporterService {
  /**
   * Expone la operación "report" del instalador SmartEconomat.
   * @param {FirewallEnsureSummary} summary - Entrada esperada por la función.
   * @returns {FirewallEnsureSummary} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  report(summary: FirewallEnsureSummary): FirewallEnsureSummary {
    return summary;
  }

  /**
   * Expone la operación "buildUserMessage" del instalador SmartEconomat.
   * @param {FirewallVerificationResult} verification - Entrada esperada por la función.
   * @returns {{ canContinue: boolean; warningCode?: string; message: string; }} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  buildUserMessage(verification: FirewallVerificationResult): {
    canContinue: boolean;
    warningCode?: string;
    message: string;
  } {
    if (verification.connectivityChecksDeferred) {
      if (verification.rulesConsistent) {
        return {
          canContinue: true,
          warningCode: "FIREWALL_PRE_HOSTS_CONNECTIVITY_DEFERRED",
          message:
            "Firewall (antes de mapear hosts): reglas validadas. Conectividad HTTP(S) al dominio local se comprueba después de escribir hosts y, más adelante, cuando el stack esté arriba.",
        };
      }
      return {
        canContinue: true,
        warningCode: "FIREWALL_RULES_INCONSISTENT_PRE_HOSTS_CONTINUE",
        message:
          "No se pudieron validar completamente las reglas de Windows Firewall antes de continuar. La instalación seguirá con advertencia; revisa permisos o reglas manualmente después del despliegue.",
      };
    }

    const localOk =
      verification.connectivity.localDomainHttps ||
      verification.connectivity.localhostHttps ||
      verification.connectivity.localDomainHttp ||
      verification.connectivity.localhostHttp;

    if (localOk && verification.rulesConsistent) {
      return {
        canContinue: true,
        message:
          "Firewall validado y conectividad local confirmada para SmartEconomat.",
      };
    }

    if (localOk) {
      return {
        canContinue: true,
        warningCode: "FIREWALL_DEGRADED_CONTINUE",
        message:
          "Windows no permitió dejar el firewall en estado ideal, pero SmartEconomat responde localmente. Se continúa con advertencia.",
      };
    }

    const localhostRefused =
      verification.connectivity.localhostHttpErrorCode === "ECONNREFUSED" &&
      verification.connectivity.localhostHttpsErrorCode === "ECONNREFUSED";

    const stackLikelyDown =
      verification.rulesConsistent &&
      verification.connectivity.listeningPorts.length === 0 &&
      localhostRefused;

    if (stackLikelyDown) {
      return {
        canContinue: true,
        warningCode: "FIREWALL_OK_STACK_NOT_LISTENING",
        message:
          "Firewall y reglas locales validadas, pero no hay servicios escuchando aún en los puertos configurados (normal antes de levantar Docker). Se continúa; la verificación final ocurrirá tras el despliegue.",
      };
    }

    return {
      canContinue: true,
      warningCode: "FIREWALL_CONNECTIVITY_BLOCKED_CONTINUE",
      message:
        "No se pudo confirmar conectividad local durante la verificación de firewall. La instalación seguirá con advertencia; valida conectividad y reglas manualmente al finalizar.",
    };
  }
}
