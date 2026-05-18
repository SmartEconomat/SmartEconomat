import { describe, expect, it } from "vitest";

import { SessionStartupGuard } from "../session-startup-guard";
import { SupervisorLifecycleController } from "../supervisor-lifecycle.controller";

describe("SessionStartupGuard", () => {
  it("diferencia scripts en login automático vs apertura manual", () => {
    const lifecycle = new SupervisorLifecycleController();
    const autoGuard = new SessionStartupGuard({
      lifecycle,
      autoStartedAtLogin: true,
    });
    const manualGuard = new SessionStartupGuard({
      lifecycle,
      autoStartedAtLogin: false,
    });

    expect(autoGuard.shouldDeferElectronScripts()).toBe(true);
    expect(manualGuard.shouldDeferElectronScripts()).toBe(false);
  });

  it("bloquea elevación durante gracia de boot aunque el contexto sea user-repair", () => {
    const lifecycle = new SupervisorLifecycleController();
    const guard = new SessionStartupGuard({
      lifecycle,
      autoStartedAtLogin: false,
    });

    expect(guard.allowsElevation("user-repair")).toBe(false);
    expect(guard.allowsElevation("install")).toBe(false);
  });
});
