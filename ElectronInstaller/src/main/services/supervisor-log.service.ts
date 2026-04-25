import fs from "node:fs/promises";
import path from "node:path";

import { app } from "electron";

export interface SupervisorLogEntry {
  at: string;
  action: string;
  outcome: "ok" | "warn" | "error";
  durationMs?: number;
  technicalError?: string;
  userSuggestion?: string;
  context?: Record<string, string | number | boolean>;
}

export class SupervisorLogService {
  private readonly logFilePath: string;

  constructor() {
    this.logFilePath = path.join(
      app.getPath("appData"),
      "SmartEconomatInstaller",
      "supervisor.log",
    );
  }

  async append(entry: SupervisorLogEntry): Promise<void> {
    const serialized = JSON.stringify(entry);
    await fs.mkdir(path.dirname(this.logFilePath), { recursive: true });
    await fs.appendFile(this.logFilePath, `${serialized}\n`, "utf8");
  }

  getLogFilePath(): string {
    return this.logFilePath;
  }
}
