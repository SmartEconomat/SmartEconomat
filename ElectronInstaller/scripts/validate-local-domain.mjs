import path from "node:path";
import { fileURLToPath } from "node:url";

import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const scriptPath = path.join(__dirname, "validate-local-domain.ps1");
const domain = process.env.DOMAIN || "smarteconomat.app";
const httpPort = process.env.SMART_HTTP_PORT || "80";
const httpsPort = process.env.SMART_HTTPS_PORT || "443";

const result = spawnSync(
  "powershell",
  [
    "-NoProfile",
    "-ExecutionPolicy",
    "Bypass",
    "-File",
    scriptPath,
    "-Domain",
    domain,
    "-HttpPort",
    httpPort,
    "-HttpsPort",
    httpsPort,
  ],
  {
    encoding: "utf8",
  },
);

if (result.error) {
  console.error("[validate-local-domain] No se pudo ejecutar PowerShell:", result.error.message);
  process.exit(1);
}

if (result.status !== 0) {
  console.error(result.stderr || result.stdout || "[validate-local-domain] Error desconocido");
  process.exit(result.status ?? 1);
}

let parsed;
try {
  parsed = JSON.parse(result.stdout);
} catch {
  console.error("[validate-local-domain] Respuesta no JSON:");
  console.error(result.stdout);
  process.exit(1);
}

if (!parsed.ok) {
  console.error("[validate-local-domain] Validación fallida:");
  for (const check of parsed.checks ?? []) {
    const status = check.ok ? "OK" : "FAIL";
    console.error(`- ${status} ${check.name}: ${check.detail}`);
  }
  process.exit(2);
}

console.log("[validate-local-domain] Validación completada correctamente.");
for (const check of parsed.checks ?? []) {
  console.log(`- OK ${check.name}: ${check.detail}`);
}
