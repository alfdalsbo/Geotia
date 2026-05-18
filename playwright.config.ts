import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

const playwrightPort = process.env.PLAYWRIGHT_PORT ?? "3210";
const baseURL = `http://127.0.0.1:${playwrightPort}`;
const playwrightDataFile = path.join(process.cwd(), ".data", "playwright-geotia.json");

export default defineConfig({
  testDir: "./tests",
  globalSetup: "./tests/global-setup.ts",
  timeout: 60_000,
  workers: 1,
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  webServer: {
    command: `npm run dev -- --hostname 127.0.0.1 --port ${playwrightPort}`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      GEOTIA_PASSCODE: "geotia",
      AUTH_SECRET: "playwright-geotia-secret",
      GEOTIA_DATA_FILE: playwrightDataFile,
      GEOTIA_FORCE_FILE_STORAGE: "1",
      NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: "playwright-google-maps-key",
    },
  },
  projects: [
    {
      name: "chromium",
      testIgnore: /mobile\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "mobile-chromium",
      testMatch: /mobile\.spec\.ts/,
      use: { ...devices["Pixel 5"] },
    },
  ],
});
