import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";
import pngToIco from "png-to-ico";

async function writeIcon(sourceSvgPath, targetIcoPath) {
  const pngBuffer = await sharp(sourceSvgPath)
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
    
  const icoBuffer = await pngToIco(pngBuffer);
  await fs.mkdir(path.dirname(targetIcoPath), { recursive: true });
  await fs.writeFile(targetIcoPath, icoBuffer);
}

async function main() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const rootDir = path.resolve(scriptDir, "..");
  const faviconSvg = path.resolve(
    rootDir,
    "..",
    "frontend",
    "smart-economat-frontend",
    "src",
    "assets",
    "icons",
    "SVG",
    "favicon.svg",
  );

  try {
    await fs.access(faviconSvg);
  } catch {
    throw new Error(
      "No se encontró favicon.svg en frontend para generar el icono de la app.",
    );
  }

  const faviconTargets = [
    path.join(rootDir, "resources", "icons", "icon.png"),
    path.join(rootDir, "resources", "icons", "linux", "icon.png"),
    path.join(rootDir, "resources", "icons", "win", "icon.ico"),
  ];

  for (const target of faviconTargets) {
    if (target.toLowerCase().endsWith(".png")) {
      await fs.mkdir(path.dirname(target), { recursive: true });
      await sharp(faviconSvg)
        .resize(1024, 1024, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png()
        .toFile(target);
      continue;
    }

    await writeIcon(faviconSvg, target);
  }

  const nsisTargets = [
    path.join(rootDir, "resources", "icons", "nsis", "installer.ico"),
    path.join(rootDir, "resources", "icons", "nsis", "uninstaller.ico"),
  ];

  for (const target of nsisTargets) {
    await writeIcon(faviconSvg, target);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});