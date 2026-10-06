import { createMiddleware } from "hono/factory";
import type { AuthenticatedEnv } from "./require-auth";
import { getAvailableCreditsBalance } from "../lib/polar";
import { usesCreditsBilling } from "../lib/billing-mode";

export const requireCreditsBalance = createMiddleware<AuthenticatedEnv>(async (c, next) => {
  try {
    if (!usesCreditsBilling()) {
      await next();
      return;
    }
    const userId = c.get("userId");
    const creditsBalance = await getAvailableCreditsBalance(userId);

    // This is a simple launch-time gate: only start new work when the customer
    // still has credits left. It does not reserve the full eventual cost of the
    // request, so low-volume apps may tolerate small overspend on edge cases.
    if (creditsBalance <= 0) {
      return c.json({ error: "No credits remaining. Run /upgrade to buy more credits." }, 402);
    }

    await next();
  } catch (error) {
    console.error("Credit balance verification failed", error instanceof Error ? error.message : "Unknown error");
    return c.json({ error: "Unable to verify credits balance right now." }, 503);
  }
});
