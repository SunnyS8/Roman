import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    root: ".",
    include: ["test/**/*.test.ts", "tests/**/*.test.ts"],
    fileParallelism: false,
    alias: {
      // @google/adk barrel-imports 18 peer deps (telemetry exporters, ORM
      // drivers, gcs) at module load time. We only consume the LlmAgent
      // symbol, which doesn't actually need any of them. Stubbing the package
      // in tests avoids forcing every dev/CI env to install all 18 peers.
      // Production build (tsup) uses the real package.
      "@google/adk": resolve(__dirname, "tests/__mocks__/google-adk.ts"),
    },
  },
});
