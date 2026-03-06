import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    exclude: ["dist/**"],
    environment: "node",
    reporters: ["default", ["json", { outputFile: "../tests/registry/latest_report.json" }]],
  },
});
