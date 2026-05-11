import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const sourcePng = 'C:/Users/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/assets/images/PNG/full-uninstall.png';
const targetPng = 'C:/Users/psych/projects/SmartEconomat/ElectronInstaller/resources/icons/nsis/uninstallerSidebar.png';

async function main() {
  if (!fs.existsSync(sourcePng)) {
    console.error('Source PNG not found:', sourcePng);
    process.exit(1);
  }

  const dir = path.dirname(targetPng);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  try {
    await sharp(sourcePng)
      .resize(164, 314, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(targetPng);
    
    console.log('Successfully created uninstaller sidebar PNG:', targetPng);
  } catch (err) {
    console.error('Processing failed:', err);
    process.exit(1);
  }
}

main();
