import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..", "..");
const hostUid = `${process.getuid?.() ?? 1000}`;
const hostGid = `${process.getgid?.() ?? 1000}`;

const maxRetries = Number.parseInt(process.env.BUILD_WIN_RETRIES ?? "2", 10);
const timeoutMs = Number.parseInt(
  process.env.BUILD_WIN_TIMEOUT_MS ?? `${45 * 60 * 1000}`,
  10,
);
const retryDelayMs = Number.parseInt(
  process.env.BUILD_WIN_RETRY_DELAY_MS ?? `${20 * 1000}`,
  10,
);
const logsDir = path.join(repoRoot, "ElectronInstaller", "dist", "logs");

fs.mkdirSync(logsDir, { recursive: true });

function runDockerBuild(attempt) {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  const logFilePath = path.join(
    logsDir,
    `build-win-linux-attempt-${attempt}-${stamp}.log`,
  );

  const args = [
    "run",
    "--rm",
    "--init",
    "-e",
    "HOME=/root",
    "-e",
    `HOST_UID=${hostUid}`,
    "-e",
    `HOST_GID=${hostGid}`,
    "-e",
    "ELECTRON_CACHE=/root/.cache/electron",
    "-e",
    "ELECTRON_BUILDER_CACHE=/root/.cache/electron-builder",
    "-e",
    "WIN_CSC_LINK",
    "-e",
    "WIN_CSC_KEY_PASSWORD",
    "-v",
    `${repoRoot}:/project`,
    "-v",
    "smarteconomat-electron-cache:/root/.cache/electron",
    "-v",
    "smarteconomat-electron-builder-cache:/root/.cache/electron-builder",
    "-w",
    "/project/ElectronInstaller",
    "electronuserland/builder:wine",
    "/bin/bash",
    "-lc",
    "set -euo pipefail && mkdir -p /root/.cache/electron /root/.cache/electron-builder && if [[ -n \"${WIN_CSC_LINK:-}\" ]]; then export CSC_LINK=\"$WIN_CSC_LINK\"; fi && if [[ -n \"${WIN_CSC_KEY_PASSWORD:-}\" ]]; then export CSC_KEY_PASSWORD=\"$WIN_CSC_KEY_PASSWORD\"; fi && npm ci --no-audit --fund=false --prefer-offline && npm run build:app && npx electron-builder --win --x64 --publish never --config.compression=store && find dist -maxdepth 1 -type f -name '*.__uninstaller.exe' -delete && chown -R \"$HOST_UID:$HOST_GID\" out dist",
  ];

  return new Promise((resolve) => {
    const child = spawn("docker", args, {
      stdio: ["ignore", "pipe", "pipe"],
      shell: false,
    });

    const writeLogChunk = (prefix, chunk) => {
      const text = chunk.toString();
      fs.appendFileSync(logFilePath, text);
      if (prefix === "out") {
        process.stdout.write(text);
      } else {
        process.stderr.write(text);
      }
    };

    child.stdout?.on("data", (chunk) => writeLogChunk("out", chunk));
    child.stderr?.on("data", (chunk) => writeLogChunk("err", chunk));

    const timeout = setTimeout(() => {
      child.kill("SIGTERM");
    }, timeoutMs);

    child.on("exit", (code, signal) => {
      clearTimeout(timeout);
      resolve({ code: code ?? 1, signal });
    });

    child.on("error", (error) => {
      clearTimeout(timeout);
      console.error("No se pudo ejecutar docker para build de Windows:", error);
      resolve({ code: 1, signal: "SPAWN_ERROR" });
    });
  });
}

async function main() {
  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    console.log(
      `[build:windows-from-linux] Intento ${attempt}/${maxRetries} (timeout ${Math.round(timeoutMs / 60000)}m)`,
    );

    const result = await runDockerBuild(attempt);

    if (result.code === 0) {
      console.log("[build:windows-from-linux] Build completado correctamente.");
      process.exit(0);
    }

    const timeoutTriggered = result.signal === "SIGTERM";
    console.error(
      `[build:windows-from-linux] Fallo en intento ${attempt}: code=${result.code} signal=${result.signal ?? "none"}${timeoutTriggered ? " (timeout)" : ""}`,
    );

    if (attempt < maxRetries) {
      console.log(
        `[build:windows-from-linux] Reintentando en ${Math.round(retryDelayMs / 1000)}s...`,
      );
      await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
    }
  }

  process.exit(1);
}

await main();
