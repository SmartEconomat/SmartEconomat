import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

async function convert() {
  const sourceSvg = 'C:/Users/psych/projects/SmartEconomat/frontend/smart-economat-frontend/src/assets/images/SVG/logo-smat-economato.svg';
  const targetPng = 'C:/Users/psych/projects/SmartEconomat/ElectronInstaller/resources/icons/nsis/installerSidebar.png';

  if (!fs.existsSync(sourceSvg)) {
    console.error('Source SVG not found:', sourceSvg);
    process.exit(1);
  }

  try {
    await sharp(sourceSvg)
      .resize(164, 314, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      })
      .png()
      .toFile(targetPng);
    
    console.log('Successfully converted installer sidebar icon.');
  } catch (err) {
    console.error('Conversion failed:', err);
    process.exit(1);
  }
}

convert();
