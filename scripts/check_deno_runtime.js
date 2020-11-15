"use strict";

const cp = require("child_process");
const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "../");
const runtimeDir = path.join(rootDir, "src", "_runtime");
const denoDeclarationsPath = path.join(runtimeDir, "deno.d.ts");

// Generate the deno declarations file
const fd = fs.openSync(denoDeclarationsPath, "w");
const result = cp.spawnSync("deno", ["types"], { stdio: ["ignore", fd, "inherit"] });
fs.closeSync(fd);
if (result.status !== 0) {
  console.error("Failed to create deno declaration file");
  if (result.error != null) {
    console.error(result.error);
  }
  process.exit(1);
}

// Run tsc as a child process instead of using the ts package so we get the nice output
// Running tsc with input files disables using tsconfig.json which is perfect
const denoRuntimePath = path.join(runtimeDir, "runtime_deno.ts");
const tscPath = path.join(rootDir, "node_modules", ".bin", "tsc");
const tscResult = cp.spawnSync(tscPath, ["--noEmit", denoRuntimePath], { stdio: "inherit" });
if (tscResult.error != null) {
  console.error(tscResult.error);
  process.exit(1);
}

if (tscResult.status != null && tscResult.status !== 0) {
  process.exit(tscResult.status);
}
