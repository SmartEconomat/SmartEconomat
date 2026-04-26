const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

async function run() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const inputHtml = path.join(projectRoot, "docs", "presentacion-tfg.html");
  const outputPdf = path.join(
    projectRoot,
    "docs",
    "SmartEconomat - Presentacion tecnica TFG DAW.pdf"
  );

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(pathToFileURL(inputHtml).toString(), {
    waitUntil: "networkidle",
  });
  await page.emulateMedia({ media: "print" });
  await page.waitForTimeout(400);

  await page.pdf({
    path: outputPdf,
    format: "A4",
    landscape: true,
    printBackground: true,
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log(`PDF generado: ${outputPdf}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
