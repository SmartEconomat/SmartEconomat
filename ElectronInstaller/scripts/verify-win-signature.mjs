import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      shell: false,
      stdio: ["ignore", "pipe", "pipe"],
      ...options,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });

    child.on("error", reject);

    child.on("exit", (code) => {
      if (code === 0) {
        resolve({ stdout, stderr, code: 0 });
        return;
      }

      reject(
        new Error(
          `${command} ${args.join(" ")} failed with exit code ${code ?? -1}\n${stderr || stdout}`,
        ),
      );
    });
  });
}

async function findInstallers(distDir) {
  const entries = await fs.readdir(distDir, { withFileTypes: true });
  return entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.toLowerCase().startsWith("smarteconomat-") &&
        entry.name.toLowerCase().endsWith(".exe") &&
        !entry.name.toLowerCase().endsWith(".__uninstaller.exe"),
    )
    .map((entry) => path.join(distDir, entry.name));
}

async function verifyAuthenticode(filePath) {
  const ps = [
    "$sig = Get-AuthenticodeSignature -LiteralPath $args[0]",
    "if ($sig.Status -ne 'Valid') {",
    "  Write-Error ('Firma inválida: ' + $sig.Status + ' - ' + $sig.StatusMessage)",
    "  exit 1",
    "}",
    "if ($null -eq $sig.SignerCertificate) {",
    "  Write-Error 'No se detectó certificado de firma.'",
    "  exit 1",
    "}",
    "Write-Output ('VALID|' + $sig.SignerCertificate.Subject)",
  ].join("; ");

  const result = await run("powershell", [
    "-NoProfile",
    "-Command",
    ps,
    filePath,
  ]);

  const summary = result.stdout.trim();
  console.log(`[SIGN-CHECK] ${path.basename(filePath)} -> ${summary}`);
}

async function main() {
  const distDir = path.resolve("dist");
  const installers = await findInstallers(distDir);

  if (installers.length === 0) {
    throw new Error("No se encontraron instaladores .exe en dist para verificar.");
  }

  for (const installerPath of installers) {
    await verifyAuthenticode(installerPath);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
