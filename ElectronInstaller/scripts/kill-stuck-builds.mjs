import { spawn } from "node:child_process";
import process from "node:process";

const TARGET_PROCESSES = [
  "node.exe",
  "app-builder.exe",
  "electron.exe",
  "rcedit.exe",
  "SmartEconomat.exe",
];

function runTaskkill(args) {
  return new Promise((resolve) => {
    const child = spawn("taskkill", args, {
      stdio: "inherit",
      shell: false,
    });
    child.on("error", () => resolve());
    child.on("exit", () => resolve());
  });
}

async function main() {
  if (process.platform !== "win32") {
    console.log("[CLEANUP] Script disponible solo para Windows.");
    return;
  }

  for (const procName of TARGET_PROCESSES) {
    await runTaskkill(["/IM", procName, "/T", "/F"]);
  }
  console.log("[CLEANUP] Limpieza de procesos finalizada.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
