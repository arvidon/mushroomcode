import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

const configDir = join(homedir(), ".nightcode");
const configFile = join(configDir, "config.json");
const args = process.argv.slice(2);

if (args.includes("--help") || args.includes("-h")) {
  console.log(`mushroomcode [--api-url URL]

Run inside the project you want to edit. Requires Bun 1.3.14 or newer.
--api-url URL  Save the hosted backend URL for future runs.
--version      Print the installed version.
Use /login to sign in and /upgrade to purchase credits.`);
  process.exit(0);
}
if (args.includes("--version")) {
  console.log("1.0.0");
  process.exit(0);
}

try {
  let saved: { apiUrl?: string } = {};
  try { saved = JSON.parse(readFileSync(configFile, "utf8")); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }

  if (args.length && (args.length !== 2 || args[0] !== "--api-url")) {
    throw new Error("Unknown arguments. Run mushroomcode --help.");
  }
  const apiUrl = new URL(args[1] ?? process.env.API_URL ?? saved.apiUrl ?? "https://mushroomcodeserver-production-5a18.up.railway.app");
  if (!["http:", "https:"].includes(apiUrl.protocol) || apiUrl.username || apiUrl.password) {
    throw new Error("API URL must be an HTTP(S) URL without credentials.");
  }
  if (apiUrl.protocol !== "https:" && !["localhost", "127.0.0.1", "[::1]"].includes(apiUrl.hostname)) {
    throw new Error("Remote API URLs must use HTTPS.");
  }
  process.env.API_URL = apiUrl.toString().replace(/\/$/, "");
  if (args[1]) {
    mkdirSync(configDir, { recursive: true, mode: 0o700 });
    writeFileSync(configFile, JSON.stringify({ apiUrl: process.env.API_URL }), { mode: 0o600 });
  }

  const response = await fetch(`${process.env.API_URL}/config`, {
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error(`Backend configuration failed (${response.status}).`);
  const config = await response.json() as {
    clerkFrontendApi?: string;
    clerkOAuthClientId?: string;
    sandboxBilling?: boolean;
  };
  if (!config.clerkFrontendApi || !config.clerkOAuthClientId) {
    throw new Error("The backend is missing its Clerk OAuth configuration.");
  }
  process.env.CLERK_FRONTEND_API = config.clerkFrontendApi;
  process.env.CLERK_OAUTH_CLIENT_ID = config.clerkOAuthClientId;
  if (config.sandboxBilling) {
    console.error("Demo billing: purchases use Polar test payments. Model API usage is real.");
  }
  await import("./index");
} catch (error) {
  console.error(`mushroomcode: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
