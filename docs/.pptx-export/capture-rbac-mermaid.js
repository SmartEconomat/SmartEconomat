const path = require("path");
const { pathToFileURL } = require("url");
const { chromium } = require("playwright");

async function run() {
  const projectRoot = path.resolve(__dirname, "..", "..");
  const inputHtml = path.join(projectRoot, "docs", "documentacion.html");
  const outputImage = path.join(projectRoot, "docs", "assets", "rbac-er-seguridad.png");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1200 },
    deviceScaleFactor: 2,
  });

  await page.goto(pathToFileURL(inputHtml).toString(), {
    waitUntil: "networkidle",
  });
  await page.waitForSelector(".mermaid-wrap svg", { timeout: 30000 });

  const figure = page
    .locator("figure.mermaid-wrap")
    .filter({ hasText: "Seguridad y usuarios" })
    .first();

  await figure.scrollIntoViewIfNeeded();
  await page.waitForTimeout(300);
  await figure.screenshot({ path: outputImage });

  await browser.close();
  console.log(`RBAC Mermaid capturado: ${outputImage}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
