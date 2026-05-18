import { describe, expect, it, beforeEach } from "vitest";

import {
  computeAdaptiveBootGraceEndMs,
  isInBootGrace,
  recordObservation,
  resetIncidentObservations,
} from "../incident-policy";
import { BOOT_GRACE_MS } from "../supervisor-policy";

describe("incident-policy", () => {
  beforeEach(() => {
    resetIncidentObservations();
  });

  it("no abre incidente durante OBSERVE_ONLY", () => {
    const decision = recordObservation("docker-engine", true, 1_000, "OBSERVE_ONLY");
    expect(decision).toBe("wait");
  });

  it("requiere K observaciones en RUNTIME", () => {
    const base = 10_000;
    expect(recordObservation("stack", true, base, "RUNTIME")).toBe("wait");
    expect(recordObservation("stack", true, base + 91_000, "RUNTIME")).toBe("wait");
    expect(recordObservation("stack", true, base + 182_000, "RUNTIME")).toBe(
      "eligible-for-light-repair",
    );
  });

  it("extiende gracia en equipos lentos", () => {
    const start = 0;
    const baseEnd = computeAdaptiveBootGraceEndMs(start, 0);
    expect(baseEnd).toBe(BOOT_GRACE_MS);
    const extended = computeAdaptiveBootGraceEndMs(start, 6);
    expect(extended).toBeGreaterThan(baseEnd);
    expect(isInBootGrace(start, extended - 1, 6)).toBe(true);
  });
});
