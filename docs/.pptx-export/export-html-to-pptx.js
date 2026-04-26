const path = require("path");
const fs = require("fs/promises");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");
const PptxGenJS = require("pptxgenjs");

async function run() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const inputHtml = path.join(projectRoot, "docs", "presentacion-tfg.html");
  const outputPptx = path.join(
    projectRoot,
    "docs",
    "SmartEconomat - Presentacion tecnica TFG DAW.pptx"
  );
  const shotsDir = path.join(projectRoot, "docs", ".pptx-export", "shots");

  await fs.mkdir(shotsDir, { recursive: true });
  const shotFiles = await fs.readdir(shotsDir);
  await Promise.all(
    shotFiles.map((file) => fs.rm(path.join(shotsDir, file), { force: true }))
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1403, height: 993 },
    deviceScaleFactor: 2,
  });

  await page.goto(pathToFileURL(inputHtml).toString(), {
    waitUntil: "networkidle",
  });
  await page.emulateMedia({ media: "screen" });
  await page.addStyleTag({
    content: `
      html, body { background: #ffffff !important; }
      .deck { max-width: none !important; margin: 0 !important; padding: 0 !important; }
      .slide {
        width: 1403px !important;
        min-height: 993px !important;
        height: 993px !important;
        max-height: 993px !important;
        margin: 0 !important;
        border-radius: 0 !important;
        box-shadow: none !important;
        border: none !important;
        overflow: hidden !important;
        padding: 22px 28px 26px !important;
      }
      h1 { font-size: 2.1rem !important; line-height: 1.08 !important; }
      h2 { font-size: 1.56rem !important; margin: 0 0 .58rem !important; }
      p { margin: .26rem 0 !important; }
      ul, ol { margin: .34rem 0 0 1rem !important; }
      li { margin: .12rem 0 !important; }
      .grid-2, .grid-3, .metric-strip { gap: .48rem !important; }
      .card { padding: .5rem .56rem !important; }
      .note { margin-top: .42rem !important; padding: .42rem .56rem !important; font-size: .88rem !important; line-height: 1.24 !important; }
      .diagram { margin-top: .4rem !important; padding: .4rem !important; }
      .diagram svg { max-height: 420px !important; }
      .json-example {
        font-size: .6rem !important;
        line-height: 1.14 !important;
        max-height: 330px !important;
        overflow: hidden !important;
        margin-top: .4rem !important;
        padding: .46rem !important;
      }
    `,
  });
  await page.waitForTimeout(500);

  const totalSlides = await page.locator(".slide").count();
  if (!totalSlides) {
    throw new Error("No se encontraron slides con selector .slide");
  }

  const images = [];
  for (let i = 0; i < totalSlides; i += 1) {
    const slide = page.locator(".slide").nth(i);
    await slide.scrollIntoViewIfNeeded();
    await page.waitForTimeout(80);
    const filePath = path.join(shotsDir, `slide-${String(i + 1).padStart(2, "0")}.png`);
    await slide.screenshot({ path: filePath });
    images.push(filePath);
  }

  await browser.close();

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "A4_LANDSCAPE", width: 11.69, height: 8.27 });
  pptx.layout = "A4_LANDSCAPE";
  pptx.author = "SmartEconomat";
  pptx.company = "SmartEconomat";
  pptx.subject = "Presentacion tecnica TFG DAW";
  pptx.title = "SmartEconomat - Presentacion tecnica";

  for (const imagePath of images) {
    const slide = pptx.addSlide();
    slide.background = { color: "FFFFFF" };
    slide.addImage({ path: imagePath, x: 0, y: 0, w: 11.69, h: 8.27 });
  }

  await pptx.writeFile({ fileName: outputPptx });
  console.log(`PPTX generado: ${outputPptx}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
