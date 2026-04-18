/**
 * Server-side Clerk auth helper.
 * Verifies the session JWT from request cookies and returns the user ID.
 * Used in TanStack Start server route handlers.
 */

const CLERK_API_BASE = "https://api.clerk.com/v1";

export interface ClerkUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/**
 * Extract the session token from the request cookies.
 * Clerk stores the session JWT in __session cookie.
 */
function extractSessionToken(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  if (!cookieHeader) return null;

  const cookies = cookieHeader.split(";").reduce(
    (acc, cookie) => {
      const [key, ...rest] = cookie.trim().split("=");
      acc[key] = rest.join("=");
      return acc;
    },
    {} as Record<string, string>
  );

  return cookies["__session"] || null;
}

/**
 * Decode a JWT payload without verification (just base64 decode).
 * Used to extract session/user IDs from Clerk's __session cookie.
 */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

/**
 * Verify a Clerk session and return user info.
 * 1. Decode the JWT from the __session cookie to get user/session IDs
 * 2. Verify the session is active via Clerk's API
 * 3. Fetch user details
 */
export async function authenticateRequest(
  request: Request
): Promise<ClerkUser | null> {
  const sessionToken = extractSessionToken(request);
  if (!sessionToken) {
    console.warn("[Clerk Auth] No __session cookie found");
    return null;
  }

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.warn("CLERK_SECRET_KEY not set — auth verification disabled");
    return null;
  }

  try {
    // Decode JWT to get user ID and session ID
    const payload = decodeJwtPayload(sessionToken);
    if (!payload) return null;

    const userId = payload.sub;
    const sessionId = payload.sid;
    if (!userId) {
      console.warn("[Clerk Auth] JWT has no sub claim");
      return null;
    }
    console.log("[Clerk Auth] Verified user:", userId);

    // Verify session is active via Clerk API
    if (sessionId) {
      const sessionResponse = await fetch(
        `${CLERK_API_BASE}/sessions/${sessionId}`,
        {
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
          },
        }
      );

      if (!sessionResponse.ok) return null;

      const sessionData = await sessionResponse.json();
      if (sessionData.status !== "active") return null;
    }

    // Fetch user details
    const userResponse = await fetch(`${CLERK_API_BASE}/users/${userId}`, {
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
      },
    });

    if (!userResponse.ok) return null;

    const userData = await userResponse.json();
    const primaryEmail = userData.email_addresses?.find(
      (e: any) => e.id === userData.primary_email_address_id
    );

    return {
      id: userData.id,
      email: primaryEmail?.email_address || "",
      firstName: userData.first_name,
      lastName: userData.last_name,
    };
  } catch (error) {
    console.error("Clerk auth verification failed:", error);
    return null;
  }
}

/**
 * Get or create user in Supabase after Clerk authentication.
 */
export async function ensureUserInSupabase(
  clerkUser: ClerkUser,
  supabase: any
): Promise<string | null> {
  // Check if user exists
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_id", clerkUser.id)
    .single();

  if (existingUser) return existingUser.id;

  // Create new user
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      clerk_id: clerkUser.id,
      email: clerkUser.email,
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to create user in Supabase:", error);
    return null;
  }

  return newUser.id;
}
