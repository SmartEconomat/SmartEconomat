import fs from "node:fs/promises";
import path from "node:path";

import { app } from "electron";

/** Contrato tipado público (SupervisorLogEntry). */
export interface SupervisorLogEntry {
  at: string;
  action: string;
  outcome: "ok" | "warn" | "error";
  durationMs?: number;
  technicalError?: string;
  userSuggestion?: string;
  context?: Record<string, string | number | boolean>;
}

/** Servicio del proceso principal: SupervisorLogService. */
export class SupervisorLogService {
  private readonly logFilePath: string;

  /** Construye la instancia del servicio. */
  constructor() {
    this.logFilePath = path.join(
      app.getPath("appData"),
      "SmartEconomatInstaller",
      "supervisor.log",
    );
  }

  /**
   * Expone la operación "append" del instalador SmartEconomat.
   * @param {SupervisorLogEntry} entry - Entrada esperada por la función.
   * @returns {Promise<void>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async append(entry: SupervisorLogEntry): Promise<void> {
    const serialized = JSON.stringify(entry);
    await fs.mkdir(path.dirname(this.logFilePath), { recursive: true });
    await fs.appendFile(this.logFilePath, `${serialized}\n`, "utf8");
  }

  /**
   * Obtiene el estado o valor solicitado.
   * @returns {string} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  getLogFilePath(): string {
    return this.logFilePath;
  }
}
