import { defineConfig } from "@playwright/test";
import { execSync } from "child_process";

const EXPO_WEB_PORT = parseInt(process.env.EXPO_WEB_PORT || "18115");
const API_PORT = parseInt(process.env.API_PORT || "8080");
const BASE_URL = `http://localhost:${EXPO_WEB_PORT}`;

let chromiumPath = "chromium";
try {
  chromiumPath = execSync("which chromium", { encoding: "utf-8" }).trim();
} catch {
}

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: "list",

  use: {
    baseURL: BASE_URL,
    headless: true,
    screenshot: "only-on-failure",
    video: "off",
    trace: "off",
    extraHTTPHeaders: {},
  },

  projects: [
    {
      name: "chromium",
      use: {
        browserName: "chromium",
        viewport: { width: 1280, height: 900 },
        launchOptions: {
          executablePath: chromiumPath,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        },
      },
    },
  ],

  webServer: [
    {
      name: "api-server",
      command: `pnpm --filter @workspace/api-server run dev`,
      port: API_PORT,
      reuseExistingServer: true,
      timeout: 60_000,
    },
    {
      name: "expo-web",
      command: `EXPO_PUBLIC_API_URL=http://localhost:${API_PORT} EXPO_PUBLIC_DOMAIN=localhost:${API_PORT} PORT=${EXPO_WEB_PORT} pnpm --filter @workspace/mobile exec expo start --web --port ${EXPO_WEB_PORT} --localhost --no-dev`,
      url: BASE_URL,
      reuseExistingServer: true,
      timeout: 120_000,
    },
  ],
});
