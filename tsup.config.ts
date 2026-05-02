import { defineConfig } from "tsup";

export default defineConfig([
  {
    entry: ["src/index.ts"],
    format: ["esm", "cjs"],
    dts: true,
    sourcemap: true,
    clean: true,
    splitting: false,
    target: "es2020",
    outExtension({ format }) {
      return { js: format === "esm" ? ".mjs" : ".cjs" };
    },
  },
  {
    entry: { "agentation-vanilla": "src/index.ts" },
    format: ["iife"],
    globalName: "AgentationVanilla",
    footer: {
      js: "globalThis.UIAnnotator = globalThis.AgentationVanilla;",
    },
    sourcemap: true,
    clean: false,
    splitting: false,
    target: "es2020",
    outExtension() {
      return { js: ".global.js" };
    },
  },
]);
