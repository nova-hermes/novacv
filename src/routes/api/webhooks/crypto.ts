import { createFileRoute } from "@tanstack/react-router";
import { createServerSupabaseClient } from "@/lib/supabase";
import { verifyWebhookSignature, isSupportedCrypto } from "@/lib/server/nowpayments";
import type { Plan } from "@/config/stripe";

/**
 * NOWPayments IPN (webhook) handler.
 * Called when a crypto payment status changes.
 * 
 * Payment statuses:
 * - waiting: waiting for user to send crypto
 * - confirming: payment detected, waiting for blockchain confirmations
 * - confirmed: enough confirmations
 * - finished: payment complete — this is when we upgrade
 * - failed: payment failed
 * - refunded: payment was refunded
 * - partially_paid: user sent less than required
 */
export const Route = createFileRoute("/api/webhooks/crypto")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = await request.text();
          const signature = request.headers.get("x-nowpayments-sig") || "";

          // Verify webhook signature
          if (!verifyWebhookSignature(body, signature)) {
            console.error("[Crypto Webhook] Invalid signature");
            return new Response("Invalid signature", { status: 401 });
          }

          const data = JSON.parse(body);
          console.log("[Crypto Webhook] Received:", JSON.stringify(data));

          const {
            payment_status,
            order_id,
            actually_paid,
            pay_currency,
            payment_id,
          } = data;

          // Only process finished payments
          if (payment_status !== "finished") {
            console.log(`[Crypto Webhook] Ignoring status: ${payment_status}`);
            return new Response("OK", { status: 200 });
          }

          // Parse order_id: novacv_{userId}_{plan}_{timestamp}
          const parts = (order_id || "").split("_");
          if (parts.length < 4 || parts[0] !== "novacv") {
            console.error("[Crypto Webhook] Invalid order_id:", order_id);
            return new Response("Invalid order_id", { status: 400 });
          }

          const userId = parts[1];
          const plan = parts[2] as Plan;

          if (!["pro_monthly", "pro_yearly", "lifetime"].includes(plan)) {
            console.error("[Crypto Webhook] Invalid plan:", plan);
            return new Response("Invalid plan", { status: 400 });
          }

          const supabase = createServerSupabaseClient();

          // Update user plan
          const { error } = await supabase
            .from("users")
            .update({
              plan,
              // Store crypto payment info for reference
              crypto_payment_id: payment_id,
              crypto_paid_amount: actually_paid,
              crypto_paid_currency: pay_currency?.toUpperCase(),
            })
            .eq("id", userId);

          if (error) {
            console.error("[Crypto Webhook] Failed to update user plan:", error);
            return new Response("Update failed", { status: 500 });
          }

          console.log(`[Crypto Webhook] Upgraded user ${userId} to ${plan} via ${pay_currency}`);
          return new Response("OK", { status: 200 });
        } catch (error) {
          console.error("[Crypto Webhook] Error:", error);
          return new Response("Error", { status: 500 });
        }
      },
    },
  },
});
