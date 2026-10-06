import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { db } from "@mushroomcode/database/client";

import { requireAuth } from "./middleware/require-auth";
import sessions from "./routes/sessions";
import chat from "./routes/chat";
import auth from "./routes/auth";
import billing from "./routes/billing";

const app = new Hono();

app.get("/health", (c) => c.json({ status: "ok" }));
app.get("/ready", async (c) => {
  try {
    await db.$queryRaw`SELECT 1 FROM "Session" LIMIT 1`;
    return c.json({ status: "ok" });
  } catch {
    return c.json({ status: "unavailable" }, 503);
  }
});
// These are public OAuth client settings, never server credentials.
app.get("/config", (c) => c.json({
  clerkFrontendApi: process.env.CLERK_FRONTEND_API
    ? new URL(process.env.CLERK_FRONTEND_API).origin : null,
  clerkOAuthClientId: process.env.CLERK_OAUTH_CLIENT_ID ?? null,
  sandboxBilling: process.env.POLAR_SERVER !== "production",
}));

app.onError((error, c) => {
  if (error instanceof HTTPException) {
    return c.json({ 
      error: error.message || "Request failed",
    }, error.status);
  };

  console.error("Unhandled server error", error);
  return c.json({ error: "Internal server error" }, 500);
});

app.use("/sessions/*", requireAuth);
app.use("/chat/*", requireAuth);
app.use("/billing/checkout", requireAuth);
app.use("/billing/portal", requireAuth);

const routes = app
  .route("/auth", auth)
  .route("/billing", billing)
  .route("/sessions", sessions)
  .route("/chat", chat);

export type AppType = typeof routes;
// idleTimeout must be high, otherwise LLM tool calls might not complete
export default {
  hostname: "0.0.0.0",
  port: Number(process.env.PORT ?? 3000),
  fetch: app.fetch,
  idleTimeout: 255,
};
