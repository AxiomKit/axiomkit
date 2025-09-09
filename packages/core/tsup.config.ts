import { defineConfig } from "tsup";
import path from "path";
import { tsupConfig } from "../../tsup.config";

export default defineConfig({
  ...tsupConfig,
  entry: ["./src/index.ts"], // Removed non-existent provider entry
  dts: {
    resolve: true,
  },
  esbuildOptions: (options) => {
    // Add path aliases for esbuild
    options.alias = {
      "@": path.resolve(__dirname, "src"),
      "@/types": path.resolve(__dirname, "src/types"),
      "@/utils": path.resolve(__dirname, "src/utils"),
      "@/memory": path.resolve(__dirname, "src/memory"),
      "@/context": path.resolve(__dirname, "src/context"),
      "@/handlers": path.resolve(__dirname, "src/handlers"),
      "@/providers": path.resolve(__dirname, "src/providers"),
      "@/tasks": path.resolve(__dirname, "src/tasks"),
      "@/parsing": path.resolve(__dirname, "src/parsing"),
      "@/prompts": path.resolve(__dirname, "src/prompts"),
      "@/response": path.resolve(__dirname, "src/response"),
      "@/config": path.resolve(__dirname, "src/config"),
      "@/engine": path.resolve(__dirname, "src/engine"),
      "@/logger": path.resolve(__dirname, "src/logger"),
      "@/benchmark": path.resolve(__dirname, "src/benchmark"),
    };
    return options;
  },
  external: [
    // Add external dependencies that shouldn't be bundled
    "@ai-sdk/provider",
    "@ai-sdk/ui-utils",
    "ai",
    "p-defer",
    "uuid",
    "zod",
  ],
});
