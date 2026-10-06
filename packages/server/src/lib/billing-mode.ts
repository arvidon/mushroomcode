// Set only in the server environment, never from a client request.
// Hosted services continue to require credits unless explicitly configured.
export function usesCreditsBilling() {
  const mode = process.env.BILLING_MODE ?? "credits";
  if (mode !== "credits" && mode !== "byok") {
    throw new Error("BILLING_MODE must be either 'credits' or 'byok'");
  }
  return mode === "credits";
}
