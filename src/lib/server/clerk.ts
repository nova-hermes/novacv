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
 * Verify a session token with Clerk's API and return user info.
 * Falls back to JWT decoding if CLERK_SECRET_KEY is not set.
 */
export async function authenticateRequest(
  request: Request
): Promise<ClerkUser | null> {
  const sessionToken = extractSessionToken(request);
  if (!sessionToken) return null;

  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.warn("CLERK_SECRET_KEY not set — auth verification disabled");
    return null;
  }

  try {
    // Use Clerk's /sessions/ endpoint to verify
    const response = await fetch(`${CLERK_API_BASE}/sessions/verify`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${clerkSecretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ token: sessionToken }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const userId = data?.session?.user_id;
    if (!userId) return null;

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
