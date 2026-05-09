import os from "node:os";

/** Contrato tipado público (OSDetails). */
export interface OSDetails {
  platform: NodeJS.Platform;
  architecture: string;
  release: string;
  hostname: string;
  totalMemoryGb: number;
  cpus: number;
}

/** Servicio del proceso principal: OSDetectorService. */
export class OSDetectorService {
  /**
   * Expone la operación "detect" del instalador SmartEconomat.
   * @returns {OSDetails} Resultado efectivo tras la llamada (puede incluir Promesas).
   */
  detect(): OSDetails {
    const totalMemoryGb = Number((os.totalmem() / 1024 ** 3).toFixed(2));

    return {
      platform: os.platform(),
      architecture: os.arch(),
      release: os.release(),
      hostname: os.hostname(),
      totalMemoryGb,
      cpus: os.cpus().length,
    };
  }
}
