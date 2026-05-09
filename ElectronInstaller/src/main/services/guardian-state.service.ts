import fs from "node:fs/promises";
import path from "node:path";

import { app } from "electron";

import type { DockerRuntimeState, WatchdogState } from "@shared/contracts";

export type { WatchdogState };

/** Contrato tipado público (GuardianPersistedState). */
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
 * Servicio de dominio para guardian state.
 */
export class GuardianStateService {
  private readonly stateFilePath: string;
  private state: GuardianPersistedState = { ...DEFAULT_STATE };

  /** Construye la instancia del servicio. */
  constructor() {
    this.stateFilePath = path.join(
      app.getPath("appData"),
      "SmartEconomatInstaller",
      "guardian-state.json",
    );
  }

  /**
   * Expone la operación "load" del instalador SmartEconomat.
   * @returns {Promise<GuardianPersistedState>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async load(): Promise<GuardianPersistedState> {
    try {
      const raw = await fs.readFile(this.stateFilePath, "utf8");
      const parsed = JSON.parse(raw) as Partial<GuardianPersistedState>;
      this.state = this.normalizeState(parsed);
    } catch {
      this.state = { ...DEFAULT_STATE };
    }
    return this.state;
  }

  /**
   * Obtiene el estado o valor solicitado.
   * @returns {GuardianPersistedState} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  get(): GuardianPersistedState {
    return { ...this.state };
  }

  /**
   * Expone la operación "update" del instalador SmartEconomat.
   * @param {Partial<GuardianPersistedState>} patch - Entrada esperada por la función.
   * @returns {Promise<GuardianPersistedState>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async update(
    patch: Partial<GuardianPersistedState>,
  ): Promise<GuardianPersistedState> {
    this.state = { ...this.state, ...patch };
    await this.persist();
    return this.state;
  }

  /**
   * Expone la operación "reset" del instalador SmartEconomat.
   * @returns {Promise<void>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
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
