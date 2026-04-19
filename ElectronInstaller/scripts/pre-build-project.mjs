/**
 * pre-build-project.mjs — Script de pre-compilación del desarrollador
 * =====================================================================
 * Compila frontend y backend ANTES de empaquetar el instalador.
 * Esto garantiza que el instalador incluye dist/ ya compilado y el cliente
 * final NO necesita compilar nada (eliminando la dependencia de NPM, TypeScript
 * y minutos de espera en el PC del usuario).
 *
 * Uso:
 *   node scripts/pre-build-project.mjs
 *
 * Este script es llamado automáticamente por build:win y build:win:release
 * a través del script "build:project" en package.json.
 *
 * Requisitos:
 *   - Node >= 22.2.0
 *   - npm disponible en PATH
 *   - Backend: ../backend/smart-economat-backend/package.json existente
 *   - Frontend: ../frontend/smart-economat-frontend/package.json existente
 */

import { spawn } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..", "..");
const BACKEND_DIR = path.join(ROOT, "backend", "smart-economat-backend");
const FRONTEND_DIR = path.join(ROOT, "frontend", "smart-economat-frontend");
const BACKEND_CACHE_FILE = path.join(BACKEND_DIR, ".prebuild-cache.json");
const FRONTEND_CACHE_FILE = path.join(FRONTEND_DIR, ".prebuild-cache.json");

const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RED = "\x1b[31m";
const CYAN = "\x1b[36m";
const RESET = "\x1b[0m";

function log(color, prefix, message) {
  console.log(`${color}[${prefix}]${RESET} ${message}`);
}

function info(message) {
  log(CYAN, "PRE-BUILD", message);
}

function success(message) {
  log(GREEN, "✅ OK", message);
}

function warn(message) {
  log(YELLOW, "⚠️  WARN", message);
}

function error(message) {
  log(RED, "❌ ERROR", message);
}

function resolveCommand(command) {
  if (process.platform !== "win32") {
    return command;
  }

  if (command === "npm") {
    return "npm.cmd";
  }

  if (command === "npx") {
    return "npx.cmd";
  }

  return command;
}

/**
 * Ejecuta un comando en un directorio dado, heredando stdio del proceso padre.
 */
function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const resolvedCommand = resolveCommand(command);
    const useShell =
      process.platform === "win32" &&
      (resolvedCommand.endsWith(".cmd") || resolvedCommand.endsWith(".bat"));
    info(
      `Ejecutando: ${resolvedCommand} ${args.join(" ")} (en ${path.basename(cwd)})`,
    );
    const child = spawn(resolvedCommand, args, {
      cwd,
      stdio: "inherit",
      shell: useShell,
    });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(
          `${command} ${args.join(" ")} falló con código de salida ${code ?? -1}`,
        ),
      );
    });
  });
}

