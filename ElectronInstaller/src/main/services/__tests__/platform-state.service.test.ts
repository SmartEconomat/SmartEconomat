import { describe, expect, it } from "vitest";

import {
  mapDockerRuntimeToPlatform,
  mapHealthToStack,
} from "../platform-state.service";

describe("platform-state.service", () => {
  it("mapea daemon-starting a STABILIZING durante gracia", () => {
    const platform = mapDockerRuntimeToPlatform(
      {
        state: "daemon-starting",
        detail: "wait",
        source: "runtime",
        retries: 0,
        lastCheckedAt: new Date().toISOString(),
      },
      true,
    );
    expect(platform).toBe("STABILIZING");
  });

  it("no marca STACK_DOWN con inventario vacío en gracia", () => {
    const stack = mapHealthToStack([], true, true);
    expect(stack).toBe("STACK_UNKNOWN");
  });

  it("trata starting como STACK_STARTING", () => {
    const stack = mapHealthToStack(
      [
        {
          service: "backend",
          status: "starting",
          detail: "health: starting",
        },
      ],
      true,
      false,
    );
    expect(stack).toBe("STACK_STARTING");
  });
});
