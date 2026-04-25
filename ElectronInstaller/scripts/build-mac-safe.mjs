import { spawnSync } from "node:child_process";

if (process.platform !== "darwin") {
  console.log(
    "[build:mac] DMG solo puede generarse en macOS. Usa un runner macOS para build nativo.",
  );
  process.exit(0);
}

const buildApp = spawnSync("npm", ["run", "build:app"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

if ((buildApp.status ?? 1) !== 0) {
  process.exit(buildApp.status ?? 1);
}

const macBuild = spawnSync("npx", ["electron-builder", "--mac"], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(macBuild.status ?? 1);
