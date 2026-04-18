import { createFileRoute } from "@tanstack/react-router";
import { authenticateRequest } from "@/lib/server/clerk";
import { createServerSupabaseClient } from "@/lib/supabase";
import { createPayment, isSupportedCrypto } from "@/lib/server/nowpayments";
import { PRICING, type Plan } from "@/config/stripe";

export const Route = createFileRoute("/api/crypto/checkout")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const clerkUser = await authenticateRequest(request);
        if (!clerkUser) {
          return new Response(
            JSON.stringify({ error: "Unauthorized" }),
            { status: 401, headers: { "Content-Type": "application/json" } }
          );
        }

        try {
          const body = await request.json();
          const { plan, crypto } = body as { plan: Plan; crypto: string };

          if (!plan || !PRICING[plan]) {
            return new Response(
              JSON.stringify({ error: "Invalid plan" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          if (!crypto || !isSupportedCrypto(crypto)) {
            return new Response(
              JSON.stringify({ error: "Unsupported crypto. Use BTC, ETH, USDC, or USDT" }),
              { status: 400, headers: { "Content-Type": "application/json" } }
            );
          }

          const supabase = createServerSupabaseClient();

          // Get user from Supabase
          const { data: user, error: userError } = await supabase
            .from("users")
            .select("id")
            .eq("clerk_id", clerkUser.id)
            .single();

          if (userError || !user) {
            return new Response(
              JSON.stringify({ error: "User not found" }),
              { status: 404, headers: { "Content-Type": "application/json" } }
            );
          }

          const planInfo = PRICING[plan];
          const orderId = `novacv_${user.id}_${plan}_${Date.now()}`;

          // Create NOWPayments payment
          const payment = await createPayment({
            priceAmount: planInfo.price,
            priceCurrency: "usd",
            payCurrency: crypto,
            orderId,
            orderDescription: `NovaCV ${planInfo.name} ${planInfo.period}`,
          });

          return new Response(
            JSON.stringify({
              paymentId: payment.paymentId,
              payAddress: payment.payAddress,
              payAmount: payment.payAmount,
              payCurrency: payment.payCurrency,
              priceAmount: payment.priceAmount,
              expiresAt: payment.expirationToDate,
              invoiceUrl: payment.invoiceUrl,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        } catch (error: any) {
          console.error("Crypto checkout error:", error);
          return new Response(
            JSON.stringify({ error: error.message || "Failed to create payment" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
          );
        }
      },
    },
  },
});
