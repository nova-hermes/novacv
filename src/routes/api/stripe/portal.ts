import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/lib/server/clerk";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createPortalSession } from "@/lib/server/stripe";

export const Route = createFileRoute("/api/stripe/portal")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const clerkUser = await authenticateRequest(request);
        if (!clerkUser) {
          return new Response(JSON.stringify({ error: "Unauthorized" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          });
        }

        try {
          const supabase = createServerSupabaseClient();

          // Get user's Stripe customer ID
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, stripe_customer_id")
            .eq("clerk_id", clerkUser.id)
            .single();

          if (userError || !user || !user.stripe_customer_id) {
            return new Response(JSON.stringify({ error: "No subscription found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Create portal session
          const url = await createPortalSession(user.stripe_customer_id);

          return new Response(JSON.stringify({ url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Portal error:", error);
          return new Response(JSON.stringify({ error: "Failed to create portal session" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
