import path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react-swc";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      sourcemap: false,
      minify: true,
      reportCompressedSize: false,
    },
    resolve: {
      alias: {
        "@main": path.resolve(rootDir, "src/main"),
        "@shared": path.resolve(rootDir, "src/shared"),
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    define: {
      __INSTALLER_CAPTURE_BRIDGE_MOCK__: JSON.stringify(
        process.env.VITE_INSTALLER_CAPTURE_BRIDGE_MOCK === "true",
      ),
    },
    build: {
      sourcemap: false,
      minify: true,
      reportCompressedSize: false,
    },
    resolve: {
      alias: {
        "@preload": path.resolve(rootDir, "src/preload"),
        "@shared": path.resolve(rootDir, "src/shared"),
      },
    },
  },
  renderer: {
    root: path.resolve(rootDir, "src/renderer"),
    cacheDir: path.resolve(rootDir, "node_modules/.vite/electron-renderer"),
    plugins: [react()],
    build: {
      sourcemap: false,
      reportCompressedSize: false,
    },
    resolve: {
      alias: {
        "@renderer": path.resolve(rootDir, "src/renderer"),
        "@shared": path.resolve(rootDir, "src/shared"),
      },
    },
  },
});
