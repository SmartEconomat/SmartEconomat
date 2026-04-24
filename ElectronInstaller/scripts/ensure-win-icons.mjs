import fs from "node:fs/promises";
import crypto from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import pngToIco from "png-to-ico";

async function hashFile(filePath) {
  const content = await fs.readFile(filePath);
  return crypto.createHash("sha256").update(content).digest("hex");
}

async function readJsonFile(filePath) {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function writeIcon(sourceSvgPath, targetIcoPath) {
  const sizes = [256, 128, 64, 48, 32, 24, 16];
  console.log(`[ICO] Generando (Alta Calidad): ${path.basename(targetIcoPath)}`);
  
  const pngBuffers = await Promise.all(
    sizes.map(async (size) => {
      // Primero renderizamos a un tamaño grande para recortar con precisión
      const baseSize = 512;
      const margin = Math.round(size * 0.05); // 5% de margen
      const contentSize = size - (margin * 2);

      const trimmedBuffer = await sharp(sourceSvgPath, { density: 600 })
        .trim()
        .resize(contentSize, contentSize, {
          fit: "contain",
          kernel: sharp.kernel.lanczos3,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toBuffer();

      // Centramos el contenido recortado en el tamaño final con márgenes consistentes
      return sharp({
        create: {
          width: size,
          height: size,
          channels: 4,
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        }
      })
      .composite([{ input: trimmedBuffer, gravity: "center" }])
      .png()
      .toBuffer();
    }),
  );

  const icoBuffer = await pngToIco(pngBuffers);
  await fs.mkdir(path.dirname(targetIcoPath), { recursive: true });
  await fs.writeFile(targetIcoPath, icoBuffer);
}

import { execSync } from "node:child_process";

async function writeImage(sourceSvgPath, targetPngPath, width, height, background = { r: 255, g: 255, b: 255, alpha: 1 }) {
  console.log(`[PNG] Generando (Alta Calidad): ${path.basename(targetPngPath)} (${width}x${height})`);
  await fs.mkdir(path.dirname(targetPngPath), { recursive: true });
  await sharp(sourceSvgPath, { density: 600 })
    .resize(width, height, {
      fit: "contain",
      kernel: sharp.kernel.lanczos3,
      background,
    })
    .png()
    .toFile(targetPngPath);
}

// Colores de fondo estándar de NSIS en Windows
const NSIS_SIDEBAR_BG = { r: 240, g: 240, b: 240, alpha: 1 }; // Gris (#F0F0F0)
const NSIS_HEADER_BG = { r: 255, g: 255, b: 255, alpha: 1 };   // Blanco (#FFFFFF)

async function writeBmpImage(sourceSvgPath, targetBmpPath, width, height, background = NSIS_SIDEBAR_BG) {
  const tempPngPath = targetBmpPath.replace('.bmp', '.png');
  await writeImage(sourceSvgPath, tempPngPath, width, height, background);
  
  console.log(`[BMP] Convirtiendo a formato NSIS: ${path.basename(targetBmpPath)}`);
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const scriptPath = path.resolve(scriptDir, 'convert-to-bmp.ps1');
  const psCommand = `powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}" -SourcePath "${tempPngPath}" -TargetPath "${targetBmpPath}"`;
  
  execSync(psCommand, { stdio: 'inherit' });
  
  // Limpiar el PNG temporal
  await fs.unlink(tempPngPath);
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(scriptDir, "..");
  const frontendDir = path.resolve(rootDir, "..", "frontend", "smart-economat-frontend");
  
  // Fuentes
  const faviconSvg = path.join(frontendDir, "src", "assets", "icons", "SVG", "favicon.svg");
  const faviconUninstallSvg = path.join(frontendDir, "src", "assets", "icons", "SVG", "favicon-uninstall.svg");
  const installerLogoSvg = path.join(frontendDir, "src", "assets", "images", "SVG", "logo-smat-economato.svg");
  const uninstallerLogoSvg = path.join(frontendDir, "src", "assets", "images", "SVG", "full-uninstall.svg");
  const iconsCachePath = path.join(rootDir, ".cache", "icons-cache.json");

  const hashInputs = [
    faviconSvg,
    faviconUninstallSvg,
    installerLogoSvg,
    uninstallerLogoSvg,
  ];
  const existingHashes = {};
  for (const inputPath of hashInputs) {
    try {
      existingHashes[inputPath] = await hashFile(inputPath);
    } catch {
      existingHashes[inputPath] = "missing";
    }
  }

  const currentFingerprint = crypto
    .createHash("sha256")
    .update(JSON.stringify(existingHashes))
    .digest("hex");
  const previousCache = await readJsonFile(iconsCachePath);
  if (previousCache?.fingerprint === currentFingerprint) {
    console.log("[ICONS] Cache hit: iconos ya actualizados, se omite regeneración.");
    return;
  }

  // 1. Iconos de Aplicación
  await writeIcon(faviconSvg, path.join(rootDir, "resources", "icons", "win", "icon.ico"));
  await writeIcon(faviconSvg, path.join(rootDir, "resources", "icons", "nsis", "installer.ico"));

  // 2. Iconos y Logos de Desinstalación
  // Usamos favicon-uninstall.svg para el ICONO (.ico)
  try {
    await fs.access(faviconUninstallSvg);
    await writeIcon(faviconUninstallSvg, path.join(rootDir, "resources", "icons", "nsis", "uninstaller.ico"));
  } catch (e) {
    console.warn(`⚠️ No se encontró favicon-uninstall.svg.`);
  }

  // Usamos full-uninstall.svg para el LOGO (Sidebar PNG -> BMP)
  try {
    await fs.access(uninstallerLogoSvg);
    await writeBmpImage(uninstallerLogoSvg, path.join(rootDir, "resources", "icons", "nsis", "uninstallerSidebar.bmp"), 164, 314);
  } catch (e) {
    console.warn(`⚠️ Error procesando full-uninstall.svg:`, e.message);
  }

  // 3. Logos del Instalador (Header y Sidebar BMP)
  try {
    await fs.access(installerLogoSvg);
    // El header de NSIS siempre es blanco (#FFFFFF)
    await writeBmpImage(installerLogoSvg, path.join(rootDir, "resources", "icons", "nsis", "installerHeader.bmp"), 150, 57, NSIS_HEADER_BG);
    // El sidebar de NSIS es gris (#F0F0F0)
    await writeBmpImage(installerLogoSvg, path.join(rootDir, "resources", "icons", "nsis", "installerSidebar.bmp"), 164, 314, NSIS_SIDEBAR_BG);
  } catch (e) {
    console.warn(`⚠️ Error procesando logo-smat-economato.svg:`, e.message);
  }

  // 4. Otros Assets PNG (Iconos generales)
  const appPngTargets = [
    path.join(rootDir, "resources", "icons", "icon.png"),
    path.join(rootDir, "resources", "icons", "linux", "icon.png"),
  ];

  for (const target of appPngTargets) {
    await fs.mkdir(path.dirname(target), { recursive: true });
    await sharp(faviconSvg, { density: 600 })
      .resize(1024, 1024, { fit: "contain", kernel: sharp.kernel.lanczos3, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile(target);
  }

  await fs.mkdir(path.dirname(iconsCachePath), { recursive: true });
  await fs.writeFile(
    iconsCachePath,
    `${JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        fingerprint: currentFingerprint,
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});