import { describe, expect, it, vi } from "vitest";

import { FirewallFacadeService } from "@main/services/firewall/firewall-facade.service";

import type {
  FirewallDetectionResult,
  FirewallExecutionResult,
  FirewallPlan,
  FirewallVerificationResult,
} from "@main/services/firewall/firewall.types";

function baseDetection(): FirewallDetectionResult {
  return {
    isWindows: true,
    ports: [80, 443],
    isAdminLikely: true,
    rules: [],
    legacyRuleCount: 0,
    duplicatePorts: [],
    detectionErrors: [],
  };
}

function basePlan(): FirewallPlan {
  return {
    action: "noop",
    severity: "warning",
    operations: [],
    summary: "noop",
    canContinue: true,
  };
}

function baseExecution(): FirewallExecutionResult {
  return {
    ok: true,
    usedElevation: false,
    usedFallbackNetsh: false,
    timedOut: false,
    steps: [],
    errors: [],
  };
}

function baseVerification(): FirewallVerificationResult {
  return {
    rulesConsistent: true,
    message: "ok",
    connectivity: {
      localhostHttp: true,
      localhostHttps: true,
      localDomainHttp: true,
      localDomainHttps: true,
      dnsLoopback: true,
      listeningPorts: [80, 443],
      lanProbeAttempted: true,
      lanProbeOk: true,
    },
  };
}

function createFacade(overrides?: {
  detection?: Partial<FirewallDetectionResult>;
  plan?: Partial<FirewallPlan>;
  execution?: Partial<FirewallExecutionResult>;
  verification?: Partial<FirewallVerificationResult>;
}) {
  const detector = {
    detect: vi.fn().mockResolvedValue({
      ...baseDetection(),
      ...(overrides?.detection ?? {}),
    }),
  };
  const planner = {
    buildPlan: vi
      .fn()
      .mockReturnValue({ ...basePlan(), ...(overrides?.plan ?? {}) }),
  };
  const executor = {
    execute: vi.fn().mockResolvedValue({
      ...baseExecution(),
      ...(overrides?.execution ?? {}),
    }),
  };
  const verifier = {
    verify: vi.fn().mockResolvedValue({
      ...baseVerification(),
      ...(overrides?.verification ?? {}),
    }),
  };

  const facade = new FirewallFacadeService(
    detector as never,
    planner as never,
    executor as never,
    verifier as never,
  );

  return { facade, detector, planner, executor, verifier };
}

const context = {
  httpPort: 80,
  httpsPort: 443,
  host: "smarteconomat.app",
  runtimePath: "C:/SmartEconomatRuntime",
  log: vi.fn(),
};

describe("FirewallFacadeService chaos matrix", () => {
  it("TEST 1: regla correcta ya existe => no tocar, éxito", async () => {
    const { facade, executor } = createFacade({
      plan: { action: "noop", operations: [] },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.warningCode).toBeUndefined();
    expect(executor.execute).toHaveBeenCalledOnce();
  });

  it("TEST 2: regla con puerto incorrecto => detectar mismatch y corregir", async () => {
    const { facade } = createFacade({
      plan: {
        action: "replace",
        operations: [
          {
            type: "create",
            port: 443,
            ruleName: "SmartEconomat Local Port (443)",
            reason: "mismatch",
          },
        ],
      },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.diagnostics.plan.operations.length).toBe(1);
  });

  it("TEST 3: regla duplicada x3 => consolidar", async () => {
    const { facade } = createFacade({
      detection: { duplicatePorts: [443] },
      plan: {
        action: "replace",
        operations: [
          {
            type: "delete",
            port: 443,
            ruleName: "SmartEconomat Local Port (443) duplicate",
            reason: "dup",
          },
        ],
      },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.diagnostics.plan.action).toBe("replace");
  });

  it("TEST 4: sin permisos admin => warning + fallback", async () => {
    const { facade } = createFacade({
      detection: { isAdminLikely: false },
      execution: { ok: false, usedFallbackNetsh: true },
      verification: {
        rulesConsistent: false,
        connectivity: {
          ...baseVerification().connectivity,
          localDomainHttps: true,
        },
      },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.warningCode).toBe("FIREWALL_DEGRADED_CONTINUE");
  });

  it("TEST 5: PowerShell falla => retry con fallback netsh", async () => {
    const { facade } = createFacade({
      execution: {
        ok: true,
        usedFallbackNetsh: true,
      },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.diagnostics.execution.usedFallbackNetsh).toBe(true);
  });

  it("TEST 5b: pre-hosts (probes diferidos) + reglas OK => continuar con aviso", async () => {
    const { facade } = createFacade({
      verification: {
        rulesConsistent: true,
        connectivityChecksDeferred: true,
        connectivity: {
          localhostHttp: false,
          localhostHttps: false,
          localDomainHttp: false,
          localDomainHttps: false,
          dnsLoopback: false,
          listeningPorts: [],
          lanProbeAttempted: false,
          lanProbeOk: true,
        },
        message:
          "Verificación de firewall (pre-hosts): reglas validadas; conectividad HTTP completa se validará tras mapear hosts.",
      },
    });
    const result = await facade.ensure({
      ...context,
      verificationMode: "preHostMapping",
    });
    expect(result.ok).toBe(true);
    expect(result.warningCode).toBe("FIREWALL_PRE_HOSTS_CONNECTIVITY_DEFERRED");
  });

  it("TEST 6: regla OK pero conectividad KO => diagnosticar servicio real", async () => {
    const { facade } = createFacade({
      verification: {
        rulesConsistent: true,
        connectivity: {
          ...baseVerification().connectivity,
          localhostHttp: false,
          localhostHttps: false,
          localDomainHttp: false,
          localDomainHttps: false,
          listeningPorts: [80],
          localhostHttpErrorCode: "ECONNRESET",
          localhostHttpsErrorCode: "ECONNRESET",
        },
      },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.warningCode).toBe("FIREWALL_CONNECTIVITY_BLOCKED_CONTINUE");
  });

  it("TEST 7: sin reglas pero localhost funciona => continuar con warning", async () => {
    const { facade } = createFacade({
      verification: {
        rulesConsistent: false,
        connectivity: {
          ...baseVerification().connectivity,
          localDomainHttps: false,
          localhostHttps: true,
        },
      },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.warningCode).toBe("FIREWALL_DEGRADED_CONTINUE");
  });

  it("TEST 8: GPO bloquea cambios => informar claramente", async () => {
    const { facade } = createFacade({
      execution: { ok: false, errors: ["managed by your administrator"] },
      verification: {
        rulesConsistent: false,
        connectivity: {
          ...baseVerification().connectivity,
          localhostHttps: true,
        },
      },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.userMessage.toLowerCase()).toContain("windows");
  });

  it("TEST 9: timeout comando Windows => continuar si local responde", async () => {
    const { facade } = createFacade({
      execution: { ok: false, timedOut: true, errors: ["Command timed out"] },
      verification: {
        rulesConsistent: false,
        connectivity: {
          ...baseVerification().connectivity,
          localhostHttps: true,
        },
      },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.diagnostics.execution.timedOut).toBe(true);
  });

  it("TEST 10: cambio red pública/privada => revalidar perfiles sin bloqueo", async () => {
    const { facade } = createFacade({
      verification: {
        rulesConsistent: false,
        connectivity: {
          ...baseVerification().connectivity,
          localDomainHttps: true,
        },
      },
    });
    const result = await facade.ensure(context);
    expect(result.ok).toBe(true);
    expect(result.warningCode).toBe("FIREWALL_DEGRADED_CONTINUE");
  });
});
