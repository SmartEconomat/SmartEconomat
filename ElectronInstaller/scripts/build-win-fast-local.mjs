import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { rcedit } from "rcedit";

const BUILD_TIMEOUT_MS =
  Number(process.env.BUILD_STAGE_TIMEOUT_MS ?? 20 * 60 * 1000) ||
  20 * 60 * 1000;
const BUILD_LOCK_PATH = path.resolve(".cache", "build-lock.json");

async function processExists(pid) {
  if (!Number.isFinite(pid) || pid <= 0) {
    return false;
  }
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function acquireBuildLock() {
  await fs.mkdir(path.dirname(BUILD_LOCK_PATH), { recursive: true });
  try {
    const raw = await fs.readFile(BUILD_LOCK_PATH, "utf8");
    const existingLock = JSON.parse(raw);
    const existingPid = Number(existingLock?.pid ?? 0);
    if (await processExists(existingPid)) {
      throw new Error(
        `[LOCK] Ya hay un build en ejecución (PID ${existingPid}, iniciado ${existingLock.startedAt ?? "desconocido"}). Cancela ese build antes de lanzar otro.`,
      );
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!message.includes("ENOENT")) {
      throw error;
    }
  }

  await fs.writeFile(
    BUILD_LOCK_PATH,
    `${JSON.stringify(
      {
        pid: process.pid,
        startedAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

async function releaseBuildLock() {
  await fs.rm(BUILD_LOCK_PATH, { force: true }).catch(() => {});
}

async function killProcessTree(pid) {
  if (!Number.isFinite(pid) || pid <= 0) {
    return;
  }
  if (process.platform === "win32") {
    await new Promise((resolve) => {
      const killer = spawn("taskkill", ["/PID", String(pid), "/T", "/F"], {
        stdio: "ignore",
        shell: false,
      });
      killer.on("error", () => resolve());
      killer.on("exit", () => resolve());
    });
    return;
  }
  try {
    process.kill(-pid, "SIGKILL");
  } catch {
    try {
      process.kill(pid, "SIGKILL");
    } catch {}
  }
}

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: "inherit",
      shell: false,
      ...options,
    });
    const timer = setTimeout(() => {
      killProcessTree(child.pid).finally(() => {
        reject(
          new Error(
            `${command} ${args.join(" ")} excedió el timeout de ${(BUILD_TIMEOUT_MS / 60000).toFixed(1)} minutos y fue terminado`,
          ),
        );
      });
    }, BUILD_TIMEOUT_MS);

    child.on("error", reject);
    child.on("exit", (code) => {
      clearTimeout(timer);
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

async function runStage(stageName, stageMetrics, callback) {
  const startedAt = Date.now();
  console.log(`[TIMING] ▶ ${stageName}`);
  await callback();
  const elapsedMs = Date.now() - startedAt;
  const elapsedSeconds = Number((elapsedMs / 1000).toFixed(2));
  stageMetrics.push({
    stageName,
    elapsedMs,
    elapsedSeconds,
  });
  console.log(`[TIMING] ✓ ${stageName}: ${elapsedSeconds}s`);
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
        !name.toLowerCase().endsWith(".__uninstaller.exe"),
    );

    if (!installerFile) {
      throw new Error(
        "No se encontró instalador con patrón SmartEconomat-*-win-x64.exe",
      );
    }

    const installerPath = path.join(distDir, installerFile);
    const stats = await fs.stat(installerPath);

    if (!stats.isFile() || stats.size <= 0) {
      throw new Error("installer vacío");
    }

    return installerPath;
  } catch (err) {
    throw new Error(
      `No se generó el instalador final SmartEconomat-*-win-x64.exe: ${err instanceof Error ? err.message : String(err)}`,
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
  await acquireBuildLock();
  const buildStartedAt = Date.now();
  const stageMetrics = [];
  const distDir = path.resolve("dist");
  const buildWorkspaceDir = path.resolve(".cache", "builder-workspace");
  const builderDirOutput = path.join(buildWorkspaceDir, "dir-output");
  const winUnpackedDir = path.join(builderDirOutput, "win-unpacked");
  const exePath = path.join(winUnpackedDir, "SmartEconomat.exe");
  const iconPath = path.resolve("resources", "icons", "win", "icon.ico");

  // Pre-build: Compila backend y frontend para que el cliente NO tenga que hacerlo
  await runStage("pre-build-project", stageMetrics, async () => {
    await runNode("./scripts/pre-build-project.mjs");
  });
  await runStage("maybe-electron-rebuild", stageMetrics, async () => {
    await runNode("./scripts/maybe-electron-rebuild.mjs");
  });

  // Asegurar que no hay procesos bloqueando artefactos de build antes de empaquetar
  try {
    const { execSync } = await import("node:child_process");
    console.log(
      "[BUILD] Asegurando que no hay instancias de la app o herramientas de build activas...",
    );
    // Matamos la app y herramientas de build que suelen dejar handles abiertos
    const processesToKill = [
      "SmartEconomat.exe",
      "app-builder.exe",
      "rcedit.exe",
      "electron.exe",
    ];
    for (const proc of processesToKill) {
      try {
        execSync(`taskkill /IM ${proc} /F /T`, { stdio: "ignore" });
      } catch {
        // Ignorar si el proceso no existe
      }
    }
    // Pequeño delay tras el kill para que el SO libere los handles
    await new Promise((resolve) => setTimeout(resolve, 2000));
  } catch {
    // Ignorar errores generales de kill
  }

  console.log(
    `[BUILD] Preparando directorios de salida: ${distDir} y ${builderDirOutput}`,
  );
  await fs.mkdir(distDir, { recursive: true });
  await fs
    .rm(builderDirOutput, {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 250,
    })
    .catch(() => {});
  await fs.mkdir(builderDirOutput, { recursive: true });

  await runStage("ensure-win-icons", stageMetrics, async () => {
    await runNode("./scripts/ensure-win-icons.mjs");
  });
  await runStage("electron-vite-build", stageMetrics, async () => {
    await runNode("./node_modules/electron-vite/bin/electron-vite.js", [
      "build",
    ]);
  });

  // 1) Genera el app folder (win-unpacked) sin depender de winCodeSign.
  console.log("[BUILD] Iniciando empaquetado (dir) con electron-builder...");
  const maxBuilderAttempts = Number(process.env.BUILD_MAX_ATTEMPTS ?? 2) || 2;
  await runStage("electron-builder-dir", stageMetrics, async () => {
    for (let attempt = 1; attempt <= maxBuilderAttempts; attempt++) {
      try {
        await runNode(
          "./node_modules/electron-builder/cli.js",
          [
            "--win",
            "--dir",
            "--config.compression=store",
            "--config.win.signAndEditExecutable=false",
            `--config.directories.output=${builderDirOutput}`,
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
        break;
      } catch (err) {
        if (attempt === maxBuilderAttempts) throw err;
        const backoff = attempt * 3000;
        console.warn(
          `[BUILD] Intento ${attempt} de electron-builder falló: ${err.message}. Reintentando en ${backoff}ms...`,
        );

        try {
          const { execSync } = await import("node:child_process");
          execSync("taskkill /IM app-builder.exe /F /T", { stdio: "ignore" });
          execSync("taskkill /IM SmartEconomat.exe /F /T", { stdio: "ignore" });
        } catch {}

        await fs
          .rm(builderDirOutput, {
            recursive: true,
            force: true,
            maxRetries: 3,
            retryDelay: 250,
          })
          .catch(() => {});
        await fs.mkdir(builderDirOutput, { recursive: true });
        await new Promise((resolve) => setTimeout(resolve, backoff));
      }
    }
  });

  // 2) Fuerza icono corporativo en SmartEconomat.exe.
  // Implementamos reintentos para rcedit ya que a veces Windows bloquea el archivo temporalmente (thumbnails/antivirus)
  console.log(`[RCEDIT] Aplicando icono corporativo a: ${exePath}`);
  let rceditSuccess = false;
  for (let attempt = 1; attempt <= 5; attempt++) {
    try {
      await rcedit(exePath, {
        icon: iconPath,
      });
      rceditSuccess = true;
      console.log(
        `[RCEDIT] Icono aplicado correctamente en el intento ${attempt}.`,
      );
      break;
    } catch (err) {
      if (attempt === 5) throw err;
      const delayMs = attempt * 1000;
      console.warn(
        `[RCEDIT] Intento ${attempt} falló (archivo bloqueado?). Reintentando en ${delayMs}ms...`,
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  // 3) Verifica por comparación de bitmap que el EXE quedó con el icono esperado.
  await runStage("verify-win-exe-icon", stageMetrics, async () => {
    await runNode("./scripts/verify-win-exe-icon.mjs", [], {
      env: {
        ...process.env,
        VERIFY_WIN_EXE_PATH: exePath,
      },
    });
  });

  // 4) Elimina instaladores previos para evitar que NSIS falle con "Can't open output file"
  //    (ocurre cuando Windows Explorer u otro proceso bloquea el .exe anterior)
  console.log(
    "[BUILD] Eliminando instaladores previos para liberar el archivo de salida...",
  );
  try {
    const existingEntries = await fs.readdir(distDir);
    const oldInstallers = existingEntries.filter(
      (name) =>
        name.startsWith("SmartEconomat-") &&
        name.endsWith(".exe") &&
        !name.toLowerCase().endsWith(".__uninstaller.exe"),
    );
    for (const name of oldInstallers) {
      const filePath = path.join(distDir, name);
      console.log(`[BUILD] Eliminando instalador previo: ${name}`);
      await fs.rm(filePath, { force: true, maxRetries: 5, retryDelay: 1000 });
    }
  } catch {
    // dist no existe aún, ignorar
  }
  // Pequeño delay para asegurar que Windows libera los handles de fichero
  await new Promise((resolve) => setTimeout(resolve, 500));

  // 5) Empaqueta NSIS reutilizando el EXE ya parcheado.
  await runStage("electron-builder-nsis", stageMetrics, async () => {
    await runNode(
      "./node_modules/electron-builder/cli.js",
      [
        "--win",
        "nsis",
        "--prepackaged",
        winUnpackedDir,
        "--config.compression=store",
        "--config.win.signAndEditExecutable=false",
        `--config.directories.output=${distDir}`,
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
  });

  const finalInstallerPath = await assertFinalInstallerExists(distDir);

  if (hasSigningMaterial()) {
    await runStage("sign-windows-artifact", stageMetrics, async () => {
      await runNode("./scripts/sign-windows-artifact.mjs");
    });
    await runStage("verify-win-signature", stageMetrics, async () => {
      await runNode("./scripts/verify-win-signature.mjs");
    });
  } else {
    console.warn(
      "[SAC] Instalador generado SIN firma. Smart App Control puede bloquearlo. " +
        "Para firma: define WIN_CSC_PFX_PATH (y opcional WIN_CSC_PFX_PASSWORD) " +
        "o WIN_CSC_THUMBPRINT, y vuelve a ejecutar build:win:fast.",
    );
    console.warn(`[SAC] Artefacto no firmado: ${finalInstallerPath}`);
  }

  await fs
    .rm(builderDirOutput, { recursive: true, force: true })
    .catch(() => {});
  await removeBuildResidue(distDir);
  await removeNsisUninstallers(distDir);

  const elapsedMs = Date.now() - buildStartedAt;
  const metricsPayload = {
    timestamp: new Date().toISOString(),
    totalElapsedMs: elapsedMs,
    totalElapsedSeconds: Number((elapsedMs / 1000).toFixed(2)),
    stageMetrics,
  };
  const reportPath = path.join(
    ".cache",
    "build-metrics",
    "build-win-fast-last.json",
  );
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(
    reportPath,
    `${JSON.stringify(metricsPayload, null, 2)}\n`,
    "utf8",
  );
  console.log(`[TIMING] Reporte guardado en: ${reportPath}`);
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  })
  .finally(async () => {
    await releaseBuildLock();
  });
