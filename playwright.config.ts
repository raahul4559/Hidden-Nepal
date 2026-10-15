import { defineConfig, devices } from "@playwright/test";

const PORT = Number(process.env.PORT ?? 3100);
const baseURL = `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
  // Runs against a production build so tests match what ships.
  webServer: {
    command: `npm run build && npm run start -- --port ${PORT}`,
    url: baseURL,
    // Always start fresh: a stale server from an older build serves dead CSS.
    reuseExistingServer: false,
    // `next start` is a production server; Auth.js only trusts the request
    // host there when told to. Deployments set AUTH_URL or AUTH_TRUST_HOST.
    env: { AUTH_TRUST_HOST: "true" },
    timeout: 180_000,
  },
});
