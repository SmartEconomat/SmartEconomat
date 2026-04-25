import { describe, expect, it } from "vitest";

import { getDefaultRuntimePath } from "@shared/default-runtime-path";

describe("getDefaultRuntimePath", () => {
  it("usa C:/SmartEconomatRuntime en Windows", () => {
    expect(getDefaultRuntimePath("win32", "C:\\Users\\x")).toBe(
      "C:/SmartEconomatRuntime",
    );
  });

  it("usa Application Support en macOS", () => {
    expect(getDefaultRuntimePath("darwin", "/Users/test")).toBe(
      "/Users/test/Library/Application Support/SmartEconomatRuntime",
    );
  });

  it("usa ~/.smarteconomat-runtime en Linux", () => {
    expect(getDefaultRuntimePath("linux", "/home/test")).toBe(
      "/home/test/.smarteconomat-runtime",
    );
  });

  it("cae en /tmp si no hay home", () => {
    expect(getDefaultRuntimePath("linux", "")).toBe(
      "/tmp/smarteconomat-runtime",
    );
  });
});
