#!/usr/bin/env node
const { spawnSync } = require("node:child_process");
const { join } = require("node:path");
const result = spawnSync("bun", ["--no-env-file", join(__dirname, "../dist/launch.js"), ...process.argv.slice(2)], {
  stdio: "inherit",
});
if (result.error) {
  console.error("mushroomcode requires Bun on PATH. Install Bun from https://bun.sh, then try again.");
  process.exit(1);
}
process.exit(result.status ?? 1);
