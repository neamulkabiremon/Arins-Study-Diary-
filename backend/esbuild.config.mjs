import * as esbuild from "esbuild";

await esbuild.build({
  entryPoints: ["src/handler.ts"],
  bundle: true,
  platform: "node",
  target: "node20",
  format: "cjs",
  outfile: "dist/handler.js",
  sourcemap: true,
  external: [],
  minify: false,
});

console.log("backend bundle written to dist/handler.js");
