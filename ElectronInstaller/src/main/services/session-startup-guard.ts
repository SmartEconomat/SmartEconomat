import type { CommandResult, ExecutionContext } from "@shared/contracts";

import type { SupervisorLifecycleController } from "./supervisor-lifecycle.controller";
import { allowsElevation } from "./supervisor-policy";

export const STARTUP_SCRIPT_DEFERRED_CODE = "STARTUP_SCRIPT_DEFERRED";

export interface SessionStartupGuardOptions {
  lifecycle: SupervisorLifecycleController;
  /** App lanzada en login (--background / --control-panel) sin interacción del usuario. */
  autoStartedAtLogin: boolean;
}

export class SessionStartupGuard {
  constructor(private readonly options: SessionStartupGuardOptions) {}

  /** Bloquea cualquier script/proceso hijo desde Electron tras login automático. */
  shouldDeferElectronScripts(): boolean {
    return (
      this.options.autoStartedAtLogin &&
      this.options.lifecycle.isInBootGrace()
    );
  }

  /** UAC y RunAs quedan prohibidos durante la gracia de arranque de sesión. */
  allowsElevation(context: ExecutionContext): boolean {
    if (this.options.lifecycle.isInBootGrace()) {
      return false;
    }
    return allowsElevation(context);
  }

  getDeferralReason(): string {
    const remainingMs = this.options.lifecycle.getBootGraceRemainingMs();
    const minutes = Math.max(1, Math.ceil(remainingMs / 60_000));
    return `Arranque de Windows: scripts de Electron diferidos (~${minutes} min restantes de gracia de boot).`;
  }
}

let activeGuard: SessionStartupGuard | null = null;

export function configureSessionStartupGuard(
  guard: SessionStartupGuard | null,
): void {
  activeGuard = guard;
}

export function getSessionStartupGuard(): SessionStartupGuard | null {
  return activeGuard;
}

export function createDeferredCommandResult(): CommandResult {
  const reason =
    activeGuard?.getDeferralReason() ??
    "Arranque de Windows: ejecución de scripts desde Electron diferida.";
  return {
    ok: false,
    code: 1,
    stdout: "",
    stderr: reason,
    message: reason,
  };
}
