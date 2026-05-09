import fs from "node:fs/promises";
import path from "node:path";

import type { InstallJournalEntry } from "@shared/contracts";

/** Servicio del proceso principal: JournalService. */
export class JournalService {
  private readonly fileName = "installation-journal.json";

  /**
   * Expone la operación "append" del instalador SmartEconomat.
   * @param {string} runtimePath - Entrada esperada por la función.
   * @param {InstallJournalEntry} entry - Entrada esperada por la función.
   * @returns {Promise<void>} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  async append(runtimePath: string, entry: InstallJournalEntry): Promise<void> {
    await fs.mkdir(runtimePath, { recursive: true });
    const journalPath = path.join(runtimePath, this.fileName);

    let entries: InstallJournalEntry[] = [];

    try {
      const raw = await fs.readFile(journalPath, "utf8");
      entries = JSON.parse(raw) as InstallJournalEntry[];
    } catch {
      entries = [];
    }

    entries.push(entry);
    await fs.writeFile(journalPath, JSON.stringify(entries, null, 2), {
      encoding: "utf8",
    });
  }
}
