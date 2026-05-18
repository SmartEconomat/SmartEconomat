import fs from "node:fs/promises";
import path from "node:path";

import { app } from "electron";

import type { DockerRuntimeState, WatchdogState } from "@shared/contracts";

export type { WatchdogState };

export interface GuardianPersistedState {
  schemaVersion: number;
  consecutiveFailures: number;
  lastHealthCheck: string;
  lastRecoveryAction: string;
  lastRecoveryLevel: 1 | 2 | 3 | 4 | 5 | 6 | null;
  watchdogState: WatchdogState;
  lastDockerDesktopRestart: string;
  lastDockerState: DockerRuntimeState;
  lastDockerDetail: string;
  totalRecoveriesPerformed: number;
}

const DEFAULT_STATE: GuardianPersistedState = {
  schemaVersion: 1,
  consecutiveFailures: 0,
  lastHealthCheck: "",
  lastRecoveryAction: "",
  lastRecoveryLevel: null,
  watchdogState: "idle",
  lastDockerDesktopRestart: "",
  lastDockerState: "daemon-starting",
  lastDockerDetail: "",
  totalRecoveriesPerformed: 0,
};

/**
 * Servicio de persistencia para el estado del BootGuardian.
 * Almacena el estado en un archivo JSON en %APPDATA%/SmartEconomatInstaller/
 * para que sobreviva a reinicios de la app Electron.
 */
export class GuardianStateService {
  private readonly stateFilePath: string;
  private state: GuardianPersistedState = { ...DEFAULT_STATE };

  constructor() {
    this.stateFilePath = path.join(
      app.getPath("appData"),
      "SmartEconomatInstaller",
      "guardian-state.json",
    );
  }

  async load(): Promise<GuardianPersistedState> {
    try {
      const raw = await fs.readFile(this.stateFilePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<GuardianPersistedState>;
      this.state = this.normalizeState(parsed);
      // Cold boot: no heredar agresividad de recuperación de sesiones anteriores.
      this.state.consecutiveFailures = 0;
      this.state.lastRecoveryLevel = null;
      this.state.watchdogState = "idle";
    } catch {
      this.state = { ...DEFAULT_STATE };
    }
    return this.state;
  }

  get(): GuardianPersistedState {
    return { ...this.state };
  }

  async update(
    patch: Partial<GuardianPersistedState>,
  ): Promise<GuardianPersistedState> {
    this.state = { ...this.state, ...patch };
    await this.persist();
    return this.state;
  }

  async reset(): Promise<void> {
    this.state = { ...DEFAULT_STATE };
    await this.persist();
  }

  private async persist(): Promise<void> {
    const dir = path.dirname(this.stateFilePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(
      this.stateFilePath,
      JSON.stringify(this.state, null, 2),
      "utf8",
    );
  }

  private normalizeState(
    parsed: Partial<GuardianPersistedState>,
  ): GuardianPersistedState {
    const merged = { ...DEFAULT_STATE, ...parsed };

    if (typeof parsed.schemaVersion !== "number") {
      merged.schemaVersion = 1;
    }

    if (
      merged.lastDockerState !== "not-installed" &&
      merged.lastDockerState !== "desktop-not-running" &&
      merged.lastDockerState !== "daemon-starting" &&
      merged.lastDockerState !== "daemon-ready" &&
      merged.lastDockerState !== "daemon-error" &&
      merged.lastDockerState !== "compose-error" &&
      merged.lastDockerState !== "recovery-in-progress"
    ) {
      merged.lastDockerState = DEFAULT_STATE.lastDockerState;
    }

    return merged;
  }
}