async function hashFile(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function readCache(cacheFile) {
  try {
    const raw = await fs.readFile(cacheFile, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCache(cacheFile, payload) {
  await fs.writeFile(cacheFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

async function getDependencyState(projectDir) {
  const packageJsonPath = path.join(projectDir, "package.json");
  const lockFilePath = path.join(projectDir, "package-lock.json");
  const nodeModulesPath = path.join(projectDir, "node_modules");

  const [packageJsonHash, lockFileHash] = await Promise.all([
    hashFile(packageJsonPath),
    hashFile(lockFilePath),
  ]);

  let nodeModulesExists = false;
  try {
    const stats = await fs.stat(nodeModulesPath);
    nodeModulesExists = stats.isDirectory();
  } catch {
    nodeModulesExists = false;
  }

  return {
    packageJsonHash,
    lockFileHash,
    nodeModulesExists,
    fingerprint: `${packageJsonHash}:${lockFileHash}`,
  };
}

async function shouldReuseDependencies(projectDir, cacheFile) {
  const cache = await readCache(cacheFile);
  if (!cache) {
    return false;
  }

  const state = await getDependencyState(projectDir);
  const cachedFingerprint = String(cache.fingerprint ?? "").toLowerCase();
  const currentFingerprint = String(state.fingerprint ?? "").toLowerCase();
  return (
    cachedFingerprint === currentFingerprint &&
    state.nodeModulesExists === true &&
    cache.dependenciesInstalled === true
  );
}

async function hasBuildTools(projectDir, toolNames) {
  const binDir = path.join(projectDir, "node_modules", ".bin");

  for (const toolName of toolNames) {
    const candidates = [
      path.join(binDir, toolName),
      path.join(binDir, `${toolName}.cmd`),
      path.join(binDir, `${toolName}.ps1`),
    ];

    const exists = await Promise.all(
      candidates.map(async (candidatePath) => {
        try {
          await fs.access(candidatePath);
          return true;
        } catch {
          return false;
        }
      }),
    );

    if (!exists.some(Boolean)) {
      return false;
    }
  }

  return true;
}

/**
 * Verifica que un directorio exista o falla con mensaje claro.
 */
async function assertDirExists(dirPath, label) {
  try {
    await fs.access(dirPath);
    success(`${label} encontrado en: ${dirPath}`);
  } catch {
    throw new Error(
      `No se encontró ${label} en: ${dirPath}\n` +
        "Asegúrate de que el repositorio está correctamente clonado.",
    );
  }
}

/**
 * Verifica que el dist/build de salida ha sido creado correctamente.
 */
async function assertOutputExists(outputPath, label) {
  try {
    await fs.access(outputPath);
    const entries = await fs.readdir(outputPath);
    if (entries.length === 0) {
      throw new Error(`El directorio ${outputPath} existe pero está vacío.`);
    }
    success(`${label} generado con ${entries.length} entradas en: ${outputPath}`);
  } catch (err) {
    throw new Error(
      `La compilación de ${label} no generó output en: ${outputPath}\n` +
        `Detalle: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

/**
 * Compila el backend NestJS.
 */
async function buildBackend() {
  info("=== COMPILANDO BACKEND (NestJS) ===");

  await assertDirExists(BACKEND_DIR, "Backend");
  await assertDirExists(
    path.join(BACKEND_DIR, "package.json"),
    "package.json del backend",
  );

  const backendState = await getDependencyState(BACKEND_DIR);
  const reuseBackendDependencies = await shouldReuseDependencies(
    BACKEND_DIR,
    BACKEND_CACHE_FILE,
  );
  const backendBuildReady = await hasBuildTools(BACKEND_DIR, ["nest"]);

  if (reuseBackendDependencies && backendBuildReady) {
    success("Dependencias del backend reutilizadas desde la compilación anterior");
  } else {
    // Instalar dependencias (incluyendo devDependencies para compilar)
    info("Instalando dependencias del backend...");
    await run("npm", ["ci", "--prefer-offline", "--no-audit", "--no-fund"], BACKEND_DIR);
    success("Dependencias del backend instaladas");
  }

  // Compilar TypeScript → dist/
  info("Compilando TypeScript del backend...");
  await run("npm", ["run", "build"], BACKEND_DIR);
  await assertOutputExists(path.join(BACKEND_DIR, "dist"), "Backend dist/");

  await writeCache(BACKEND_CACHE_FILE, {
    fingerprint: backendState.fingerprint,
    dependenciesInstalled: true,
    prunedDevDependencies: false,
    builtAt: new Date().toISOString(),
  });

  success("Backend compilado y listo para el instalador ✅");
}

/**
 * Compila el frontend React/Vite.
 */
async function buildFrontend() {
  info("=== COMPILANDO FRONTEND (React/Vite) ===");

  await assertDirExists(FRONTEND_DIR, "Frontend");
  await assertDirExists(
    path.join(FRONTEND_DIR, "package.json"),
    "package.json del frontend",
  );

  const frontendState = await getDependencyState(FRONTEND_DIR);
  const reuseFrontendDependencies = await shouldReuseDependencies(
    FRONTEND_DIR,
    FRONTEND_CACHE_FILE,
  );
  const frontendBuildReady = await hasBuildTools(FRONTEND_DIR, ["vite", "tsc"]);

  if (reuseFrontendDependencies && frontendBuildReady) {
    success("Dependencias del frontend reutilizadas desde la compilación anterior");
  } else {
    // Instalar dependencias (incluyendo devDependencies para compilar)
    info("Instalando dependencias del frontend...");
    await run("npm", ["ci", "--prefer-offline", "--no-audit", "--no-fund"], FRONTEND_DIR);
    success("Dependencias del frontend instaladas");
  }

  // Compilar con Vite → build/
  info("Compilando frontend con Vite...");
  await run("npm", ["run", "build"], FRONTEND_DIR);

  // El frontend React/Vite normalmente genera en 'build' o 'dist'
  // Intentar ambas rutas
  const buildDir = path.join(FRONTEND_DIR, "build");
  const distDir = path.join(FRONTEND_DIR, "dist");

  let outputDir;
  try {
    await fs.access(buildDir);
    outputDir = buildDir;
  } catch {
    try {
      await fs.access(distDir);
      outputDir = distDir;
      // Si el frontend usa dist/ en vez de build/, crear un symlink build/ → dist/
      // para mantener compatibilidad con el Dockerfile y extraResources
      warn(
        "Frontend usa dist/ en lugar de build/. Creando alias build/ → dist/ para compatibilidad...",
      );
      try {
        await fs.symlink(distDir, buildDir, "junction");
        success("Alias build/ creado para compatibilidad con Dockerfile.prod");
      } catch {
        // Si el symlink ya existe, ignorar
        warn("Alias build/ ya existe, continuando...");
      }
    } catch {
      throw new Error(
        "La compilación del frontend no generó build/ ni dist/. Verifica el script npm run build.",
      );
    }
  }

  await assertOutputExists(outputDir, "Frontend build/");

  await writeCache(FRONTEND_CACHE_FILE, {
    fingerprint: frontendState.fingerprint,
    dependenciesInstalled: true,
    builtAt: new Date().toISOString(),
  });
  success("Frontend compilado y listo para el instalador ✅");
}

/**
 * Entry point principal.
 */
async function main() {
  console.log("\n");
  info("================================================================");
  info("SmartEconomat — Pre-Build de Proyecto para Instalador");
  info("================================================================");
  info(
    "IMPORTANTE: Este script compila backend y frontend en el DESARROLLADOR.",
  );
  info(
    "El instalador incluirá los dist/ ya compilados. El cliente NO compilará nada.",
  );
  console.log("\n");

  const startTime = Date.now();

  try {
    await buildBackend();
    console.log("\n");
    await buildFrontend();
    console.log("\n");

    const elapsedSeconds = ((Date.now() - startTime) / 1000).toFixed(1);
    success("================================================================");
    success(`Pre-build completado en ${elapsedSeconds}s 🚀`);
    success("El instalador ahora incluirá binarios pre-compilados.");
    success(
      "Al instalar, el cliente solo hace 'docker compose up' sin compilar.",
    );
    success("================================================================");
  } catch (err) {
    error("================================================================");
    error("Pre-build FALLIDO");
    error(err instanceof Error ? err.message : String(err));
    error(
      "Corrige los errores anteriores antes de empaquetar el instalador.",
    );
    error("================================================================");
    process.exit(1);
  }
}

main();
