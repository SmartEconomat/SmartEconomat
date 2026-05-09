import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const psScriptPath = path.join(__dirname, "fix-local-hosts.ps1");

const elevateCommand = [
  "$script = '" + psScriptPath.replace(/\\/g, "\\\\") + "'",
  "Start-Process -FilePath 'powershell.exe' -Verb RunAs -Wait -ArgumentList @('-NoProfile','-ExecutionPolicy','Bypass','-File',$script)",
].join("; ");

const result = spawnSync(
  "powershell",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", elevateCommand],
  { encoding: "utf8" },
);

if (result.error) {
  console.error(
    "[fix-local-hosts] No se pudo lanzar elevación:",
    result.error.message,
  );
  process.exit(1);
}

if (result.status !== 0) {
  console.error(
    result.stderr ||
      result.stdout ||
      "[fix-local-hosts] Falló la elevación/UAC.",
  );
  process.exit(result.status ?? 1);
}

console.log(
  "[fix-local-hosts] Reparación de hosts completada (con elevación).",
);
