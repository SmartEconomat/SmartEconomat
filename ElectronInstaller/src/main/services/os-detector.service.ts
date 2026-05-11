import os from "node:os";

export interface OSDetails {
  platform: NodeJS.Platform;
  architecture: string;
  release: string;
  hostname: string;
  totalMemoryGb: number;
  cpus: number;
}

export class OSDetectorService {
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
