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

async function resolveSigntoolPath() {
  if (process.env.SIGNTOOL_PATH && process.env.SIGNTOOL_PATH.trim().length > 0) {
    return process.env.SIGNTOOL_PATH.trim();
  }

  const whereResult = await run("where", ["signtool"]);
  const first = whereResult.stdout
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.length > 0);

  if (!first) {
    throw new Error(
      "No se encontró signtool.exe. Instala Windows SDK o exporta SIGNTOOL_PATH.",
    );
  }

  return first;
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

function buildSigningArgs(filePath) {
  const timestampUrl =
    process.env.WIN_TIMESTAMP_URL?.trim() || "http://timestamp.digicert.com";
  const description =
    process.env.WIN_SIGN_DESCRIPTION?.trim() || "SmartEconomat Installer";
  const domain = process.env.DOMAIN?.trim() || "smarteconomat.app";
  const descriptionUrl = `https://${domain}`;

  const base = [
    "sign",
    "/fd",
    "SHA256",
    "/td",
    "SHA256",
    "/tr",
    timestampUrl,
    "/d",
    description,
    "/du",
    descriptionUrl,
  ];

  if (process.env.WIN_CSC_PFX_PATH?.trim()) {
    base.push("/f", process.env.WIN_CSC_PFX_PATH.trim());

    if (process.env.WIN_CSC_PFX_PASSWORD?.trim()) {
      base.push("/p", process.env.WIN_CSC_PFX_PASSWORD.trim());
    }

    if (process.env.WIN_CSC_PFX_SHA1?.trim()) {
      base.push("/sha1", process.env.WIN_CSC_PFX_SHA1.trim());
    }
  } else if (process.env.WIN_CSC_THUMBPRINT?.trim()) {
    base.push("/sha1", process.env.WIN_CSC_THUMBPRINT.trim());
  } else {
    throw new Error(
      "Faltan credenciales de firma. Define WIN_CSC_PFX_PATH (+ WIN_CSC_PFX_PASSWORD opcional) o WIN_CSC_THUMBPRINT.",
    );
  }

  base.push(filePath);
  return base;
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

  await run("powershell", ["-NoProfile", "-Command", ps, filePath]);
}

async function main() {
  const distDir = path.resolve("dist");
  const installers = await findInstallers(distDir);

  if (installers.length === 0) {
    throw new Error("No se encontraron instaladores .exe en dist para firmar.");
  }

  const signTool = await resolveSigntoolPath();

  for (const installerPath of installers) {
    const args = buildSigningArgs(installerPath);
    await run(signTool, args, { stdio: "inherit" });
    await verifyAuthenticode(installerPath);
    console.log(`[SIGN] Firma válida: ${installerPath}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
