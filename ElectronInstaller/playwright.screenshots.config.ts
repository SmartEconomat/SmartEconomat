import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./test/e2e",
  testMatch: /.*screenshots\.spec\.ts/,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  timeout: 180000,
  reporter: [["list"]],
  use: {
    trace: "off",
    screenshot: "off",
    video: "off",
    headless: process.env.HEADED ? false : true,
    viewport: { width: 1920, height: 1240 },
  },
  projects: [
    {
      name: "windows-baseline",
      grepInvert: /@skip-windows-baseline/,
    },
    {
      name: "linux-compat",
      grepInvert: /@skip-linux-compat/,
    },
    {
      name: "macos-compat",
      grepInvert: /@skip-macos-compat/,
    },
  ],
});
