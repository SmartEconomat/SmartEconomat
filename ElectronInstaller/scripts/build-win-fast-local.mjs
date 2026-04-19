import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { rcedit } from "rcedit";

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

function runNode(scriptOrModulePath, args = [], options = {}) {
  return run(process.execPath, [scriptOrModulePath, ...args], options);
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
    // Ignore cleanup errors when dist does not exist yet.
  }
}

async function removeBuildResidue(distDir) {
  try {
    await fs.rm(path.join(distDir, "win-unpacked"), {
      recursive: true,
      force: true,
    });
    await fs.rm(path.join(distDir, "builder-debug.yml"), {
      force: true,
    });
    await fs.rm(path.join(distDir, "builder-effective-config.yaml"), {
      force: true,
    });
  } catch {
    // Ignore cleanup errors when dist does not exist yet.
  }
}

async function assertFinalInstallerExists(distDir) {
  try {
    const entries = await fs.readdir(distDir);
    const installerFile = entries.find(
      (name) =>
        name.startsWith("SmartEconomat-") &&
        name.endsWith("-win-x64.exe") &&
        !name.toLowerCase().endsWith(".__uninstaller.exe")
    );

    if (!installerFile) {
      throw new Error("No se encontró instalador con patrón SmartEconomat-*-win-x64.exe");
    }

    const installerPath = path.join(distDir, installerFile);
    const stats = await fs.stat(installerPath);
    
    if (!stats.isFile() || stats.size <= 0) {
      throw new Error("installer vacío");
    }

    return installerPath;
  } catch (err) {
    throw new Error(
      `No se generó el instalador final SmartEconomat-*-win-x64.exe: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

function hasSigningMaterial() {
  return Boolean(
    (process.env.WIN_CSC_PFX_PATH && process.env.WIN_CSC_PFX_PATH.trim()) ||
      (process.env.WIN_CSC_THUMBPRINT && process.env.WIN_CSC_THUMBPRINT.trim()),
  );
}

async function main() {
  const distDir = path.resolve("dist");
  const winUnpackedDir = path.join(distDir, "win-unpacked");
  const exePath = path.join(winUnpackedDir, "SmartEconomat.exe");
  const iconPath = path.resolve("resources", "icons", "win", "icon.ico");

  // Pre-build: Compila backend y frontend para que el cliente NO tenga que hacerlo
  await runNode("./scripts/pre-build-project.mjs");

  await fs.rm(distDir, { recursive: true, force: true });
  await runNode("./scripts/ensure-win-icons.mjs");
  await runNode("./node_modules/electron-vite/bin/electron-vite.js", ["build"]);

  // 1) Genera el app folder (win-unpacked) sin depender de winCodeSign.
  await runNode(
    "./node_modules/electron-builder/cli.js",
    [
      "--win",
      "--dir",
      "--config.compression=store",
      "--config.win.signAndEditExecutable=false",
      "--publish",
      "never",
    ],
    {
      env: {
        ...process.env,
        CSC_IDENTITY_AUTO_DISCOVERY: "false",
      },
    },
  );

  // 2) Fuerza icono corporativo en SmartEconomat.exe.
  await rcedit(exePath, {
    icon: iconPath,
  });

  // 3) Verifica por comparación de bitmap que el EXE quedó con el icono esperado.
  await runNode("./scripts/verify-win-exe-icon.mjs");

  // 4) Empaqueta NSIS reutilizando el EXE ya parcheado.
  await runNode(
    "./node_modules/electron-builder/cli.js",
    [
      "--win",
      "nsis",
      "--prepackaged",
      winUnpackedDir,
      "--config.compression=store",
      "--config.win.signAndEditExecutable=false",
      "--publish",
      "never",
    ],
    {
      env: {
        ...process.env,
        CSC_IDENTITY_AUTO_DISCOVERY: "false",
      },
    },
  );

  const finalInstallerPath = await assertFinalInstallerExists(distDir);

  if (hasSigningMaterial()) {
    await runNode("./scripts/sign-windows-artifact.mjs");
    await runNode("./scripts/verify-win-signature.mjs");
  } else {
    console.warn(
      "[SAC] Instalador generado SIN firma. Smart App Control puede bloquearlo. " +
        "Para firma: define WIN_CSC_PFX_PATH (y opcional WIN_CSC_PFX_PASSWORD) " +
        "o WIN_CSC_THUMBPRINT, y vuelve a ejecutar build:win:fast.",
    );
    console.warn(`[SAC] Artefacto no firmado: ${finalInstallerPath}`);
  }

  await removeBuildResidue(distDir);
  await removeNsisUninstallers(distDir);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
