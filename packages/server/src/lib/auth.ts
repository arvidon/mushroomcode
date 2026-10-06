import { createClerkClient } from "@clerk/backend";

let clerkClient: ReturnType<typeof createClerkClient> | undefined;

function getClerkClient() {
  if (clerkClient) return clerkClient;

  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error("CLERK_SECRET_KEY environment variable is required");
  }
  if (!process.env.CLERK_PUBLISHABLE_KEY) {
    throw new Error("CLERK_PUBLISHABLE_KEY environment variable is required");
  }

  clerkClient = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  });
  return clerkClient;
}

export async function authenticateOAuthRequest(request: Request) {
  const requestState = await getClerkClient().authenticateRequest(request, {
    acceptsToken: "oauth_token",
  });

  if (!requestState.isAuthenticated) {
    return null;
  }

  const auth = requestState.toAuth();
  if (auth.tokenType !== "oauth_token" || !auth.userId) {
    return null;
  }

  return { userId: auth.userId };
};
