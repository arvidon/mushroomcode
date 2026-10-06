// Resolve the locked workspace dependency for both hoisted and isolated installs.
import { dirname, join } from "node:path";

const cliPath = join(dirname(Bun.resolveSync("prisma/package.json", import.meta.dir)), "build/index.js");
const child = Bun.spawn([process.execPath, cliPath, ...process.argv.slice(2)], {
  cwd: join(import.meta.dir, ".."),
  env: process.env,
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
});
process.exit(await child.exited);
