import { cp, mkdir, chmod } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const cli = await Bun.file(`${root}/packages/cli/package.json`).json();
const output = `${root}/out/mushroomcode`;
const dependencies = Object.fromEntries(
  Object.entries(cli.dependencies).filter(([name]) => !name.startsWith("@mushroomcode/")),
);
const result = await Bun.build({
  entrypoints: [`${root}/packages/cli/src/launch.ts`],
  outdir: `${output}/dist`,
  target: "bun",
  external: Object.keys(dependencies),
  tsconfig: `${root}/packages/cli/tsconfig.json`,
});
if (!result.success) {
  for (const message of result.logs) console.error(message);
  process.exit(1);
}
await mkdir(`${output}/bin`, { recursive: true });
await cp(`${root}/packages/cli/bin/mushroomcode.cjs`, `${output}/bin/mushroomcode.cjs`);
await chmod(`${output}/bin/mushroomcode.cjs`, 0o755);
await Bun.write(`${output}/package.json`, JSON.stringify({
  name: "mushroomcode",
  version: "1.0.0",
  description: "Terminal coding assistant with local tools and a hosted API",
  type: "module",
  bin: { mushroomcode: "bin/mushroomcode.cjs" },
  files: ["bin", "dist", "README.md"],
  engines: { node: ">=20" },
  dependencies,
}, null, 2) + "\n");
await Bun.write(`${output}/README.md`, `# Mushroomcode

Requires Node.js 20+ and Bun 1.3.14+ on PATH. This package uses Bun for its terminal renderer.

Install with \`npm install -g mushroomcode\`, or install a provided tarball using \`npm install -g ./mushroomcode-1.0.0.tgz\`.

Run \`mushroomcode --api-url https://YOUR-BACKEND\` inside your project. The URL is saved for subsequent \`mushroomcode\` runs. Use /login to authenticate and /upgrade for credits.

File edits and shell commands run on your machine. The hosted API receives conversation and tool output. Provider and billing secrets stay on the server.

Sandbox checkouts are test payments. They do not pay for the server's real model API calls. Supported platforms depend on OpenTUI's native packages; test each intended platform before release.
`);
console.log(`CLI package staged in ${output}. Run npm pack inside that directory.`);
