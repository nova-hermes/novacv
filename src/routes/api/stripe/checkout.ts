import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/lib/server/clerk";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createCheckoutSession, getOrCreateCustomer } from "@/lib/server/stripe";
import type { Plan } from "@/config/stripe";

export const Route = createFileRoute("/api/stripe/checkout")({
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
          const body = await request.json();
          const plan = body.plan as Plan;

          if (!plan || !["pro_monthly", "pro_yearly", "lifetime"].includes(plan)) {
            return new Response(JSON.stringify({ error: "Invalid plan" }), {
              status: 400,
              headers: { "Content-Type": "application/json" },
            });
          }

          const supabase = createServerSupabaseClient();

          // Get user from Supabase
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("id, stripe_customer_id")
            .eq("clerk_id", clerkUser.id)
            .single();

          if (userError || !user) {
            return new Response(JSON.stringify({ error: "User not found" }), {
              status: 404,
              headers: { "Content-Type": "application/json" },
            });
          }

          // Get or create Stripe customer
          const customerId = await getOrCreateCustomer(
            clerkUser.email,
            clerkUser.id,
            user.stripe_customer_id
          );

          // Save customer ID if new
          if (!user.stripe_customer_id) {
            await supabase
              .from("users")
              .update({ stripe_customer_id: customerId })
              .eq("id", user.id);
          }

          // Create checkout session
          const url = await createCheckoutSession(customerId, plan, user.id);

          return new Response(JSON.stringify({ url }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Checkout error:", error);
          return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
          });
        }
      },
    },
  },
});
