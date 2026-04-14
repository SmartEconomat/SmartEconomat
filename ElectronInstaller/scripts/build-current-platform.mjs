import { spawnSync } from "node:child_process";

const targetByPlatform = {
  linux: "--linux",
  darwin: "--mac",
  win32: "--win",
};

const targetFlag = targetByPlatform[process.platform];

if (!targetFlag) {
  console.error(`Plataforma no soportada para build automático: ${process.platform}`);
  process.exit(1);
}

const result = spawnSync(
  "npx",
  [
    "electron-builder",
    targetFlag,
    "--publish",
    "never",
    "--config.compression=normal",
  ],
  {
  stdio: "inherit",
  shell: process.platform === "win32",
  },
);

if (result.error) {
  console.error("No se pudo ejecutar electron-builder:", result.error.message);
  process.exit(1);
}

process.exit(result.status ?? 1);
