import esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/main.ts"],
  bundle: true,
  outfile: "dist/main.js",
  // Obsidian と Electron が提供するモジュールは外部扱い
  external: ["obsidian", "electron", "@codemirror/*", "@lezer/*"],
  // Node.js 組み込みモジュールはバンドルせず require() のまま残す
  platform: "node",
  target: "es2020",
  format: "cjs",
  sourcemap: "inline",
  logLevel: "info",
});
