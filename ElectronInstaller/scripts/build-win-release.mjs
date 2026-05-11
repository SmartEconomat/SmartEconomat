import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      ...options,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed with exit code ${code ?? -1}`,
        ),
      );
    });
  });
}

function hasSigningMaterial() {
  return Boolean(
    (process.env.WIN_CSC_PFX_PATH && process.env.WIN_CSC_PFX_PATH.trim()) ||
      (process.env.WIN_CSC_THUMBPRINT && process.env.WIN_CSC_THUMBPRINT.trim()),
  );
}

async function removeNsisUninstallers(distDir) {
  try {
    const entries = await fs.readdir(distDir, { withFileTypes: true });
    const deletions = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.toLowerCase().endsWith(".__uninstaller.exe"),
      )
      .map((entry) => fs.unlink(path.join(distDir, entry.name)));

    await Promise.all(deletions);
  } catch {
    // Ignore cleanup errors if dist is missing.
  }
}

async function main() {
  const distDir = path.resolve("dist");

  // Evita extracción de winCodeSign (symlink) en Windows sin privilegios.
  await run(
    process.execPath,
    [
      "./node_modules/electron-builder/cli.js",
      "--win",
      "nsis",
      "--publish",
      "never",
      "--config.win.signAndEditExecutable=false",
    ],
    {
      env: {
        ...process.env,
        CSC_IDENTITY_AUTO_DISCOVERY: "false",
      },
    },
  );

  if (hasSigningMaterial()) {
    await run(process.execPath, ["./scripts/sign-windows-artifact.mjs"]);
    await run(process.execPath, ["./scripts/verify-win-signature.mjs"]);
  } else {
    console.warn(
      "[SIGN] No se detectó certificado. El build:win:release terminó sin firma.",
    );
    console.warn(
      "[SIGN] Define WIN_CSC_PFX_PATH (+ WIN_CSC_PFX_PASSWORD opcional) o WIN_CSC_THUMBPRINT para firmar y evitar bloqueo de Smart App Control.",
    );
  }

  await removeNsisUninstallers(distDir);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
