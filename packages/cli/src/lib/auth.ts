import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

type AuthData = {
  token: string;
  apiUrl: string;
};

const AUTH_DIR = join(homedir(), ".nightcode");
const AUTH_FILE = join(AUTH_DIR, "auth.json");

export function normalizeApiUrl(apiUrl = process.env.API_URL ?? "http://localhost:3000") {
  const url = new URL(apiUrl);
  url.search = "";
  url.hash = "";
  return url.toString().replace(/\/+$/, "");
}

export function parseAuthForBackend(data: string, apiUrl?: string): AuthData | null {
  try {
    const parsed = JSON.parse(data) as Partial<AuthData>;
    if (typeof parsed.token !== "string" || !parsed.token || typeof parsed.apiUrl !== "string") {
      return null;
    }
    return normalizeApiUrl(parsed.apiUrl) === normalizeApiUrl(apiUrl)
      ? { token: parsed.token, apiUrl: normalizeApiUrl(parsed.apiUrl) }
      : null;
  } catch {
    return null;
  }
}
export function getAuth(): AuthData | null {
  try {
    const data = readFileSync(AUTH_FILE, "utf-8");
    // Legacy unscoped tokens require a fresh login rather than guessing
    // which server originally received authorization.
    return parseAuthForBackend(data);
  } catch {
    return null;
  }
};

export function saveAuth(data: { token: string; apiUrl?: string }) {
  if (!existsSync(AUTH_DIR)) {
    // Owner-only permissions (rwx------) so other users on the machine can't read tokens
    mkdirSync(AUTH_DIR, { mode: 0o700 });
  }
  writeFileSync(AUTH_FILE, JSON.stringify({
    token: data.token,
    apiUrl: normalizeApiUrl(data.apiUrl),
  }), { mode: 0o600 });
}

export function clearAuth() {
  try {
    unlinkSync(AUTH_FILE);
  } catch {
    // File doesn't exist
  }
}
