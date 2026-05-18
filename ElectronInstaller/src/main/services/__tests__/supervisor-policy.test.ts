import { describe, expect, it } from "vitest";

import {
  allowsElevation,
  computeObserveIntervalMs,
  computeBackoffInterval,
  shouldRunRecovery,
} from "../supervisor-policy";

describe("supervisor-policy", () => {
  it("bloquea elevación en observe y runtime-auto-light", () => {
    expect(allowsElevation("observe")).toBe(false);
    expect(allowsElevation("runtime-auto-light")).toBe(false);
    expect(allowsElevation("user-repair")).toBe(true);
    expect(allowsElevation("install")).toBe(true);
  });

  it("usa intervalos más largos en OBSERVE_ONLY", () => {
    expect(computeObserveIntervalMs("OBSERVE_ONLY", 0)).toBeGreaterThan(
      computeObserveIntervalMs("RUNTIME", 0),
    );
  });

  it("aplica backoff exponencial con tope máximo", () => {
    expect(computeBackoffInterval(30_000, 1_800_000, 0)).toBe(30_000);
    expect(computeBackoffInterval(30_000, 1_800_000, 1)).toBe(60_000);
    expect(computeBackoffInterval(30_000, 1_800_000, 4)).toBe(480_000);
    expect(computeBackoffInterval(30_000, 120_000, 5)).toBe(120_000);
  });

  it("aplica cooldown entre reparaciones consecutivas", () => {
    const now = 100_000;
    const lastAttempt = 85_000;
    expect(shouldRunRecovery(now, lastAttempt, 20_000)).toBe(false);
    expect(shouldRunRecovery(now, lastAttempt, 10_000)).toBe(true);
  });
});
