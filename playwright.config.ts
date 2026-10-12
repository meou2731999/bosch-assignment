import { defineConfig, devices } from "@playwright/test";
const slowMo = Number(process.env.E2E_SLOW_MO ?? 0);
export default defineConfig({
  timeout: slowMo > 0 ? 180000 : 30000,
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
  forbidOnly: Boolean(process.env.CI),
  globalTimeout: (slowMo > 0 ? 30 : 10) * 60 * 1000,
  reporter: [["list"], ["html", { open: "never" }]],
  workers: 1,
  fullyParallel: false,
  use: {
    launchOptions: { slowMo },
    baseURL: "http://127.0.0.1:3107",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "npm run build && npx tsx e2e/server.ts",
    url: "http://127.0.0.1:3107/api/health",
    reuseExistingServer: false,
    timeout: 60000,
    gracefulShutdown: { signal: "SIGTERM", timeout: 5000 },
  },
});
