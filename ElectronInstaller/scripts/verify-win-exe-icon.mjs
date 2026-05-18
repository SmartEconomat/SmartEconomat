import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const scriptPath = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(scriptPath), "..");

function resolveExePath() {
  const fromEnv = process.env.VERIFY_WIN_EXE_PATH?.trim();
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.resolve(rootDir, fromEnv);
  }

  const candidates = [
    path.join(
      rootDir,
      ".cache",
      "builder-workspace",
      "dir-output",
      "win-unpacked",
      "SmartEconomat.exe",
    ),
    path.join(rootDir, "dist", "win-unpacked", "SmartEconomat.exe"),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[candidates.length - 1];
}

const exePath = resolveExePath();
const icoPath = path.join(rootDir, "resources", "icons", "win", "icon.ico");
const bmpExePath = path.join(rootDir, "dist", "_icon-from-exe.bmp");
const bmpSrcPath = path.join(rootDir, "dist", "_icon-from-src.bmp");

const psScript = [
  "Add-Type -AssemblyName System.Drawing",
  `$exePath = '${exePath.replace(/'/g, "''")}'`,
  `$icoPath = '${icoPath.replace(/'/g, "''")}'`,
  `$bmpExePath = '${bmpExePath.replace(/'/g, "''")}'`,
  `$bmpSrcPath = '${bmpSrcPath.replace(/'/g, "''")}'`,
  "if (-not (Test-Path -LiteralPath $exePath)) { throw \"SmartEconomat.exe no encontrado para verificacion de icono en: $exePath\" }",
  "if (-not (Test-Path -LiteralPath $icoPath)) { throw \"icon.ico no encontrado para verificacion\" }",
  "$exeIcon = [System.Drawing.Icon]::ExtractAssociatedIcon($exePath)",
  "$bmpExe = New-Object System.Drawing.Bitmap 256,256",
  "$g1=[System.Drawing.Graphics]::FromImage($bmpExe)",
  "$g1.Clear([System.Drawing.Color]::Transparent)",
  "$g1.DrawIcon($exeIcon,0,0)",
  "$g1.Dispose()",
  "$bmpExe.Save($bmpExePath,[System.Drawing.Imaging.ImageFormat]::Bmp)",
  "$srcIcon = New-Object System.Drawing.Icon($icoPath)",
  "$bmpSrc = New-Object System.Drawing.Bitmap 256,256",
  "$g2=[System.Drawing.Graphics]::FromImage($bmpSrc)",
  "$g2.Clear([System.Drawing.Color]::Transparent)",
  "$g2.DrawIcon($srcIcon,0,0)",
  "$g2.Dispose()",
  "$bmpSrc.Save($bmpSrcPath,[System.Drawing.Imaging.ImageFormat]::Bmp)",
  "$h1=(Get-FileHash $bmpExePath -Algorithm SHA256).Hash",
  "$h2=(Get-FileHash $bmpSrcPath -Algorithm SHA256).Hash",
  "Write-Output \"EXE_BMP_HASH=$h1\"",
  "Write-Output \"SRC_BMP_HASH=$h2\"",
  "if ($h1 -ne $h2) { Write-Error \"ICON_MISMATCH\"; exit 2 }",
  "Write-Output \"ICON_MATCH\"",
].join("; ");

const result = spawnSync(
  "powershell",
  ["-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", psScript],
  {
    cwd: rootDir,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  },
);

if (result.stdout) {
  process.stdout.write(result.stdout);
}
if (result.stderr) {
  process.stderr.write(result.stderr);
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}
