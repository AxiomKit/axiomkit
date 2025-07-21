import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["*.test.ts", "**/*.{test,spec}.?(c|m)[jt]s?(x)"],
  },
});
