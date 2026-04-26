import path from "node:path";

import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@main": path.resolve(__dirname, "src/main"),
      "@shared": path.resolve(__dirname, "src/shared"),
      "@renderer": path.resolve(__dirname, "src/renderer"),
    },
  },
  test: {
    environment: "node",
    include: ["src/main/services/__tests__        /**
     * Documentación en español.
     */*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/main/services            /**
       * Documentación en español.
       */*.ts"],
      exclude: ["src/main/services/**/__tests__/**"],
    },
  },
});
