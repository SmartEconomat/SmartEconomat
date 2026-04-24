import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function convert() {
  const sourceSvg = 'C:/Users/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/assets/images/SVG/full-uninstall.svg';
  const targetPng = 'C:/Users/psych/projects/SmartEconomat/ElectronInstaller/resources/icons/nsis/uninstallerSidebar.png';

  if (!fs.existsSync(sourceSvg)) {
    console.error('Source SVG not found:', sourceSvg);
    process.exit(1);
  }

  // NSIS Sidebar standard size: 164 x 314
  // We'll use a slightly higher resolution for better quality if needed, 
  // but NSIS is picky about aspect ratio.
  
  try {
    await sharp(sourceSvg)
      .resize(164, 314, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(targetPng);
    
    console.log('Successfully converted uninstaller sidebar icon.');
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
}

convert();
