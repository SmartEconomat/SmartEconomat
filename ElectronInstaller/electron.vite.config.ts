import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react-swc";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@main": path.resolve(rootDir, "src/main"),
        "@shared": path.resolve(rootDir, "src/shared"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    resolve: {
      alias: {
        "@preload": path.resolve(rootDir, "src/preload"),
        "@shared": path.resolve(rootDir, "src/shared"),
      },
    },
  },
  renderer: {
    root: path.resolve(rootDir, "src/renderer"),
    plugins: [react()],
    resolve: {
      alias: {
        "@renderer": path.resolve(rootDir, "src/renderer"),
        "@shared": path.resolve(rootDir, "src/shared"),
      },
    },
  },
});
