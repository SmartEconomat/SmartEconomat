import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, "..", "dist");

function toMb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(2);
}

async function main() {
  let files;
  try {
    files = await fs.readdir(distDir, { withFileTypes: true });
  } catch {
    console.error("No existe directorio dist. Ejecuta primero un build.");
    process.exit(1);
  }

  const artifacts = [];

  for (const entry of files) {
    if (!entry.isFile()) {
      continue;
    }

    const fullPath = path.join(distDir, entry.name);
    const stat = await fs.stat(fullPath);
    artifacts.push({
      name: entry.name,
      sizeBytes: stat.size,
      modifiedAt: stat.mtime.toISOString(),
    });
  }

  if (artifacts.length === 0) {
    console.log("No hay artefactos en dist todavía.");
    return;
  }

  artifacts.sort((a, b) => b.sizeBytes - a.sizeBytes);

  let totalBytes = 0;

  console.log("Artefactos detectados en dist:");
  for (const artifact of artifacts) {
    totalBytes += artifact.sizeBytes;
    console.log(
      ` - ${artifact.name}: ${toMb(artifact.sizeBytes)} MB (modificado ${artifact.modifiedAt})`,
    );
  }

  console.log(`Total: ${toMb(totalBytes)} MB en ${artifacts.length} archivo(s).`);
}

await main();
