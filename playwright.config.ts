import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env["PLAYWRIGHT_BASE_URL"] ?? "http://localhost:5173";

export default defineConfig({
  testDir: "tests/smoke",
  timeout: 30_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    ...devices["Desktop Chrome"]
  },
  webServer: {
    command: "pnpm dev",
    url: baseURL,
    reuseExistingServer: !process.env["CI"],
    timeout: 120_000
  }
});
