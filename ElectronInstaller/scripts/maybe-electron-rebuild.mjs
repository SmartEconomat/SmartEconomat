import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PACKAGE_JSON_PATH = path.join(ROOT, "package.json");
const LOCKFILE_PATH = path.join(ROOT, "package-lock.json");
const CACHE_PATH = path.join(ROOT, ".cache", "native-rebuild-cache.json");
const NATIVE_DEPENDENCIES = ["sharp"];

function resolveCommand(command) {
  if (process.platform === "win32" && command === "npm") {
    return "npm.cmd";
  }
  return command;
}

function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const resolved = resolveCommand(command);
    const child = spawn(resolved, args, {
      cwd,
      stdio: "inherit",
      shell: process.platform === "win32" && resolved.endsWith(".cmd"),
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(
        new Error(`${command} ${args.join(" ")} failed with ${code ?? -1}`),
      );
    });
  });
}

async function hashLockAndDeps() {
  let dependencySource = "package-lock.json";
  let dependencyContent;

  try {
    dependencyContent = await fs.readFile(LOCKFILE_PATH);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }

    dependencySource = "package.json";
    dependencyContent = await fs.readFile(PACKAGE_JSON_PATH);
  }

  const payload = {
    dependencySource,
    dependencySha: crypto
      .createHash("sha256")
      .update(dependencyContent)
      .digest("hex"),
    nativeDependencies: NATIVE_DEPENDENCIES,
    nodeVersion: process.versions.node,
  };
  return crypto
    .createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
}

async function readCache() {
  try {
    const raw = await fs.readFile(CACHE_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeCache(fingerprint) {
  await fs.mkdir(path.dirname(CACHE_PATH), { recursive: true });
  await fs.writeFile(
    CACHE_PATH,
    `${JSON.stringify({ fingerprint, updatedAt: new Date().toISOString() }, null, 2)}\n`,
    "utf8",
  );
}

async function main() {
  const force = process.env.FORCE_NATIVE_REBUILD === "1";
  const currentFingerprint = await hashLockAndDeps();
  const previous = await readCache();
  const shouldRebuild = force || previous?.fingerprint !== currentFingerprint;

  if (!shouldRebuild) {
    console.log(
      "[NATIVE] Cache hit: se omite npm rebuild para módulos nativos.",
    );
    return;
  }

  console.log("[NATIVE] Ejecutando npm rebuild para dependencias nativas...");
  await run("npm", ["rebuild", ...NATIVE_DEPENDENCIES], ROOT);
  await writeCache(currentFingerprint);
  console.log("[NATIVE] Rebuild nativo completado.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
