import { createFileRoute } from "@tanstack/react-router";
import { getStripe } from "@/lib/server/stripe";
import { createServerSupabaseClient } from "@/lib/supabase";
import type Stripe from "stripe";
import type { Plan } from "@/config/stripe";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const Route = createFileRoute("/api/webhooks/stripe")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const stripe = getStripe();
        if (!stripe || !webhookSecret) {
          console.error("Stripe or webhook secret not configured");
          return new Response("Stripe not configured", { status: 500 });
        }

        const body = await request.text();
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
          return new Response("Missing signature", { status: 400 });
        }

        let event: Stripe.Event;
        try {
          event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          return new Response("Invalid signature", { status: 400 });
        }

        const supabase = createServerSupabaseClient();

        try {
          switch (event.type) {
            case "checkout.session.completed": {
              const session = event.data.object as Stripe.Checkout.Session;
              const userId = session.metadata?.userId;
              const plan = session.metadata?.plan as Plan;

              if (!userId || !plan) {
                console.error("Missing metadata in checkout session:", session.id);
                break;
              }

              // Update user plan
              await supabase
                .from("users")
                .update({ plan })
                .eq("id", userId);

              // For subscriptions, create subscription record
              if (session.mode === "subscription" && session.subscription) {
                const subscription = await stripe.subscriptions.retrieve(
                  session.subscription as string
                );

                await supabase.from("subscriptions").upsert(
                  {
                    user_id: userId,
                    stripe_sub_id: subscription.id,
                    plan,
                    status: "active",
                    current_period_end: new Date(
                      subscription.current_period_end * 1000
                    ).toISOString(),
                  },
                  { onConflict: "stripe_sub_id" }
                );
              }

              // For lifetime, create a record too
              if (plan === "lifetime") {
                await supabase.from("subscriptions").upsert(
                  {
                    user_id: userId,
                    stripe_sub_id: `lifetime_${userId}`,
                    plan: "lifetime",
                    status: "active",
                    current_period_end: null,
                  },
                  { onConflict: "stripe_sub_id" }
                );
              }

              console.log(`User ${userId} upgraded to ${plan}`);
              break;
            }

            case "customer.subscription.updated": {
              const subscription = event.data.object as Stripe.Subscription;
              const userId = subscription.metadata?.userId;
              const plan = subscription.metadata?.plan as Plan;

              if (!userId) break;

              // Update subscription record
              await supabase
                .from("subscriptions")
                .update({
                  status: subscription.status === "active" ? "active" : subscription.status === "past_due" ? "past_due" : "cancelled",
                  current_period_end: new Date(
                    subscription.current_period_end * 1000
                  ).toISOString(),
                  plan: plan || undefined,
                })
                .eq("stripe_sub_id", subscription.id);

              // If plan changed, update user
              if (plan) {
                await supabase
                  .from("users")
                  .update({ plan })
                  .eq("id", userId);
              }

              console.log(`Subscription ${subscription.id} updated`);
              break;
            }

            case "customer.subscription.deleted": {
              const subscription = event.data.object as Stripe.Subscription;
              const userId = subscription.metadata?.userId;

              if (!userId) break;

              // Downgrade to free
              await supabase
                .from("users")
                .update({ plan: "free" })
                .eq("id", userId);

              await supabase
                .from("subscriptions")
                .update({ status: "cancelled" })
                .eq("stripe_sub_id", subscription.id);

              console.log(`User ${userId} downgraded to free`);
              break;
            }

            case "invoice.payment_failed": {
              const invoice = event.data.object as Stripe.Invoice;
              const subscriptionId = invoice.subscription as string;

              if (subscriptionId) {
                await supabase
                  .from("subscriptions")
                  .update({ status: "past_due" })
                  .eq("stripe_sub_id", subscriptionId);
              }

              console.log(`Payment failed for subscription ${subscriptionId}`);
              break;
            }

            default:
              console.log(`Unhandled event type: ${event.type}`);
          }
        } catch (error) {
          console.error("Webhook handler error:", error);
          return new Response("Handler error", { status: 500 });
        }

        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
