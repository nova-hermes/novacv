/**
 * Server-side Stripe helpers.
 * Used by API routes to create checkout sessions, manage portal, etc.
 */
import Stripe from "stripe";
import { STRIPE_PRICES, type Plan } from "@/config/stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn("STRIPE_SECRET_KEY not set — Stripe features disabled");
}

export const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, { typescript: true })
  : null;

const APP_URL = process.env.APP_URL || "https://novacv-production.up.railway.app";

/**
 * Create or retrieve a Stripe customer for a user.
 */
export async function getOrCreateCustomer(
  email: string,
  clerkId: string,
  existingCustomerId?: string | null
): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");

  if (existingCustomerId) return existingCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { clerkId },
  });

  return customer.id;
}

/**
 * Create a Stripe Checkout session for a plan purchase.
 */
export async function createCheckoutSession(
  customerId: string,
  plan: Plan,
  userId: string
): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");

  const priceId = STRIPE_PRICES[plan];
  if (!priceId) throw new Error(`No price ID configured for plan: ${plan}`);

  const isLifetime = plan === "lifetime";

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: isLifetime ? "payment" : "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${APP_URL}/app/dashboard/billing?success=true`,
    cancel_url: `${APP_URL}/app/dashboard/billing?canceled=true`,
    metadata: {
      userId,
      plan,
    },
    ...(isLifetime
      ? {}
      : {
          subscription_data: {
            metadata: { userId, plan },
          },
        }),
  });

  return session.url!;
}

/**
 * Create a Stripe Customer Portal session for managing subscriptions.
 */
export async function createPortalSession(
  customerId: string
): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${APP_URL}/app/dashboard/billing`,
  });

  return session.url!;
}
