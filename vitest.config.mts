import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: {
      // `server-only` throws outside React Server Components; unit tests
      // exercise server modules directly.
      "server-only": new URL("./test/server-only-stub.ts", import.meta.url)
        .pathname,
    },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    css: false,
    server: {
      deps: {
        // next-auth imports "next/server" without an extension, which Node's
        // ESM resolver rejects; let Vite resolve it instead.
        inline: ["next-auth"],
      },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["src/**/*.test.{ts,tsx}", "prisma/**/*.test.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["tests/integration/**/*.test.ts"],
          // Integration files share one test database and truncate tables,
          // so they must not run at the same time.
          fileParallelism: false,
        },
      },
    ],
  },
});
