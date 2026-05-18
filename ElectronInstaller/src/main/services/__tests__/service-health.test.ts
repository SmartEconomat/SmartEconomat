import { describe, expect, it } from "vitest";

import type { ServiceHealth } from "@shared/contracts";
import { countOperationalServices } from "@shared/service-health";

describe("service-health", () => {
  it("cuenta healthy y running como operativos", () => {
    const health: ServiceHealth[] = [
      { service: "backend", status: "healthy", detail: "" },
      { service: "frontend", status: "running", detail: "" },
      { service: "db", status: "starting", detail: "" },
      { service: "redis", status: "unknown", detail: "" },
    ];

    expect(countOperationalServices(health)).toEqual({ up: 3, total: 4 });
  });

  it("siempre usa los cuatro servicios monitorizados", () => {
    expect(countOperationalServices([])).toEqual({ up: 0, total: 4 });
  });
});
